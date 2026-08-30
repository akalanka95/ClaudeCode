package com.interviewprep.backend.reference;

import com.interviewprep.backend.reference.dto.CreateReferenceMaterialRequest;
import com.interviewprep.backend.reference.dto.ReferenceMaterialResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReferenceMaterialController {

    private final ReferenceMaterialService referenceMaterialService;

    @GetMapping("/api/v1/nodes/{nodeId}/references")
    public List<ReferenceMaterialResponse> listReferences(@PathVariable UUID nodeId) {
        return referenceMaterialService.list(nodeId).stream().map(this::toResponse).toList();
    }

    @PostMapping("/api/v1/nodes/{nodeId}/references")
    public ResponseEntity<ReferenceMaterialResponse> createReference(
            @PathVariable UUID nodeId, @Valid @RequestBody CreateReferenceMaterialRequest request) {
        ReferenceMaterial reference = referenceMaterialService.create(nodeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(reference));
    }

    @DeleteMapping("/api/v1/references/{referenceId}")
    public ResponseEntity<Void> deleteReference(@PathVariable UUID referenceId) {
        referenceMaterialService.delete(referenceId);
        return ResponseEntity.noContent().build();
    }

    private ReferenceMaterialResponse toResponse(ReferenceMaterial reference) {
        return new ReferenceMaterialResponse(
                reference.getId(),
                reference.getNodeId(),
                reference.getUrl(),
                reference.getTitle(),
                reference.getPreviewTitle(),
                reference.getPreviewDescription(),
                reference.getPreviewImageUrl(),
                reference.getCreatedAt());
    }
}
