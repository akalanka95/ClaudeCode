package com.interviewprep.backend.interview;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewTurnRepository extends JpaRepository<InterviewTurn, UUID> {
    List<InterviewTurn> findBySessionIdOrderByTurnIndexAsc(UUID sessionId);

    Optional<InterviewTurn> findBySessionIdAndTurnIndex(UUID sessionId, int turnIndex);
}
