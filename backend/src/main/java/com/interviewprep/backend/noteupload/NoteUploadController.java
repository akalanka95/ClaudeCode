package com.interviewprep.backend.noteupload;

import com.interviewprep.backend.noteupload.dto.NoteUploadResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class NoteUploadController {

    private final NoteUploadService noteUploadService;

    @PostMapping("/api/v1/nodes/{nodeId}/note-uploads")
    public ResponseEntity<NoteUploadResponse> uploadAndSummarize(
            @PathVariable UUID nodeId, @RequestParam("file") MultipartFile file) {
        NoteUpload upload = noteUploadService.triggerSummarize(nodeId, file);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(toResponse(upload));
    }

    @GetMapping("/api/v1/nodes/{nodeId}/note-uploads/{uploadId}")
    public NoteUploadResponse getUpload(@PathVariable UUID nodeId, @PathVariable UUID uploadId) {
        return toResponse(noteUploadService.getUpload(nodeId, uploadId));
    }

    private NoteUploadResponse toResponse(NoteUpload upload) {
        return new NoteUploadResponse(
                upload.getId(),
                upload.getNodeId(),
                upload.getStatus(),
                upload.getFileName(),
                upload.getResultNoteBlockId(),
                upload.getErrorMessage(),
                upload.getCreatedAt(),
                upload.getCompletedAt());
    }
}
