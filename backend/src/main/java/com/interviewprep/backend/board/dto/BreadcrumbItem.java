package com.interviewprep.backend.board.dto;

import java.util.UUID;

public record BreadcrumbItem(UUID nodeId, String label, UUID boardId) {}
