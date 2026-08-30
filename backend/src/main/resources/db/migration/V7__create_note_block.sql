CREATE TABLE note_block (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id    UUID NOT NULL REFERENCES node (id) ON DELETE CASCADE,
    content    TEXT NOT NULL DEFAULT '',
    color      VARCHAR(20) NOT NULL DEFAULT 'yellow',
    position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    width      DOUBLE PRECISION NOT NULL DEFAULT 260,
    height     DOUBLE PRECISION NOT NULL DEFAULT 200,
    minimized  BOOLEAN NOT NULL DEFAULT false,
    z_index    INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_block_node_id ON note_block (node_id);
