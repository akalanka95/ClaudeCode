package com.interviewprep.backend.interview;

import com.interviewprep.backend.auth.OwnershipGuard;
import com.interviewprep.backend.board.Board;
import com.interviewprep.backend.board.BoardRepository;
import com.interviewprep.backend.common.ConflictException;
import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.interview.agent.CoachAgent;
import com.interviewprep.backend.interview.agent.GraderAgent;
import com.interviewprep.backend.interview.agent.InterviewerAgent;
import com.interviewprep.backend.interview.dto.CreateInterviewSessionRequest;
import com.interviewprep.backend.interview.dto.InterviewSessionResponse;
import com.interviewprep.backend.interview.dto.InterviewTopicSnapshot;
import com.interviewprep.backend.interview.dto.InterviewTurnResponse;
import com.interviewprep.backend.node.Node;
import com.interviewprep.backend.node.NodeRepository;
import com.interviewprep.backend.node.NodeType;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Orchestrates a mock-interview session across three LangChain4j AI Service roles (see {@code
 * interview/agent}): the Interviewer generates questions, the Grader scores each answer against
 * the session's retrieved study-notes context, and the Coach gives forward-looking advice. The
 * question sequence is fixed at session creation and does not adapt to how the user is scoring.
 *
 * <p>Retrieval happens once, at session creation, not per turn: the selected topics' content is
 * pulled from the shared Qdrant {@code nodes} collection (see {@link
 * com.interviewprep.backend.search.SearchService}) and stored on the session as {@code
 * retrievedContext}, so every question/grading call in the session grounds against the same
 * material.
 */
@Service
public class InterviewSessionService {

    private static final Logger log = LoggerFactory.getLogger(InterviewSessionService.class);

    private static final int DEFAULT_QUESTION_COUNT = 5;
    private static final int MIN_QUESTION_COUNT = 3;
    private static final int MAX_QUESTION_COUNT = 10;
    private static final int CONTEXT_OVERFETCH = 50;
    private static final int CHUNKS_PER_TOPIC = 8;
    private static final Duration PHASE_TIMEOUT = Duration.ofSeconds(60);
    private static final String FEEDBACK_MARKER = "FEEDBACK:";
    private static final Pattern SCORE_PATTERN = Pattern.compile("SCORE:\\s*(\\d+)");
    private static final Pattern FEEDBACK_PATTERN = Pattern.compile("FEEDBACK:\\s*(.*)", Pattern.DOTALL);

    private final InterviewSessionRepository sessionRepository;
    private final InterviewTurnRepository turnRepository;
    private final NodeRepository nodeRepository;
    private final BoardRepository boardRepository;
    private final OwnershipGuard ownershipGuard;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final InterviewerAgent interviewerAgent;
    private final GraderAgent graderAgent;
    private final CoachAgent coachAgent;

    // Explicit constructor (not @RequiredArgsConstructor) so @Lazy can be placed on the AI-backed
    // params: this service is eagerly created, so without @Lazy here, resolving these constructor
    // arguments would still eagerly build the Anthropic/Voyage/Qdrant clients at startup — see
    // AiConfig's class-level note and SearchService's constructor for the same reasoning.
    public InterviewSessionService(
            InterviewSessionRepository sessionRepository,
            InterviewTurnRepository turnRepository,
            NodeRepository nodeRepository,
            BoardRepository boardRepository,
            OwnershipGuard ownershipGuard,
            @Lazy EmbeddingModel embeddingModel,
            @Lazy EmbeddingStore<TextSegment> embeddingStore,
            @Lazy InterviewerAgent interviewerAgent,
            @Lazy GraderAgent graderAgent,
            @Lazy CoachAgent coachAgent) {
        this.sessionRepository = sessionRepository;
        this.turnRepository = turnRepository;
        this.nodeRepository = nodeRepository;
        this.boardRepository = boardRepository;
        this.ownershipGuard = ownershipGuard;
        this.embeddingModel = embeddingModel;
        this.embeddingStore = embeddingStore;
        this.interviewerAgent = interviewerAgent;
        this.graderAgent = graderAgent;
        this.coachAgent = coachAgent;
    }

    public InterviewSessionResponse createSession(CreateInterviewSessionRequest request, UUID ownerId) {
        int questionCount = request.questionCount() == null
                ? DEFAULT_QUESTION_COUNT
                : Math.min(Math.max(request.questionCount(), MIN_QUESTION_COUNT), MAX_QUESTION_COUNT);

        List<Node> topics = new ArrayList<>();
        for (UUID id : request.topicNodeIds()) {
            if (!ownershipGuard.isNodeOwnedBy(id, ownerId)) {
                throw new NotFoundException("Topic not found: " + id);
            }
            Node node = nodeRepository.findById(id).orElseThrow(() -> new NotFoundException("Topic not found: " + id));
            if (node.getType() != NodeType.TOPIC) {
                throw new IllegalArgumentException("Node " + id + " is not a TOPIC");
            }
            topics.add(node);
        }

        List<InterviewTopicSnapshot> snapshots =
                topics.stream().map(t -> new InterviewTopicSnapshot(t.getId(), t.getLabel(), buildPath(t))).toList();
        String context = retrieveContext(topics, ownerId);

        // Each save below is its own short transaction, deliberately not wrapped in one
        // @Transactional block — this method makes blocking external LLM calls, and holding a DB
        // transaction open across those would be needless (see SubtopicSyncRunner for the same
        // reasoning around the sync feature's external call).
        InterviewSession session = new InterviewSession();
        session.setOwnerId(ownerId);
        session.setTopics(snapshots);
        session.setRetrievedContext(context);
        session.setStatus(InterviewSessionStatus.IN_PROGRESS);
        session.setTotalQuestions(questionCount);
        session.setCurrentTurnIndex(0);
        session = sessionRepository.save(session);

        String question = interviewerAgent.generateQuestion(context, "");

        InterviewTurn turn = new InterviewTurn();
        turn.setSessionId(session.getId());
        turn.setTurnIndex(0);
        turn.setQuestion(question);
        turn.setStatus(InterviewTurnStatus.PENDING_ANSWER);
        turn = turnRepository.save(turn);

        return toSessionResponse(session, List.of(turn));
    }

    @Transactional(readOnly = true)
    public List<InterviewSessionResponse> listSessions(UUID ownerId) {
        return sessionRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(session -> toSessionResponse(
                        session, turnRepository.findBySessionIdOrderByTurnIndexAsc(session.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public InterviewSessionResponse getSession(UUID sessionId, UUID ownerId) {
        InterviewSession session = getSessionOrThrow(sessionId, ownerId);
        return toSessionResponse(session, turnRepository.findBySessionIdOrderByTurnIndexAsc(sessionId));
    }

    @Async("interviewTaskExecutor")
    public void submitAnswer(UUID sessionId, int turnIndex, String answer, SseEmitter emitter, UUID ownerId) {
        try {
            InterviewSession session = getSessionOrThrow(sessionId, ownerId);
            InterviewTurn turn = turnRepository
                    .findBySessionIdAndTurnIndex(sessionId, turnIndex)
                    .orElseThrow(() -> new NotFoundException("Turn not found: " + turnIndex));
            if (turn.getStatus() != InterviewTurnStatus.PENDING_ANSWER) {
                throw new ConflictException("Turn " + turnIndex + " has already been answered");
            }

            turn.setAnswer(answer);
            turn.setAnsweredAt(Instant.now());

            GradeResult grade = streamGrade(session.getRetrievedContext(), turn.getQuestion(), answer, emitter);
            turn.setScore(grade.score());
            turn.setGraderFeedback(grade.feedback());
            turn.setStatus(InterviewTurnStatus.GRADED);
            turn = turnRepository.save(turn);
            sendEvent(emitter, "turn-graded", toTurnResponse(turn));

            String coachFeedback = streamCoach(turn.getQuestion(), answer, grade.score(), grade.feedback(), emitter);
            turn.setCoachFeedback(coachFeedback);
            turn = turnRepository.save(turn);
            sendEvent(emitter, "turn-coached", toTurnResponse(turn));

            int nextIndex = turnIndex + 1;
            if (nextIndex >= session.getTotalQuestions()) {
                session.setStatus(InterviewSessionStatus.COMPLETED);
                session.setCompletedAt(Instant.now());
                session.setOverallScore(computeOverallScore(sessionId));
                session = sessionRepository.save(session);
                sendEvent(
                        emitter,
                        "session-complete",
                        toSessionResponse(session, turnRepository.findBySessionIdOrderByTurnIndexAsc(sessionId)));
            } else {
                session.setCurrentTurnIndex(nextIndex);
                session = sessionRepository.save(session);

                String previousQuestions = turnRepository.findBySessionIdOrderByTurnIndexAsc(sessionId).stream()
                        .map(InterviewTurn::getQuestion)
                        .collect(Collectors.joining("\n"));
                String nextQuestion = streamNextQuestion(session.getRetrievedContext(), previousQuestions, emitter);

                InterviewTurn next = new InterviewTurn();
                next.setSessionId(sessionId);
                next.setTurnIndex(nextIndex);
                next.setQuestion(nextQuestion);
                next.setStatus(InterviewTurnStatus.PENDING_ANSWER);
                next = turnRepository.save(next);
                sendEvent(emitter, "next-question", toTurnResponse(next));
            }
            emitter.complete();
        } catch (Exception e) {
            log.warn("Interview turn failed for session {} turn {}: {}", sessionId, turnIndex, e.toString());
            sendEvent(emitter, "error", e.getMessage());
            emitter.completeWithError(e);
        }
    }

    private InterviewSession getSessionOrThrow(UUID sessionId, UUID ownerId) {
        return sessionRepository
                .findById(sessionId)
                .filter(session -> session.getOwnerId().equals(ownerId))
                .orElseThrow(() -> new NotFoundException("Interview session not found: " + sessionId));
    }

    private GradeResult streamGrade(String context, String question, String answer, SseEmitter emitter)
            throws InterruptedException {
        StringBuilder full = new StringBuilder();
        AtomicInteger sentLength = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Throwable> error = new AtomicReference<>();

        graderAgent
                .grade(context, question, answer)
                .onPartialResponse(chunk -> {
                    full.append(chunk);
                    String text = full.toString();
                    int idx = text.indexOf(FEEDBACK_MARKER);
                    if (idx >= 0) {
                        String feedbackSoFar = text.substring(idx + FEEDBACK_MARKER.length());
                        int already = sentLength.get();
                        if (feedbackSoFar.length() > already) {
                            sendEvent(emitter, "grading", feedbackSoFar.substring(already));
                            sentLength.set(feedbackSoFar.length());
                        }
                    }
                })
                .onCompleteResponse(response -> latch.countDown())
                .onError(t -> {
                    error.set(t);
                    latch.countDown();
                })
                .start();

        awaitLatch(latch);
        if (error.get() != null) {
            throw new IllegalStateException("Grading failed", error.get());
        }
        return parseGrade(full.toString());
    }

    private String streamCoach(
            String question, String answer, int score, String graderFeedback, SseEmitter emitter)
            throws InterruptedException {
        StringBuilder full = new StringBuilder();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Throwable> error = new AtomicReference<>();

        coachAgent
                .coach(question, answer, String.valueOf(score), graderFeedback)
                .onPartialResponse(chunk -> {
                    full.append(chunk);
                    sendEvent(emitter, "coaching", chunk);
                })
                .onCompleteResponse(response -> latch.countDown())
                .onError(t -> {
                    error.set(t);
                    latch.countDown();
                })
                .start();

        awaitLatch(latch);
        if (error.get() != null) {
            throw new IllegalStateException("Coaching failed", error.get());
        }
        return full.toString().strip();
    }

    private String streamNextQuestion(String context, String previousQuestions, SseEmitter emitter)
            throws InterruptedException {
        StringBuilder full = new StringBuilder();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Throwable> error = new AtomicReference<>();

        interviewerAgent
                .streamNextQuestion(context, previousQuestions)
                .onPartialResponse(chunk -> {
                    full.append(chunk);
                    sendEvent(emitter, "question-chunk", chunk);
                })
                .onCompleteResponse(response -> latch.countDown())
                .onError(t -> {
                    error.set(t);
                    latch.countDown();
                })
                .start();

        awaitLatch(latch);
        if (error.get() != null) {
            throw new IllegalStateException("Question generation failed", error.get());
        }
        return full.toString().strip();
    }

    private void awaitLatch(CountDownLatch latch) throws InterruptedException {
        if (!latch.await(PHASE_TIMEOUT.toSeconds(), TimeUnit.SECONDS)) {
            throw new IllegalStateException("Agent response timed out");
        }
    }

    private GradeResult parseGrade(String text) {
        Matcher scoreMatcher = SCORE_PATTERN.matcher(text);
        int score = scoreMatcher.find() ? Math.min(Math.max(Integer.parseInt(scoreMatcher.group(1)), 0), 10) : 0;
        Matcher feedbackMatcher = FEEDBACK_PATTERN.matcher(text);
        String feedback = feedbackMatcher.find() ? feedbackMatcher.group(1).strip() : text.strip();
        return new GradeResult(score, feedback);
    }

    private Double computeOverallScore(UUID sessionId) {
        List<Integer> scores = turnRepository.findBySessionIdOrderByTurnIndexAsc(sessionId).stream()
                .map(InterviewTurn::getScore)
                .filter(Objects::nonNull)
                .toList();
        if (scores.isEmpty()) {
            return null;
        }
        return scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
    }

    private String retrieveContext(List<Node> topics, UUID ownerId) {
        StringBuilder context = new StringBuilder();
        for (Node topic : topics) {
            Set<UUID> scope = scopedNodeIds(topic);
            Embedding queryEmbedding =
                    embeddingModel.embed(topic.getLabel() != null ? topic.getLabel() : "").content();
            EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbedding)
                    .maxResults(CONTEXT_OVERFETCH)
                    .minScore(0.0)
                    .filter(metadataKey("userId").isEqualTo(ownerId.toString()))
                    .build();

            List<String> chunks = embeddingStore.search(request).matches().stream()
                    .filter(match -> scope.contains(match.embedded().metadata().getUUID("nodeId")))
                    .sorted(Comparator.comparingDouble((EmbeddingMatch<TextSegment> m) -> m.score())
                            .reversed())
                    .limit(CHUNKS_PER_TOPIC)
                    .map(match -> match.embedded().text())
                    .toList();

            context.append("## ").append(topic.getLabel()).append('\n');
            chunks.forEach(chunk -> context.append(chunk).append('\n'));
            context.append('\n');
        }
        return context.toString();
    }

    private Set<UUID> scopedNodeIds(Node topic) {
        Set<UUID> ids = new HashSet<>();
        ids.add(topic.getId());
        if (topic.getChildBoardId() != null) {
            nodeRepository.findByBoardId(topic.getChildBoardId()).forEach(n -> ids.add(n.getId()));
        }
        return ids;
    }

    private List<String> buildPath(Node topic) {
        List<String> path = new ArrayList<>();
        UUID currentBoardId = topic.getBoardId();
        while (currentBoardId != null) {
            Board board = boardRepository.findById(currentBoardId).orElse(null);
            if (board == null || board.getParentNodeId() == null) {
                break;
            }
            Node ownerNode = nodeRepository.findById(board.getParentNodeId()).orElse(null);
            if (ownerNode == null) {
                break;
            }
            path.add(0, ownerNode.getLabel());
            currentBoardId = ownerNode.getBoardId();
        }
        return path;
    }

    private void sendEvent(SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to send SSE event: " + name, e);
        }
    }

    private InterviewSessionResponse toSessionResponse(InterviewSession session, List<InterviewTurn> turns) {
        return new InterviewSessionResponse(
                session.getId(),
                session.getTopics(),
                session.getStatus(),
                session.getTotalQuestions(),
                session.getCurrentTurnIndex(),
                session.getOverallScore(),
                session.getCreatedAt(),
                session.getCompletedAt(),
                turns.stream().map(this::toTurnResponse).toList());
    }

    private InterviewTurnResponse toTurnResponse(InterviewTurn turn) {
        return new InterviewTurnResponse(
                turn.getId(),
                turn.getTurnIndex(),
                turn.getQuestion(),
                turn.getAnswer(),
                turn.getScore(),
                turn.getGraderFeedback(),
                turn.getCoachFeedback(),
                turn.getStatus());
    }

    private record GradeResult(int score, String feedback) {}
}
