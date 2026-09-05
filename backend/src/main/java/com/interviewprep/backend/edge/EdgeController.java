package com.interviewprep.backend.edge;

import com.interviewprep.backend.auth.AppUserPrincipal;
import com.interviewprep.backend.edge.dto.CreateEdgeRequest;
import com.interviewprep.backend.edge.dto.EdgeResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class EdgeController {

    private final EdgeService edgeService;

    @PostMapping("/api/v1/boards/{boardId}/edges")
    public ResponseEntity<EdgeResponse> createEdge(
            @PathVariable UUID boardId,
            @Valid @RequestBody CreateEdgeRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        Edge edge = edgeService.createEdge(boardId, request, principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(edge));
    }

    @DeleteMapping("/api/v1/edges/{edgeId}")
    public ResponseEntity<Void> deleteEdge(
            @PathVariable UUID edgeId, @AuthenticationPrincipal AppUserPrincipal principal) {
        edgeService.deleteEdge(edgeId, principal.userId());
        return ResponseEntity.noContent().build();
    }

    private EdgeResponse toResponse(Edge edge) {
        return new EdgeResponse(edge.getId(), edge.getSourceNodeId(), edge.getTargetNodeId());
    }
}
