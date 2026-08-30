package com.interviewprep.backend.noteupload;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteUploadRepository extends JpaRepository<NoteUpload, UUID> {}
