package com.interviewprep.backend.interview;

import com.interviewprep.backend.auth.AppUserPrincipal;
import com.interviewprep.backend.interview.dto.CreateInterviewSessionRequest;
import com.interviewprep.backend.interview.dto.InterviewSessionResponse;
import com.interviewprep.backend.interview.dto.SubmitAnswerRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
public class InterviewSessionController {

    private static final long SSE_TIMEOUT_MILLIS = 5 * 60 * 1000L;

    private final InterviewSessionService interviewSessionService;

    @PostMapping("/api/v1/interview/sessions")
    public ResponseEntity<InterviewSessionResponse> createSession(
            @Valid @RequestBody CreateInterviewSessionRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interviewSessionService.createSession(request, principal.userId()));
    }

    @GetMapping("/api/v1/interview/sessions")
    public List<InterviewSessionResponse> listSessions(@AuthenticationPrincipal AppUserPrincipal principal) {
        return interviewSessionService.listSessions(principal.userId());
    }

    @GetMapping("/api/v1/interview/sessions/{sessionId}")
    public InterviewSessionResponse getSession(
            @PathVariable UUID sessionId, @AuthenticationPrincipal AppUserPrincipal principal) {
        return interviewSessionService.getSession(sessionId, principal.userId());
    }

    @PostMapping("/api/v1/interview/sessions/{sessionId}/turns/{turnIndex}/answer")
    public SseEmitter submitAnswer(
            @PathVariable UUID sessionId,
            @PathVariable int turnIndex,
            @Valid @RequestBody SubmitAnswerRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MILLIS);
        interviewSessionService.submitAnswer(sessionId, turnIndex, request.answer(), emitter, principal.userId());
        return emitter;
    }
}
