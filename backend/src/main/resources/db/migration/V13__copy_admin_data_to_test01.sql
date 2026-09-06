-- Deep-copies everything owned by 'admin' (00000000-0000-0000-0000-0000000000aa) into new rows
-- owned by 'Test_01' (00000000-0000-0000-0000-0000000000bb), so Test_01 starts with the same
-- data admin currently has. Uses id-mapping temp tables because board.parent_node_id and
-- node.child_board_id are circular FKs (see ARCHITECTURE.md's data model invariants) — boards are
-- inserted with parent_node_id = NULL first, then nodes are inserted, then board.parent_node_id
-- is backfilled, mirroring NodeService.createNode's two-step insert for the same reason.

CREATE TEMP TABLE board_id_map AS
SELECT id AS old_id, gen_random_uuid() AS new_id
FROM board
WHERE owner_id = '00000000-0000-0000-0000-0000000000aa';

CREATE TEMP TABLE node_id_map AS
SELECT n.id AS old_id, gen_random_uuid() AS new_id
FROM node n
JOIN board_id_map bm ON bm.old_id = n.board_id;

-- Boards first, with parent_node_id left NULL (the nodes they'd point to don't exist yet).
INSERT INTO board (id, parent_node_id, owner_id)
SELECT bm.new_id, NULL, '00000000-0000-0000-0000-0000000000bb'
FROM board b
JOIN board_id_map bm ON bm.old_id = b.id;

-- Nodes: board_id and child_board_id can both be resolved now since all copied boards exist.
INSERT INTO node (id, board_id, type, label, note_text, position_x, position_y, child_board_id, details_content)
SELECT nm.new_id, bm.new_id, n.type, n.label, n.note_text, n.position_x, n.position_y, cbm.new_id, n.details_content
FROM node n
JOIN node_id_map nm ON nm.old_id = n.id
JOIN board_id_map bm ON bm.old_id = n.board_id
LEFT JOIN board_id_map cbm ON cbm.old_id = n.child_board_id;

-- Backfill board.parent_node_id now that the copied nodes exist. Boards that were the root
-- (parent_node_id IS NULL) are skipped by the join and correctly stay NULL.
UPDATE board AS b_new
SET parent_node_id = nm.new_id
FROM board_id_map bm
JOIN board b_old ON b_old.id = bm.old_id
JOIN node_id_map nm ON nm.old_id = b_old.parent_node_id
WHERE b_new.id = bm.new_id;

INSERT INTO edge (id, board_id, source_node_id, target_node_id)
SELECT gen_random_uuid(), bm.new_id, snm.new_id, tnm.new_id
FROM edge e
JOIN board_id_map bm ON bm.old_id = e.board_id
JOIN node_id_map snm ON snm.old_id = e.source_node_id
JOIN node_id_map tnm ON tnm.old_id = e.target_node_id;

CREATE TEMP TABLE note_block_id_map AS
SELECT nb.id AS old_id, gen_random_uuid() AS new_id
FROM note_block nb
JOIN node_id_map nm ON nm.old_id = nb.node_id;

INSERT INTO note_block (id, node_id, content, color, position_x, position_y, width, height, minimized, z_index)
SELECT nbm.new_id, nm.new_id, nb.content, nb.color, nb.position_x, nb.position_y, nb.width, nb.height, nb.minimized, nb.z_index
FROM note_block nb
JOIN note_block_id_map nbm ON nbm.old_id = nb.id
JOIN node_id_map nm ON nm.old_id = nb.node_id;

INSERT INTO reference_material (id, node_id, url, title)
SELECT gen_random_uuid(), nm.new_id, rm.url, rm.title
FROM reference_material rm
JOIN node_id_map nm ON nm.old_id = rm.node_id;

INSERT INTO subtopic_sync_run (id, node_id, status, summary, links, error_message, completed_at)
SELECT gen_random_uuid(), nm.new_id, s.status, s.summary, s.links, s.error_message, s.completed_at
FROM subtopic_sync_run s
JOIN node_id_map nm ON nm.old_id = s.node_id;

INSERT INTO note_upload (id, node_id, file_name, mime_type, status, result_note_block_id, error_message, completed_at)
SELECT gen_random_uuid(), nm.new_id, nu.file_name, nu.mime_type, nu.status, nbm.new_id, nu.error_message, nu.completed_at
FROM note_upload nu
JOIN node_id_map nm ON nm.old_id = nu.node_id
LEFT JOIN note_block_id_map nbm ON nbm.old_id = nu.result_note_block_id;

CREATE TEMP TABLE session_id_map AS
SELECT id AS old_id, gen_random_uuid() AS new_id
FROM interview_session
WHERE owner_id = '00000000-0000-0000-0000-0000000000aa';

INSERT INTO interview_session (id, topics, retrieved_context, status, total_questions, current_turn_index, overall_score, owner_id, completed_at)
SELECT sm.new_id, s.topics, s.retrieved_context, s.status, s.total_questions, s.current_turn_index, s.overall_score, '00000000-0000-0000-0000-0000000000bb', s.completed_at
FROM interview_session s
JOIN session_id_map sm ON sm.old_id = s.id;

INSERT INTO interview_turn (id, session_id, turn_index, question, answer, score, grader_feedback, coach_feedback, status, answered_at)
SELECT gen_random_uuid(), sm.new_id, t.turn_index, t.question, t.answer, t.score, t.grader_feedback, t.coach_feedback, t.status, t.answered_at
FROM interview_turn t
JOIN session_id_map sm ON sm.old_id = t.session_id;

DROP TABLE board_id_map, node_id_map, note_block_id_map, session_id_map;
