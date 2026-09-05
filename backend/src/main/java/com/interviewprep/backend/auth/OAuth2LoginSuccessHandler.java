package com.interviewprep.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * Runs once Spring Security's OAuth2 client has completed the Google login handshake. Finds or
 * provisions the {@link AppUser} behind the Google account, issues our own JWT, and hands the
 * browser back to the SPA with that token — the frontend never talks to Google directly.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtService jwtService;
    private final String frontendRedirectBaseUrl;

    public OAuth2LoginSuccessHandler(
            AuthService authService,
            JwtService jwtService,
            @Value("${app.oauth.frontend-redirect-base-url}") String frontendRedirectBaseUrl) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.frontendRedirectBaseUrl = frontendRedirectBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String googleSub = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String displayName = oAuth2User.getAttribute("name");

        AppUser user = authService.findOrCreateGoogleUser(googleSub, email, displayName);
        String token = jwtService.issueToken(user);

        String redirectUrl = frontendRedirectBaseUrl + "/oauth/callback#token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }
}
