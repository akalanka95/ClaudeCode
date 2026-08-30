package com.interviewprep.backend.node.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BulkPositionUpdateRequest(@NotEmpty @Valid List<PositionUpdate> positions) {}
