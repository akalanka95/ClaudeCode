CREATE TABLE app_user (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(64) NULL UNIQUE,
    password_hash VARCHAR(100) NULL,
    google_sub    VARCHAR(64) NULL UNIQUE,
    email         VARCHAR(255) NULL,
    display_name  VARCHAR(255) NULL,
    auth_provider VARCHAR(20) NOT NULL CHECK (auth_provider IN ('LOCAL', 'GOOGLE')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The single hardcoded admin account (username: admin, password: skill_loop).
INSERT INTO app_user (id, username, password_hash, display_name, auth_provider)
VALUES (
    '00000000-0000-0000-0000-0000000000aa',
    'admin',
    '$2b$10$zQ8.mingf/KbXowcaXkR0eC/Q4SADfUtCoHBwzEOnfAZPfK4ainoe',
    'Admin',
    'LOCAL'
);
