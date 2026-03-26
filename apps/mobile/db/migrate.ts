import { getExpoDb } from "./index";

// Migration SQL statements
const MIGRATIONS = [
  // Migration 0: Initial schema
  `
  -- Videos table
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    thumbnail_url TEXT,
    local_path TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  `,
  `CREATE INDEX IF NOT EXISTS videos_updated_at_idx ON videos (updated_at);`,

  // Transcripts table
  `
  CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY NOT NULL,
    video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    is_auto_generated INTEGER DEFAULT 0,
    segments_json TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  `,
  `CREATE INDEX IF NOT EXISTS transcripts_video_id_idx ON transcripts (video_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS transcripts_video_language_idx ON transcripts (video_id, language);`,

  // Translation cache table
  `
  CREATE TABLE IF NOT EXISTS translation_cache (
    id TEXT PRIMARY KEY NOT NULL,
    source_text TEXT NOT NULL,
    source_lang TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    detected_lang TEXT,
    query_count INTEGER NOT NULL DEFAULT 1,
    first_queried_at INTEGER NOT NULL,
    last_queried_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS translation_cache_unique_idx ON translation_cache (source_text, source_lang, target_lang);`,
  `CREATE INDEX IF NOT EXISTS translation_cache_lookup_idx ON translation_cache (source_text, source_lang, target_lang);`,
  `CREATE INDEX IF NOT EXISTS translation_cache_query_count_idx ON translation_cache (query_count);`,

  // Translation contexts table
  `
  CREATE TABLE IF NOT EXISTS translation_contexts (
    id TEXT PRIMARY KEY NOT NULL,
    translation_id TEXT NOT NULL REFERENCES translation_cache(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER NOT NULL,
    context_text TEXT,
    created_at INTEGER NOT NULL
  );
  `,
  `CREATE INDEX IF NOT EXISTS translation_contexts_translation_id_idx ON translation_contexts (translation_id);`,
  `CREATE INDEX IF NOT EXISTS translation_contexts_video_id_idx ON translation_contexts (video_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS translation_contexts_unique_idx ON translation_contexts (translation_id, video_id, timestamp_seconds);`,

  // Saved words table
  `
  CREATE TABLE IF NOT EXISTS saved_words (
    id TEXT PRIMARY KEY NOT NULL,
    translation_id TEXT NOT NULL REFERENCES translation_cache(id) ON DELETE CASCADE,
    notes TEXT,
    review_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  `,
  `CREATE INDEX IF NOT EXISTS saved_words_translation_id_idx ON saved_words (translation_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS saved_words_unique_idx ON saved_words (translation_id);`,

  // Flashcards table
  `
  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY NOT NULL,
    video_id TEXT REFERENCES videos(id) ON DELETE SET NULL,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    context_text TEXT,
    timestamp_seconds INTEGER,
    difficulty INTEGER DEFAULT 0,
    next_review_at INTEGER,
    review_count INTEGER DEFAULT 0,
    ease_factor INTEGER DEFAULT 250,
    interval_days INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  `,
  `CREATE INDEX IF NOT EXISTS flashcards_video_id_idx ON flashcards (video_id);`,
  `CREATE INDEX IF NOT EXISTS flashcards_next_review_idx ON flashcards (next_review_at);`,

  // Watch stats table
  `
  CREATE TABLE IF NOT EXISTS watch_stats (
    id TEXT PRIMARY KEY NOT NULL,
    video_id TEXT NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
    total_watch_seconds INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0,
    last_watched_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  `,
  `CREATE INDEX IF NOT EXISTS watch_stats_video_id_idx ON watch_stats (video_id);`,
  `CREATE INDEX IF NOT EXISTS watch_stats_last_watched_idx ON watch_stats (last_watched_at);`,

  // Saved playlists table
  `
  CREATE TABLE IF NOT EXISTS saved_playlists (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    type TEXT NOT NULL,
    source_id TEXT,
    item_count INTEGER DEFAULT 0,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    saved_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  `,
  `CREATE INDEX IF NOT EXISTS saved_playlists_type_idx ON saved_playlists (type);`,
  `ALTER TABLE saved_playlists ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;`,

  // Saved playlist items table
  `
  CREATE TABLE IF NOT EXISTS saved_playlist_items (
    id TEXT PRIMARY KEY NOT NULL,
    playlist_id TEXT NOT NULL REFERENCES saved_playlists(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    thumbnail_url TEXT,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  `,
  `CREATE INDEX IF NOT EXISTS saved_playlist_items_playlist_id_idx ON saved_playlist_items (playlist_id);`,
  `CREATE INDEX IF NOT EXISTS saved_playlist_items_video_id_idx ON saved_playlist_items (video_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS saved_playlist_items_unique_idx ON saved_playlist_items (playlist_id, video_id);`,

  // Schema version tracking
  `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY NOT NULL
  );
  `,
  `INSERT OR IGNORE INTO schema_version (version) VALUES (1);`,
];

export async function runMigrations() {
  const db = getExpoDb();

  console.log("[DB] Running migrations...");

  for (const sql of MIGRATIONS) {
    try {
      db.execSync(sql.trim());
    } catch (error) {
      // Ignore "already exists" errors for CREATE IF NOT EXISTS
      const message = error instanceof Error ? error.message : String(error);
      if (
        !message.includes("already exists") &&
        !message.includes("duplicate column name")
      ) {
        console.error("[DB] Migration error:", message);
        throw error;
      }
    }
  }

  console.log("[DB] Migrations complete");
}

export function getSchemaVersion(): number {
  const db = getExpoDb();
  try {
    const result = db.getFirstSync<{ version: number }>(
      "SELECT version FROM schema_version LIMIT 1"
    );
    return result?.version ?? 0;
  } catch {
    return 0;
  }
}
