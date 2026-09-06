package com.interviewprep.backend.auth;

import com.interviewprep.backend.auth.dto.AuthResponse;
import com.interviewprep.backend.auth.dto.CurrentUserResponse;
import com.interviewprep.backend.auth.dto.LoginRequest;
import com.interviewprep.backend.board.Board;
import com.interviewprep.backend.board.BoardRepository;
import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.common.UnauthorizedException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final BoardRepository boardRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository
                .findByUsername(request.username())
                .filter(u -> u.getPasswordHash() != null)
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username or password");
        }
        return new AuthResponse(jwtService.issueToken(user), toResponse(user));
    }

    /**
     * Finds the user behind a Google OAuth login, or provisions a brand new one (plus their own
     * empty root board) on first login. Called from {@link OAuth2LoginSuccessHandler}.
     */
    @Transactional
    public AppUser findOrCreateGoogleUser(String googleSub, String email, String displayName) {
        return appUserRepository.findByGoogleSub(googleSub).orElseGet(() -> {
            AppUser user = new AppUser();
            user.setGoogleSub(googleSub);
            user.setEmail(email);
            user.setDisplayName(displayName);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setRole(Role.USER);
            user = appUserRepository.save(user);

            Board rootBoard = new Board();
            rootBoard.setParentNodeId(null);
            rootBoard.setOwnerId(user.getId());
            boardRepository.save(rootBoard);

            return user;
        });
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UUID userId) {
        AppUser user = appUserRepository
                .findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        return toResponse(user);
    }

    private CurrentUserResponse toResponse(AppUser user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAuthProvider(),
                user.getRole());
    }
}
