package com.interviewprep.backend.noteblock;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteBlockRepository extends JpaRepository<NoteBlock, UUID> {
    List<NoteBlock> findByNodeIdOrderByCreatedAtAsc(UUID nodeId);
}
