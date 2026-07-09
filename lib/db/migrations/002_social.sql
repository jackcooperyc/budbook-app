CREATE TABLE IF NOT EXISTS friendships (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'accepted',
  sessions_shared   INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON friendships(user_id);

CREATE TABLE IF NOT EXISTS circles (
  id                TEXT PRIMARY KEY,
  owner_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  is_private        BOOLEAN NOT NULL DEFAULT false,
  recent_activity   TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS circles_owner_id_idx ON circles(owner_id);

CREATE TABLE IF NOT EXISTS circle_members (
  circle_id         TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (circle_id, user_id)
);
