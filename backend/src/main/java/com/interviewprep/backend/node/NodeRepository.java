package com.interviewprep.backend.node;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NodeRepository extends JpaRepository<Node, UUID> {
    List<Node> findByBoardId(UUID boardId);

    List<Node> findByBoardIdIn(List<UUID> boardIds);

    int countByBoardIdAndType(UUID boardId, NodeType type);

    int countByBoardIdAndTypeAndCompletedTrue(UUID boardId, NodeType type);
}
