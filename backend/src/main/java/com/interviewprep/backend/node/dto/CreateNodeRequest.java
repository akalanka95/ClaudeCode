package com.interviewprep.backend.node.dto;

import com.interviewprep.backend.node.NodeType;
import jakarta.validation.constraints.NotNull;

public record CreateNodeRequest(
        @NotNull NodeType type,
        String label,
        String noteText,
        @NotNull Double positionX,
        @NotNull Double positionY) {}
