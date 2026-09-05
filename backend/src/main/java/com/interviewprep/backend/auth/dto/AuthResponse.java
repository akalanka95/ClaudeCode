package com.interviewprep.backend.auth.dto;

public record AuthResponse(String token, CurrentUserResponse user) {}
