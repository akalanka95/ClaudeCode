package com.interviewprep.backend.sync;

import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.node.NodeRepository;
import com.interviewprep.backend.sync.dto.SyncRunResponse;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SubtopicSyncService {

    private final SubtopicSyncRunRepository syncRunRepository;
    private final NodeRepository nodeRepository;
    private final SubtopicSyncRunner syncRunner;

    @Transactional
    public SubtopicSyncRun triggerSync(UUID nodeId) {
        if (!nodeRepository.existsById(nodeId)) {
            throw new NotFoundException("Node not found: " + nodeId);
        }

        SubtopicSyncRun run = new SubtopicSyncRun();
        run.setNodeId(nodeId);
        run.setStatus(SyncStatus.PENDING);
        run = syncRunRepository.save(run);

        syncRunner.run(run.getId());
        return run;
    }

    @Transactional(readOnly = true)
    public SubtopicSyncRun getRun(UUID nodeId, UUID runId) {
        SubtopicSyncRun run = syncRunRepository
                .findById(runId)
                .orElseThrow(() -> new NotFoundException("Sync run not found: " + runId));
        if (!run.getNodeId().equals(nodeId)) {
            throw new NotFoundException("Sync run not found: " + runId);
        }
        return run;
    }

    @Transactional(readOnly = true)
    public List<SubtopicSyncRun> getHistory(UUID nodeId) {
        if (!nodeRepository.existsById(nodeId)) {
            throw new NotFoundException("Node not found: " + nodeId);
        }
        return syncRunRepository.findByNodeIdOrderByCreatedAtDesc(nodeId);
    }

    public static SyncRunResponse toResponse(SubtopicSyncRun run) {
        return new SyncRunResponse(
                run.getId(),
                run.getNodeId(),
                run.getStatus(),
                run.getSummary(),
                run.getLinks(),
                run.getErrorMessage(),
                run.getCreatedAt(),
                run.getCompletedAt());
    }
}
