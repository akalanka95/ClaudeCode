package com.interviewprep.backend.noteupload;

import com.interviewprep.backend.auth.OwnershipGuard;
import com.interviewprep.backend.common.NotFoundException;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class NoteUploadService {

    private static final Set<String> ALLOWED_MIME_TYPES =
            Set.of("image/png", "image/jpeg", "application/pdf");
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;

    private final NoteUploadRepository noteUploadRepository;
    private final OwnershipGuard ownershipGuard;
    private final NoteUploadRunner noteUploadRunner;

    public NoteUpload triggerSummarize(UUID nodeId, MultipartFile file, UUID ownerId) {
        if (!ownershipGuard.isNodeOwnedBy(nodeId, ownerId)) {
            throw new NotFoundException("Node not found: " + nodeId);
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file is required");
        }
        if (!ALLOWED_MIME_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "Unsupported file type: " + file.getContentType() + " (allowed: PDF, PNG, JPEG)");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds the 10MB upload limit");
        }

        // Deliberately not @Transactional: save() must commit before the async dispatch below, or
        // the background thread can query for this row before an enclosing transaction commits it,
        // find nothing, and quietly bail — leaving the run stuck at PENDING forever (same reasoning
        // as SubtopicSyncService.triggerSync).
        NoteUpload upload = new NoteUpload();
        upload.setNodeId(nodeId);
        upload.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");
        upload.setMimeType(file.getContentType());
        upload.setStatus(NoteUploadStatus.PENDING);
        upload = noteUploadRepository.save(upload);

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to read uploaded file: " + e.getMessage());
        }

        noteUploadRunner.run(upload.getId(), fileBytes, upload.getMimeType());
        return upload;
    }

    @Transactional(readOnly = true)
    public NoteUpload getUpload(UUID nodeId, UUID uploadId, UUID ownerId) {
        if (!ownershipGuard.isNodeOwnedBy(nodeId, ownerId)) {
            throw new NotFoundException("Note upload not found: " + uploadId);
        }
        NoteUpload upload = noteUploadRepository
                .findById(uploadId)
                .orElseThrow(() -> new NotFoundException("Note upload not found: " + uploadId));
        if (!upload.getNodeId().equals(nodeId)) {
            throw new NotFoundException("Note upload not found: " + uploadId);
        }
        return upload;
    }
}
