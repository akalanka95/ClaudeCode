package com.interviewprep.backend.reference;

import com.interviewprep.backend.auth.OwnershipGuard;
import com.interviewprep.backend.common.NotFoundException;
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
    private final OwnershipGuard ownershipGuard;
    private final LinkPreviewFetcher linkPreviewFetcher;

    @Transactional(readOnly = true)
    public List<ReferenceMaterial> list(UUID nodeId, UUID ownerId) {
        requireNode(nodeId, ownerId);
        return referenceMaterialRepository.findByNodeIdOrderByCreatedAtAsc(nodeId);
    }

    @Transactional
    public ReferenceMaterial create(UUID nodeId, CreateReferenceMaterialRequest request, UUID ownerId) {
        requireNode(nodeId, ownerId);
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
    public void delete(UUID referenceId, UUID ownerId) {
        ReferenceMaterial reference = referenceMaterialRepository
                .findById(referenceId)
                .filter(r -> ownershipGuard.isNodeOwnedBy(r.getNodeId(), ownerId))
                .orElseThrow(() -> new NotFoundException("Reference material not found: " + referenceId));
        referenceMaterialRepository.deleteById(reference.getId());
    }

    private void requireNode(UUID nodeId, UUID ownerId) {
        if (!ownershipGuard.isNodeOwnedBy(nodeId, ownerId)) {
            throw new NotFoundException("Node not found: " + nodeId);
        }
    }
}
