CREATE TABLE reference_material (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id    UUID NOT NULL REFERENCES node (id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    title      VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reference_material_node_id ON reference_material (node_id);
