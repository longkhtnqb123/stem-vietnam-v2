-- Migration 007: Production Features (Rate Limiting, A/B Test, Feedback)

-- A/B Test Results table
CREATE TABLE IF NOT EXISTS ab_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    test_id TEXT NOT NULL,
    variant TEXT NOT NULL, -- 'control', 'variant_a', 'variant_b'
    response_time REAL NOT NULL,
    quality REAL NOT NULL,
    user_satisfaction REAL,
    timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_abtest_test ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_abtest_variant ON ab_test_results(variant);

-- User Feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    query_id TEXT NOT NULL,
    rating TEXT NOT NULL, -- 'positive' or 'negative'
    comment TEXT,
    timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON user_feedback(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON user_feedback(rating);
