-- Migration 003: User Settings and Model Cache
-- Add tables for storing user preferences and cached OpenRouter models

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL, -- JSON blob with user preferences
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Model Cache Table (single row for all models)
CREATE TABLE IF NOT EXISTS model_cache (
    id INTEGER PRIMARY KEY DEFAULT 1,
    models TEXT NOT NULL, -- JSON array of OpenRouterModel[]
    updated_at INTEGER NOT NULL,
    CHECK (id = 1) -- Ensure only one row
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_updated ON user_settings(updated_at);
