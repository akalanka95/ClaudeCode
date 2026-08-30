package com.interviewprep.backend.board.dto;

import java.util.UUID;

public record ParentNodeInfo(UUID id, String label, String detailsContent) {}
