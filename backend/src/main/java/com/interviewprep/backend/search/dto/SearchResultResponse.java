package com.interviewprep.backend.search.dto;

import com.interviewprep.backend.node.NodeType;
import java.util.UUID;

public record SearchResultResponse(
        UUID nodeId, NodeType type, String label, UUID boardId, String snippet, double score) {}
