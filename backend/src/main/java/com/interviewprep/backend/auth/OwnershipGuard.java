package com.interviewprep.backend.auth;

import com.interviewprep.backend.board.Board;
import com.interviewprep.backend.board.BoardRepository;
import com.interviewprep.backend.edge.Edge;
import com.interviewprep.backend.edge.EdgeRepository;
import com.interviewprep.backend.node.Node;
import com.interviewprep.backend.node.NodeRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Central place for "does this row belong to the current user" checks. Only {@code board} (and
 * {@code interview_session}, checked directly against its own {@code owner_id}) carries an
 * owner column — everything else (node, edge, note blocks, uploads, references, sync runs) is
 * scoped transitively through {@code board_id} or {@code node_id -> board_id}, the same
 * sequential-lookup style already used for breadcrumbs, so no schema change was needed for those.
 */
@Component
@RequiredArgsConstructor
public class OwnershipGuard {

    private final BoardRepository boardRepository;
    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;

    public boolean isBoardOwnedBy(UUID boardId, UUID ownerId) {
        return boardRepository
                .findById(boardId)
                .map(Board::getOwnerId)
                .map(ownerId::equals)
                .orElse(false);
    }

    public boolean isNodeOwnedBy(UUID nodeId, UUID ownerId) {
        return nodeRepository
                .findById(nodeId)
                .map(Node::getBoardId)
                .map(boardId -> isBoardOwnedBy(boardId, ownerId))
                .orElse(false);
    }

    public boolean isEdgeOwnedBy(UUID edgeId, UUID ownerId) {
        return edgeRepository
                .findById(edgeId)
                .map(Edge::getBoardId)
                .map(boardId -> isBoardOwnedBy(boardId, ownerId))
                .orElse(false);
    }
}
