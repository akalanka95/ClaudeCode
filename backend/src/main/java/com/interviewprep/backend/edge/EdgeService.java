package com.interviewprep.backend.edge;

import com.interviewprep.backend.common.ConflictException;
import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.edge.dto.CreateEdgeRequest;
import com.interviewprep.backend.node.NodeRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EdgeService {

    private final EdgeRepository edgeRepository;
    private final NodeRepository nodeRepository;

    @Transactional
    public Edge createEdge(UUID boardId, CreateEdgeRequest request) {
        if (!nodeRepository.existsById(request.sourceNodeId())
                || !nodeRepository.existsById(request.targetNodeId())) {
            throw new NotFoundException("Source or target node not found");
        }
        if (edgeRepository.existsByBoardIdAndSourceNodeIdAndTargetNodeId(
                boardId, request.sourceNodeId(), request.targetNodeId())) {
            throw new ConflictException("Edge already exists between these nodes");
        }
        Edge edge = new Edge();
        edge.setBoardId(boardId);
        edge.setSourceNodeId(request.sourceNodeId());
        edge.setTargetNodeId(request.targetNodeId());
        return edgeRepository.save(edge);
    }

    @Transactional
    public void deleteEdge(UUID edgeId) {
        if (!edgeRepository.existsById(edgeId)) {
            throw new NotFoundException("Edge not found: " + edgeId);
        }
        edgeRepository.deleteById(edgeId);
    }
}
