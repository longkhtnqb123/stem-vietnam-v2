-- Migration 005: Conversation Memory & Cache Tables
-- Add tables for long-term memory and semantic caching

-- Conversation Memory table
CREATE TABLE IF NOT EXISTS conversation_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_points TEXT NOT NULL, -- JSON array
    preferences TEXT DEFAULT '{}', -- JSON object
    topics TEXT DEFAULT '[]', -- JSON array
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_user ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_updated ON conversation_memory(updated_at DESC);

-- Note: Semantic cache will use Cloudflare KV instead of D1 for better performance
-- No table needed here
