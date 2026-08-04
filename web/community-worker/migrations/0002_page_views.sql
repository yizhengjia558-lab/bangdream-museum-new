-- page view counters (repeat visits count)
CREATE TABLE IF NOT EXISTS site_meta (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS page_views_daily (
  day TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO site_meta (key, value) VALUES ('total_views', 0);
