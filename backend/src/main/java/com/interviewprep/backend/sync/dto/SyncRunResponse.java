package com.interviewprep.backend.sync.dto;

import com.interviewprep.backend.sync.SyncStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SyncRunResponse(
        UUID id,
        UUID nodeId,
        SyncStatus status,
        String summary,
        List<SyncLink> links,
        String errorMessage,
        Instant createdAt,
        Instant completedAt) {}
