CREATE TABLE note_upload (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id              UUID NOT NULL REFERENCES node (id) ON DELETE CASCADE,
    file_name            VARCHAR(255) NOT NULL,
    mime_type            VARCHAR(100) NOT NULL,
    status               VARCHAR(20) NOT NULL,
    result_note_block_id UUID REFERENCES note_block (id) ON DELETE SET NULL,
    error_message        TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at         TIMESTAMPTZ
);

CREATE INDEX idx_note_upload_node_id ON note_upload (node_id);
