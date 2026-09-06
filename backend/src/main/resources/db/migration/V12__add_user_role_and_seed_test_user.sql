ALTER TABLE app_user
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER'));

-- Admin: mark as ADMIN and rotate its password (was 'skill_loop', now 'skill_loop_#$amg').
UPDATE app_user
SET role = 'ADMIN',
    password_hash = '$2a$10$tp3mxgN4eQN5bRBsmGLMeOiF4MhJNWUoKdfhnAJwsN2FYVIEvYm16'
WHERE username = 'admin';

-- New local user Test_01 (password: skill_loop), role USER — subject to the free-tier gating
-- added alongside this migration (see NoteUploadController / InterviewSessionController).
INSERT INTO app_user (id, username, password_hash, display_name, auth_provider, role)
VALUES (
    '00000000-0000-0000-0000-0000000000bb',
    'Test_01',
    '$2a$10$nYGFwkZf6mSblLtpsQz4fu8ngDvFPnpszEMqlSIkg5nA3pwzNOErq',
    'Test_01',
    'LOCAL',
    'USER'
);
