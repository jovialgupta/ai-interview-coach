CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE NOT NULL,
  password_hash      TEXT NOT NULL,
  resume_text        TEXT,
  resume_parsed      JSONB,
  resume_uploaded_at TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE interview_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL,
  difficulty     TEXT NOT NULL DEFAULT 'medium',
  interview_type TEXT NOT NULL DEFAULT 'mixed',
  question_count INT  NOT NULL DEFAULT 5,
  context_text   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'technical',
  targets     TEXT,
  order_index INT  NOT NULL
);

CREATE TABLE attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  input_mode  TEXT NOT NULL DEFAULT 'typed',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  structure       INT NOT NULL,
  technical_depth INT NOT NULL,
  specificity     INT NOT NULL,
  evidence        JSONB,
  feedback        TEXT,
  model           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user    ON interview_sessions(user_id);
CREATE INDEX idx_questions_session ON questions(session_id);
CREATE INDEX idx_attempts_user    ON attempts(user_id);
CREATE INDEX idx_scores_attempt   ON scores(attempt_id);
