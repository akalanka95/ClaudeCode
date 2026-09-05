package com.interviewprep.backend.interview.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record CreateInterviewSessionRequest(@NotEmpty List<UUID> topicNodeIds, Integer questionCount) {}
