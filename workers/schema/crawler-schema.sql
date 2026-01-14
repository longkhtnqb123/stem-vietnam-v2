-- Database schema cho data crawling system
-- GDPT 2018 Compliance

-- === CRAWLED CONTENT TABLE ===
CREATE TABLE IF NOT EXISTS crawled_content (
    id TEXT PRIMARY KEY,
    textbook_id TEXT NOT NULL,        -- 'cn10-thiet-ke', 'cn11-co-khi', etc
    content TEXT NOT NULL,             -- Chunk text
    metadata TEXT NOT NULL,            -- JSON blob
    chunk_index INTEGER NOT NULL,
    quality_score REAL DEFAULT 0,      -- 0-100
    gdpt2018_verified BOOLEAN DEFAULT FALSE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_crawled_textbook ON crawled_content(textbook_id);
CREATE INDEX IF NOT EXISTS idx_crawled_quality ON crawled_content(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_crawled_verified ON crawled_content(gdpt2018_verified);

-- === TEXTBOOKS METADATA ===
CREATE TABLE IF NOT EXISTS textbooks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    grade INTEGER NOT NULL,            -- 10, 11, 12
    orientation TEXT NOT NULL,         -- 'cong-nghiep' | 'nong-nghiep'
    chapters TEXT,                     -- JSON array
    source_url TEXT,
    gdpt2018_compliant BOOLEAN DEFAULT TRUE,
    total_chunks INTEGER DEFAULT 0,
    last_crawled_at INTEGER,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_textbooks_grade ON textbooks(grade);
CREATE INDEX IF NOT EXISTS idx_textbooks_orientation ON textbooks(orientation);

-- === EXAM QUESTIONS (from crawled exams) ===
CREATE TABLE IF NOT EXISTS exam_questions (
    id TEXT PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,       -- 'multiple_choice' | 'true_false'
    options TEXT,                      -- JSON array for MCQ
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    level TEXT NOT NULL,               -- 'remember' | 'understand' | 'apply' | 'analyze'
    year INTEGER NOT NULL,             -- Exam year (2018-2025)
    source TEXT NOT NULL,              -- 'THPT Official' | 'Mock exam'
    metadata TEXT,                     -- JSON blob
    gdpt2018_compliant BOOLEAN DEFAULT TRUE,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exam_year ON exam_questions(year);
CREATE INDEX IF NOT EXISTS idx_exam_level ON exam_questions(level);
CREATE INDEX IF NOT EXISTS idx_exam_source ON exam_questions(source);

-- === Q&A PAIRS (from community platforms) ===
CREATE TABLE IF NOT EXISTS qa_pairs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source_platform TEXT NOT NULL,     -- 'VnDoc' | 'HocMai' | 'VietJack'
    topic TEXT,                        -- 'Mạch điện 3 pha', 'Động cơ KĐB', etc
    grade INTEGER,
    quality_score REAL DEFAULT 0,      -- Auto-scored
    verified BOOLEAN DEFAULT FALSE,
    metadata TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_qa_platform ON qa_pairs(source_platform);
CREATE INDEX IF NOT EXISTS idx_qa_topic ON qa_pairs(topic);
CREATE INDEX IF NOT EXISTS idx_qa_quality ON qa_pairs(quality_score DESC);

-- === CRAWL JOBS LOG ===
CREATE TABLE IF NOT EXISTS crawl_jobs (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL,            -- 'sgk' | 'exam' | 'qa' | 'video'
    status TEXT NOT NULL,              -- 'pending' | 'running' | 'completed' | 'failed'
    target_source TEXT,                -- Specific source being crawled
    items_processed INTEGER DEFAULT 0,
    items_total INTEGER DEFAULT 0,
    error_message TEXT,
    started_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_type ON crawl_jobs(job_type);

-- === TRAINING EXAMPLES (generated from crawled data) ===
CREATE TABLE IF NOT EXISTS training_examples (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    completion TEXT NOT NULL,
    example_type TEXT NOT NULL,        -- 'chat' | 'exam_gen' | 'explanation'
    source_content_id TEXT,            -- FK to crawled_content or qa_pairs
    quality_score REAL DEFAULT 0,
    used_for_training BOOLEAN DEFAULT FALSE,
    metadata TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_training_type ON training_examples(example_type);
CREATE INDEX IF NOT EXISTS idx_training_quality ON training_examples(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_training_used ON training_examples(used_for_training);
