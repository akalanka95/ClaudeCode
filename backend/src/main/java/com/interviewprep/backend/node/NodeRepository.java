package com.interviewprep.backend.node;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NodeRepository extends JpaRepository<Node, UUID> {
    List<Node> findByBoardId(UUID boardId);
}
