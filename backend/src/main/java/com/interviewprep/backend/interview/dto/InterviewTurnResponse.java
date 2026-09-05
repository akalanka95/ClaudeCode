package com.interviewprep.backend.interview.dto;

import com.interviewprep.backend.interview.InterviewTurnStatus;
import java.util.UUID;

public record InterviewTurnResponse(
        UUID id,
        int turnIndex,
        String question,
        String answer,
        Integer score,
        String graderFeedback,
        String coachFeedback,
        InterviewTurnStatus status) {}
