package com.interviewprep.backend.noteupload.dto;

import com.interviewprep.backend.noteupload.NoteUploadStatus;
import java.time.Instant;
import java.util.UUID;

public record NoteUploadResponse(
        UUID id,
        UUID nodeId,
        NoteUploadStatus status,
        String fileName,
        UUID resultNoteBlockId,
        String errorMessage,
        Instant createdAt,
        Instant completedAt) {}
