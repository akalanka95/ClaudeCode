package com.interviewprep.backend.node.dto;

import java.util.List;
import java.util.UUID;

public record TopicOptionResponse(UUID nodeId, String label, UUID boardId, List<String> path) {}
