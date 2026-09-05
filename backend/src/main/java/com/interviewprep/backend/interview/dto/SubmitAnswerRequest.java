package com.interviewprep.backend.interview.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitAnswerRequest(@NotBlank String answer) {}
