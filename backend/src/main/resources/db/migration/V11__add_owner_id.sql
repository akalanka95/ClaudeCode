ALTER TABLE board ADD COLUMN owner_id UUID NULL REFERENCES app_user (id);
UPDATE board SET owner_id = '00000000-0000-0000-0000-0000000000aa' WHERE owner_id IS NULL;
ALTER TABLE board ALTER COLUMN owner_id SET NOT NULL;

CREATE INDEX idx_board_owner_id ON board (owner_id);

ALTER TABLE interview_session ADD COLUMN owner_id UUID NULL REFERENCES app_user (id);
UPDATE interview_session SET owner_id = '00000000-0000-0000-0000-0000000000aa' WHERE owner_id IS NULL;
ALTER TABLE interview_session ALTER COLUMN owner_id SET NOT NULL;

CREATE INDEX idx_interview_session_owner_id ON interview_session (owner_id);
