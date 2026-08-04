-- Character confession wall
CREATE TABLE IF NOT EXISTS character_wall (
  id TEXT PRIMARY KEY,
  character_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_character_wall_char ON character_wall(character_id, created_at DESC);

-- Lifetime card view counters
CREATE TABLE IF NOT EXISTS card_views (
  card_id TEXT PRIMARY KEY,
  character_id INTEGER NOT NULL,
  band_folder TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_card_views_char ON card_views(character_id, views DESC);
CREATE INDEX IF NOT EXISTS idx_card_views_band ON card_views(band_folder, views DESC);

-- Monthly card views (for championship)
CREATE TABLE IF NOT EXISTS card_views_monthly (
  card_id TEXT NOT NULL,
  month TEXT NOT NULL,
  character_id INTEGER NOT NULL,
  band_folder TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (card_id, month)
);

CREATE INDEX IF NOT EXISTS idx_card_views_monthly_char ON card_views_monthly(month, character_id, views DESC);
CREATE INDEX IF NOT EXISTS idx_card_views_monthly_band ON card_views_monthly(month, band_folder, character_id, views DESC);
