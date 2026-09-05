package com.interviewprep.backend.node;

import com.interviewprep.backend.auth.OwnershipGuard;
import com.interviewprep.backend.board.Board;
import com.interviewprep.backend.board.BoardRepository;
import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.node.dto.BulkPositionUpdateRequest;
import com.interviewprep.backend.node.dto.CreateNodeRequest;
import com.interviewprep.backend.node.dto.PositionUpdate;
import com.interviewprep.backend.node.dto.TopicOptionResponse;
import com.interviewprep.backend.node.dto.UpdateDetailsRequest;
import com.interviewprep.backend.node.dto.UpdateNodeRequest;
import com.interviewprep.backend.search.SearchService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NodeService {

    private final NodeRepository nodeRepository;
    private final BoardRepository boardRepository;
    private final SearchService searchService;
    private final OwnershipGuard ownershipGuard;

    @Transactional
    public Node createNode(UUID boardId, CreateNodeRequest request, UUID ownerId) {
        Board board = boardRepository
                .findById(boardId)
                .filter(b -> b.getOwnerId().equals(ownerId))
                .orElseThrow(() -> new NotFoundException("Board not found: " + boardId));
        if (request.type() == NodeType.TOPIC && (request.label() == null || request.label().isBlank())) {
            throw new IllegalArgumentException("label is required for TOPIC nodes");
        }

        Node node = new Node();
        node.setBoardId(boardId);
        node.setType(request.type());
        node.setLabel(request.label());
        node.setNoteText(request.noteText());
        node.setPositionX(request.positionX());
        node.setPositionY(request.positionY());
        node = nodeRepository.save(node);

        // Two-step insert avoids a deferred/circular FK: the node is persisted first
        // (child_board_id null), then its child board is created referencing the now-existing
        // node id, then the node is updated to point at that board.
        if (request.type() == NodeType.TOPIC) {
            Board childBoard = new Board();
            childBoard.setParentNodeId(node.getId());
            childBoard.setOwnerId(board.getOwnerId());
            childBoard = boardRepository.save(childBoard);

            node.setChildBoardId(childBoard.getId());
            node = nodeRepository.save(node);
        }

        searchService.indexNode(node);
        return node;
    }

    @Transactional
    public Node updateNode(UUID nodeId, UpdateNodeRequest request, UUID ownerId) {
        Node node = getOrThrow(nodeId, ownerId);
        boolean textChanged = request.label() != null || request.noteText() != null;
        if (request.label() != null) {
            node.setLabel(request.label());
        }
        if (request.noteText() != null) {
            node.setNoteText(request.noteText());
        }
        if (request.positionX() != null) {
            node.setPositionX(request.positionX());
        }
        if (request.positionY() != null) {
            node.setPositionY(request.positionY());
        }
        if (request.width() != null) {
            node.setWidth(request.width());
        }
        if (request.height() != null) {
            node.setHeight(request.height());
        }
        if (request.completed() != null) {
            node.setCompleted(request.completed());
        }
        node = nodeRepository.save(node);
        if (textChanged) {
            searchService.indexNode(node);
        }
        return node;
    }

    @Transactional
    public Node updateDetails(UUID nodeId, UpdateDetailsRequest request, UUID ownerId) {
        Node node = getOrThrow(nodeId, ownerId);
        node.setDetailsContent(request.detailsContent());
        node = nodeRepository.save(node);
        searchService.indexNode(node);
        return node;
    }

    @Transactional
    public void updatePositions(UUID boardId, BulkPositionUpdateRequest request, UUID ownerId) {
        if (!ownershipGuard.isBoardOwnedBy(boardId, ownerId)) {
            throw new NotFoundException("Board not found: " + boardId);
        }
        for (PositionUpdate update : request.positions()) {
            Node node = getOrThrow(update.nodeId(), ownerId);
            if (!node.getBoardId().equals(boardId)) {
                throw new IllegalArgumentException(
                        "Node " + update.nodeId() + " does not belong to board " + boardId);
            }
            node.setPositionX(update.positionX());
            node.setPositionY(update.positionY());
            nodeRepository.save(node);
        }
    }

    @Transactional
    public void deleteNode(UUID nodeId, UUID ownerId) {
        getOrThrow(nodeId, ownerId);
        nodeRepository.deleteById(nodeId);
        searchService.removeNodeFromIndex(nodeId);
    }

    public Node getOrThrow(UUID nodeId, UUID ownerId) {
        if (!ownershipGuard.isNodeOwnedBy(nodeId, ownerId)) {
            throw new NotFoundException("Node not found: " + nodeId);
        }
        return nodeRepository
                .findById(nodeId)
                .orElseThrow(() -> new NotFoundException("Node not found: " + nodeId));
    }

    /**
     * Flat list of every TOPIC node across all boards, each with its ancestor breadcrumb, for a
     * cross-map topic picker (e.g. the mock-interview setup page). Loads every board/node into
     * memory rather than a recursive SQL query — the whole map is small enough at this project's
     * scale, and building the ancestor chain in Java matches how breadcrumbs are already built
     * elsewhere.
     */
    @Transactional(readOnly = true)
    public List<TopicOptionResponse> listAllTopics(UUID ownerId) {
        Map<UUID, Board> boardById = new HashMap<>();
        for (Board board : boardRepository.findAllByOwnerId(ownerId)) {
            boardById.put(board.getId(), board);
        }
        Map<UUID, Node> nodeById = new HashMap<>();
        for (Node node : nodeRepository.findByBoardIdIn(new ArrayList<>(boardById.keySet()))) {
            nodeById.put(node.getId(), node);
        }

        List<TopicOptionResponse> topics = new ArrayList<>();
        for (Node node : nodeById.values()) {
            if (node.getType() != NodeType.TOPIC) {
                continue;
            }
            topics.add(new TopicOptionResponse(
                    node.getId(), node.getLabel(), node.getBoardId(), ancestorPath(node, boardById, nodeById)));
        }
        topics.sort(Comparator.comparing(t -> String.join(" > ", t.path()) + " > " + t.label()));
        return topics;
    }

    private List<String> ancestorPath(Node node, Map<UUID, Board> boardById, Map<UUID, Node> nodeById) {
        List<String> path = new ArrayList<>();
        UUID currentBoardId = node.getBoardId();
        while (currentBoardId != null) {
            Board board = boardById.get(currentBoardId);
            if (board == null || board.getParentNodeId() == null) {
                break;
            }
            Node ownerNode = nodeById.get(board.getParentNodeId());
            if (ownerNode == null) {
                break;
            }
            path.add(0, ownerNode.getLabel());
            currentBoardId = ownerNode.getBoardId();
        }
        return path;
    }
}
