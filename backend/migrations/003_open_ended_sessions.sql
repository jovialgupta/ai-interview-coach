ALTER TABLE interview_sessions ALTER COLUMN question_count DROP NOT NULL;
ALTER TABLE interview_sessions ALTER COLUMN question_count DROP DEFAULT;
ALTER TABLE interview_sessions ADD COLUMN finished_at TIMESTAMPTZ;
