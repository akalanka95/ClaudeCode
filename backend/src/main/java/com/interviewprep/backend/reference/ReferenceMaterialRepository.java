package com.interviewprep.backend.reference;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferenceMaterialRepository extends JpaRepository<ReferenceMaterial, UUID> {
    List<ReferenceMaterial> findByNodeIdOrderByCreatedAtAsc(UUID nodeId);
}
