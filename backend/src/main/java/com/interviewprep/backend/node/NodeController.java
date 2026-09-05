package com.interviewprep.backend.node;

import com.interviewprep.backend.node.dto.BulkPositionUpdateRequest;
import com.interviewprep.backend.node.dto.CreateNodeRequest;
import com.interviewprep.backend.node.dto.NodeResponse;
import com.interviewprep.backend.node.dto.TopicOptionResponse;
import com.interviewprep.backend.node.dto.UpdateDetailsRequest;
import com.interviewprep.backend.node.dto.UpdateNodeRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class NodeController {

    private final NodeService nodeService;
    private final NodeMapper nodeMapper;

    @GetMapping("/api/v1/nodes/topics")
    public List<TopicOptionResponse> listTopics() {
        return nodeService.listAllTopics();
    }

    @GetMapping("/api/v1/nodes/{nodeId}")
    public NodeResponse getNode(@PathVariable UUID nodeId) {
        return nodeMapper.toResponse(nodeService.getOrThrow(nodeId));
    }

    @PostMapping("/api/v1/boards/{boardId}/nodes")
    public ResponseEntity<NodeResponse> createNode(
            @PathVariable UUID boardId, @Valid @RequestBody CreateNodeRequest request) {
        Node node = nodeService.createNode(boardId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(nodeMapper.toResponse(node));
    }

    @PatchMapping("/api/v1/nodes/{nodeId}")
    public NodeResponse updateNode(@PathVariable UUID nodeId, @RequestBody UpdateNodeRequest request) {
        return nodeMapper.toResponse(nodeService.updateNode(nodeId, request));
    }

    @PatchMapping("/api/v1/nodes/{nodeId}/details")
    public NodeResponse updateDetails(@PathVariable UUID nodeId, @RequestBody UpdateDetailsRequest request) {
        return nodeMapper.toResponse(nodeService.updateDetails(nodeId, request));
    }

    @PatchMapping("/api/v1/boards/{boardId}/nodes/positions")
    public ResponseEntity<Void> updatePositions(
            @PathVariable UUID boardId, @Valid @RequestBody BulkPositionUpdateRequest request) {
        nodeService.updatePositions(boardId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/v1/nodes/{nodeId}")
    public ResponseEntity<Void> deleteNode(@PathVariable UUID nodeId) {
        nodeService.deleteNode(nodeId);
        return ResponseEntity.noContent().build();
    }
}
