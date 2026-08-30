package com.interviewprep.backend.sync;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubtopicSyncRunRepository extends JpaRepository<SubtopicSyncRun, UUID> {
    List<SubtopicSyncRun> findByNodeIdOrderByCreatedAtDesc(UUID nodeId);

    Optional<SubtopicSyncRun> findFirstByNodeIdAndStatusOrderByCreatedAtDesc(UUID nodeId, SyncStatus status);
}
