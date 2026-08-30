package com.interviewprep.backend.noteblock.dto;

import java.time.Instant;
import java.util.UUID;

public record NoteBlockResponse(
        UUID id,
        UUID nodeId,
        String content,
        String color,
        double positionX,
        double positionY,
        double width,
        double height,
        boolean minimized,
        int zIndex,
        Instant createdAt,
        Instant updatedAt) {}
