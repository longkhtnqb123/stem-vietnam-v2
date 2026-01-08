-- Migration 006: Evaluation & Few-Shot Tables

-- Evaluation metrics table
CREATE TABLE IF NOT EXISTS evaluation_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    query_id TEXT NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    factuality REAL NOT NULL,
    relevance REAL NOT NULL,
    coherence REAL NOT NULL,
    safety REAL NOT NULL,
    overall REAL NOT NULL,
    timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eval_user ON evaluation_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_eval_timestamp ON evaluation_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eval_overall ON evaluation_metrics(overall DESC);

-- Few-shot examples table
CREATE TABLE IF NOT EXISTS few_shot_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    quality_score REAL DEFAULT 1.0,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fewshot_category ON few_shot_examples(category);
CREATE INDEX IF NOT EXISTS idx_fewshot_quality ON few_shot_examples(quality_score DESC);
