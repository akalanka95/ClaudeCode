package com.interviewprep.backend.board;

import com.interviewprep.backend.board.dto.BoardResponse;
import com.interviewprep.backend.board.dto.BreadcrumbItem;
import com.interviewprep.backend.board.dto.ParentNodeInfo;
import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.edge.EdgeRepository;
import com.interviewprep.backend.edge.dto.EdgeResponse;
import com.interviewprep.backend.node.Node;
import com.interviewprep.backend.node.NodeRepository;
import com.interviewprep.backend.node.dto.NodeResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;

    public UUID getRootBoardId() {
        return boardRepository
                .findByParentNodeIdIsNull()
                .orElseThrow(() -> new IllegalStateException("Root board not seeded"))
                .getId();
    }

    @Transactional(readOnly = true)
    public BoardResponse getBoard(UUID boardId) {
        Board board = boardRepository
                .findById(boardId)
                .orElseThrow(() -> new NotFoundException("Board not found: " + boardId));

        ParentNodeInfo parentNodeInfo = null;
        if (board.getParentNodeId() != null) {
            Node parentNode = findNodeOrThrow(board.getParentNodeId());
            parentNodeInfo =
                    new ParentNodeInfo(parentNode.getId(), parentNode.getLabel(), parentNode.getDetailsContent());
        }

        List<NodeResponse> nodes =
                nodeRepository.findByBoardId(boardId).stream().map(this::toNodeResponse).toList();

        List<EdgeResponse> edges = edgeRepository.findByBoardId(boardId).stream()
                .map(e -> new EdgeResponse(e.getId(), e.getSourceNodeId(), e.getTargetNodeId()))
                .toList();

        List<BreadcrumbItem> breadcrumb = buildBreadcrumb(board);

        return new BoardResponse(boardId, parentNodeInfo, breadcrumb, nodes, edges);
    }

    private List<BreadcrumbItem> buildBreadcrumb(Board board) {
        List<BreadcrumbItem> trail = new ArrayList<>();
        Board current = board;
        while (current.getParentNodeId() != null) {
            Node parentNode = findNodeOrThrow(current.getParentNodeId());
            // current is the board parentNode owns (parentNode.childBoardId == current.id),
            // so that's exactly where clicking this breadcrumb should navigate.
            trail.add(0, new BreadcrumbItem(parentNode.getId(), parentNode.getLabel(), current.getId()));
            current = boardRepository
                    .findById(parentNode.getBoardId())
                    .orElseThrow(() -> new NotFoundException("Board not found: " + parentNode.getBoardId()));
        }
        return trail;
    }

    private Node findNodeOrThrow(UUID nodeId) {
        return nodeRepository
                .findById(nodeId)
                .orElseThrow(() -> new NotFoundException("Node not found: " + nodeId));
    }

    private NodeResponse toNodeResponse(Node node) {
        return new NodeResponse(
                node.getId(),
                node.getType(),
                node.getLabel(),
                node.getNoteText(),
                node.getPositionX(),
                node.getPositionY(),
                node.getChildBoardId(),
                node.getDetailsContent(),
                node.getWidth(),
                node.getHeight());
    }
}
