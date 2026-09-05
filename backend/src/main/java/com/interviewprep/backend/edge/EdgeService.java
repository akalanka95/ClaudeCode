package com.interviewprep.backend.edge;

import com.interviewprep.backend.auth.OwnershipGuard;
import com.interviewprep.backend.board.Board;
import com.interviewprep.backend.board.BoardRepository;
import com.interviewprep.backend.common.ConflictException;
import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.edge.dto.CreateEdgeRequest;
import com.interviewprep.backend.node.Node;
import com.interviewprep.backend.node.NodeRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EdgeService {

    private final EdgeRepository edgeRepository;
    private final NodeRepository nodeRepository;
    private final BoardRepository boardRepository;
    private final OwnershipGuard ownershipGuard;

    @Transactional
    public Edge createEdge(UUID boardId, CreateEdgeRequest request, UUID ownerId) {
        Board board = boardRepository
                .findById(boardId)
                .filter(b -> b.getOwnerId().equals(ownerId))
                .orElseThrow(() -> new NotFoundException("Board not found: " + boardId));
        Node source = nodeRepository
                .findById(request.sourceNodeId())
                .orElseThrow(() -> new NotFoundException("Source or target node not found"));
        Node target = nodeRepository
                .findById(request.targetNodeId())
                .orElseThrow(() -> new NotFoundException("Source or target node not found"));

        requireOnBoardOrParent(source, board, boardId);
        requireOnBoardOrParent(target, board, boardId);

        if (edgeRepository.existsByBoardIdAndSourceNodeIdAndTargetNodeId(
                boardId, request.sourceNodeId(), request.targetNodeId())) {
            throw new ConflictException("Edge already exists between these nodes");
        }
        Edge edge = new Edge();
        edge.setBoardId(boardId);
        edge.setSourceNodeId(request.sourceNodeId());
        edge.setTargetNodeId(request.targetNodeId());
        return edgeRepository.save(edge);
    }

    /**
     * Edges are otherwise scoped to a single board — the one documented exception is the
     * read-only parent-topic anchor shown on a subtopic board, which lives on a different board
     * (the one this board's parent node owns).
     */
    private void requireOnBoardOrParent(Node node, Board board, UUID boardId) {
        boolean onBoard = node.getBoardId().equals(boardId);
        boolean isParentAnchor = node.getId().equals(board.getParentNodeId());
        if (!onBoard && !isParentAnchor) {
            throw new IllegalArgumentException(
                    "Node " + node.getId() + " does not belong to board " + boardId);
        }
    }

    @Transactional
    public void deleteEdge(UUID edgeId, UUID ownerId) {
        if (!ownershipGuard.isEdgeOwnedBy(edgeId, ownerId)) {
            throw new NotFoundException("Edge not found: " + edgeId);
        }
        edgeRepository.deleteById(edgeId);
    }
}
