package com.interviewprep.backend.auth;

import java.util.UUID;

/**
 * The JWT-authenticated principal set on the security context by {@link JwtAuthenticationFilter}.
 * Controllers pull the current user's id out of this via {@code @AuthenticationPrincipal} and
 * pass it down to service methods for ownership checks (see {@link OwnershipGuard}).
 */
public record AppUserPrincipal(UUID userId, String username, String displayName) {}
