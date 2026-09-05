CREATE TABLE interview_session (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topics             JSONB NOT NULL,
    retrieved_context  TEXT NULL,
    status             VARCHAR(20) NOT NULL,
    total_questions    INT NOT NULL,
    current_turn_index INT NOT NULL DEFAULT 0,
    overall_score      DOUBLE PRECISION NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at       TIMESTAMPTZ NULL
);

CREATE TABLE interview_turn (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES interview_session (id) ON DELETE CASCADE,
    turn_index      INT NOT NULL,
    question        TEXT NOT NULL,
    answer          TEXT NULL,
    score           INT NULL,
    grader_feedback TEXT NULL,
    coach_feedback  TEXT NULL,
    status          VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_at     TIMESTAMPTZ NULL
);

CREATE INDEX idx_interview_turn_session_id ON interview_turn (session_id, turn_index);
