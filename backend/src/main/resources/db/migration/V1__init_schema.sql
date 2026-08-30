CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE board (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_node_id UUID NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE node (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id         UUID NOT NULL REFERENCES board (id) ON DELETE CASCADE,
    type             VARCHAR(16) NOT NULL CHECK (type IN ('TOPIC', 'NOTE')),
    label            VARCHAR(255) NULL,
    note_text        TEXT NULL,
    position_x       DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y       DOUBLE PRECISION NOT NULL DEFAULT 0,
    child_board_id   UUID NULL UNIQUE REFERENCES board (id) ON DELETE SET NULL,
    details_content  TEXT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added after `node` exists: a board's parent is a node, a node's board/child-board are boards.
-- Deleting a node cascades to delete the child board it owns (which cascades to that board's
-- own nodes, recursively) — this is the sole cascade path for the recursive tree delete.
ALTER TABLE board
    ADD CONSTRAINT fk_board_parent_node FOREIGN KEY (parent_node_id) REFERENCES node (id) ON DELETE CASCADE;

CREATE INDEX idx_node_board_id ON node (board_id);
CREATE INDEX idx_board_parent_node_id ON board (parent_node_id);

CREATE TABLE edge (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES board (id) ON DELETE CASCADE,
    source_node_id  UUID NOT NULL REFERENCES node (id) ON DELETE CASCADE,
    target_node_id  UUID NOT NULL REFERENCES node (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_edge_board_source_target UNIQUE (board_id, source_node_id, target_node_id)
);

CREATE INDEX idx_edge_board_id ON edge (board_id);

-- The single root board: the only board with no owning parent node.
INSERT INTO board (id, parent_node_id) VALUES ('00000000-0000-0000-0000-000000000001', NULL);
