CREATE TABLE subtopic_sync_run (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id       UUID NOT NULL REFERENCES node (id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL,
    summary       TEXT NULL,
    links         JSONB NULL,
    error_message TEXT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ NULL
);

CREATE INDEX idx_subtopic_sync_run_node_id ON subtopic_sync_run (node_id, created_at DESC);
