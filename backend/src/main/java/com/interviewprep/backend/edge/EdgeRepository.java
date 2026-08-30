package com.interviewprep.backend.edge;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EdgeRepository extends JpaRepository<Edge, UUID> {
    List<Edge> findByBoardId(UUID boardId);

    boolean existsByBoardIdAndSourceNodeIdAndTargetNodeId(
            UUID boardId, UUID sourceNodeId, UUID targetNodeId);
}
