package com.interviewprep.backend.noteblock;

import com.interviewprep.backend.auth.AppUserPrincipal;
import com.interviewprep.backend.noteblock.dto.CreateNoteBlockRequest;
import com.interviewprep.backend.noteblock.dto.NoteBlockResponse;
import com.interviewprep.backend.noteblock.dto.UpdateNoteBlockRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class NoteBlockController {

    private final NoteBlockService noteBlockService;

    @GetMapping("/api/v1/nodes/{nodeId}/note-blocks")
    public List<NoteBlockResponse> listNoteBlocks(
            @PathVariable UUID nodeId, @AuthenticationPrincipal AppUserPrincipal principal) {
        return noteBlockService.list(nodeId, principal.userId()).stream().map(this::toResponse).toList();
    }

    @PostMapping("/api/v1/nodes/{nodeId}/note-blocks")
    public ResponseEntity<NoteBlockResponse> createNoteBlock(
            @PathVariable UUID nodeId,
            @Valid @RequestBody CreateNoteBlockRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        NoteBlock noteBlock = noteBlockService.create(nodeId, request, principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(noteBlock));
    }

    @PatchMapping("/api/v1/note-blocks/{noteBlockId}")
    public NoteBlockResponse updateNoteBlock(
            @PathVariable UUID noteBlockId,
            @Valid @RequestBody UpdateNoteBlockRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return toResponse(noteBlockService.update(noteBlockId, request, principal.userId()));
    }

    @DeleteMapping("/api/v1/note-blocks/{noteBlockId}")
    public ResponseEntity<Void> deleteNoteBlock(
            @PathVariable UUID noteBlockId, @AuthenticationPrincipal AppUserPrincipal principal) {
        noteBlockService.delete(noteBlockId, principal.userId());
        return ResponseEntity.noContent().build();
    }

    private NoteBlockResponse toResponse(NoteBlock noteBlock) {
        return new NoteBlockResponse(
                noteBlock.getId(),
                noteBlock.getNodeId(),
                noteBlock.getContent(),
                noteBlock.getColor(),
                noteBlock.getPositionX(),
                noteBlock.getPositionY(),
                noteBlock.getWidth(),
                noteBlock.getHeight(),
                noteBlock.isMinimized(),
                noteBlock.getZIndex(),
                noteBlock.getCreatedAt(),
                noteBlock.getUpdatedAt());
    }
}
