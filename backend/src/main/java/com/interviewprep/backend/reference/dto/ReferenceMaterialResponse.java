package com.interviewprep.backend.reference.dto;

import java.time.Instant;
import java.util.UUID;

public record ReferenceMaterialResponse(
        UUID id,
        UUID nodeId,
        String url,
        String title,
        String previewTitle,
        String previewDescription,
        String previewImageUrl,
        Instant createdAt) {}
