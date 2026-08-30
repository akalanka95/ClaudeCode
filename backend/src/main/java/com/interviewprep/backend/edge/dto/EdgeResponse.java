package com.interviewprep.backend.edge.dto;

import java.util.UUID;

public record EdgeResponse(UUID id, UUID sourceNodeId, UUID targetNodeId) {}
