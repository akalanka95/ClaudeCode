package com.interviewprep.backend.interview.dto;

import com.interviewprep.backend.interview.InterviewSessionStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record InterviewSessionResponse(
        UUID id,
        List<InterviewTopicSnapshot> topics,
        InterviewSessionStatus status,
        int totalQuestions,
        int currentTurnIndex,
        Double overallScore,
        Instant createdAt,
        Instant completedAt,
        List<InterviewTurnResponse> turns) {}
