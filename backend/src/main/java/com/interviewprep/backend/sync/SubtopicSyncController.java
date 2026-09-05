package com.interviewprep.backend.sync;

import com.interviewprep.backend.auth.AppUserPrincipal;
import com.interviewprep.backend.sync.dto.SyncRunResponse;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SubtopicSyncController {

    private final SubtopicSyncService syncService;

    @PostMapping("/api/v1/nodes/{nodeId}/sync-runs")
    public ResponseEntity<SyncRunResponse> triggerSync(
            @PathVariable UUID nodeId, @AuthenticationPrincipal AppUserPrincipal principal) {
        SubtopicSyncRun run = syncService.triggerSync(nodeId, principal.userId());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(SubtopicSyncService.toResponse(run));
    }

    @GetMapping("/api/v1/nodes/{nodeId}/sync-runs/{runId}")
    public SyncRunResponse getSyncRun(
            @PathVariable UUID nodeId,
            @PathVariable UUID runId,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return SubtopicSyncService.toResponse(syncService.getRun(nodeId, runId, principal.userId()));
    }

    @GetMapping("/api/v1/nodes/{nodeId}/sync-runs")
    public List<SyncRunResponse> getSyncHistory(
            @PathVariable UUID nodeId, @AuthenticationPrincipal AppUserPrincipal principal) {
        return syncService.getHistory(nodeId, principal.userId()).stream()
                .map(SubtopicSyncService::toResponse)
                .toList();
    }
}
