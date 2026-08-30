package com.interviewprep.backend.reference.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateReferenceMaterialRequest(@NotBlank String url, String title) {}
