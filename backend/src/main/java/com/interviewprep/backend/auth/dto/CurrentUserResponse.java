package com.interviewprep.backend.auth.dto;

import com.interviewprep.backend.auth.AuthProvider;
import com.interviewprep.backend.auth.Role;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id, String username, String email, String displayName, AuthProvider authProvider, Role role) {}
