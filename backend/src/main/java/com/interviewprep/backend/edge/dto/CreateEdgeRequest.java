package com.interviewprep.backend.edge.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateEdgeRequest(@NotNull UUID sourceNodeId, @NotNull UUID targetNodeId) {}
