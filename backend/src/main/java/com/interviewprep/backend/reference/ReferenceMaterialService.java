package com.interviewprep.backend.reference;

import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.node.NodeRepository;
import com.interviewprep.backend.reference.dto.CreateReferenceMaterialRequest;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReferenceMaterialService {

    private final ReferenceMaterialRepository referenceMaterialRepository;
    private final NodeRepository nodeRepository;
    private final LinkPreviewFetcher linkPreviewFetcher;

    @Transactional(readOnly = true)
    public List<ReferenceMaterial> list(UUID nodeId) {
        requireNode(nodeId);
        return referenceMaterialRepository.findByNodeIdOrderByCreatedAtAsc(nodeId);
    }

    @Transactional
    public ReferenceMaterial create(UUID nodeId, CreateReferenceMaterialRequest request) {
        requireNode(nodeId);
        ReferenceMaterial reference = new ReferenceMaterial();
        reference.setNodeId(nodeId);
        reference.setUrl(request.url());
        reference.setTitle(request.title());

        LinkPreview preview = linkPreviewFetcher.fetch(request.url());
        reference.setPreviewTitle(preview.title());
        reference.setPreviewDescription(preview.description());
        reference.setPreviewImageUrl(preview.imageUrl());

        return referenceMaterialRepository.save(reference);
    }

    @Transactional
    public void delete(UUID referenceId) {
        if (!referenceMaterialRepository.existsById(referenceId)) {
            throw new NotFoundException("Reference material not found: " + referenceId);
        }
        referenceMaterialRepository.deleteById(referenceId);
    }

    private void requireNode(UUID nodeId) {
        if (!nodeRepository.existsById(nodeId)) {
            throw new NotFoundException("Node not found: " + nodeId);
        }
    }
}
