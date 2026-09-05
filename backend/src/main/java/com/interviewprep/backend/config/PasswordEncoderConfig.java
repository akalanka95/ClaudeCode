package com.interviewprep.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Split out of {@link SecurityConfig} so that {@code AuthService} (which needs a
 * {@link PasswordEncoder}) doesn't pull in the whole security filter chain config — that config
 * depends on {@code OAuth2LoginSuccessHandler}, which depends on {@code AuthService}, which would
 * otherwise close a circular bean-creation loop.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
