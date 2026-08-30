package com.interviewprep.backend.node.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PositionUpdate(@NotNull UUID nodeId, @NotNull Double positionX, @NotNull Double positionY) {}
