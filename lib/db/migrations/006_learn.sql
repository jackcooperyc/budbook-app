CREATE TABLE IF NOT EXISTS learn_articles (
  slug TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS learn_articles_published_at_idx ON learn_articles(published_at DESC);
