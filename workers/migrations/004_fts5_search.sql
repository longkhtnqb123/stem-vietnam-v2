-- Migration 004: FTS5 for BM25 Sparse Search
-- Enable full-text search for hybrid RAG

-- Create FTS5 virtual table for book chunks
CREATE VIRTUAL TABLE IF NOT EXISTS book_chunks_fts USING fts5(
    id UNINDEXED,
    content,
    metadata UNINDEXED,
    tokenize = 'unicode61 remove_diacritics 1'
);

-- Populate from existing book_chunks table (if exists)
-- Note: Run this manually after migration if book_chunks already has data
-- INSERT INTO book_chunks_fts (id, content, metadata)
-- SELECT id, content, metadata FROM book_chunks;

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS book_chunks_ai AFTER INSERT ON book_chunks BEGIN
    INSERT INTO book_chunks_fts (id, content, metadata)
    VALUES (new.id, new.content, new.metadata);
END;

CREATE TRIGGER IF NOT EXISTS book_chunks_au AFTER UPDATE ON book_chunks BEGIN
    UPDATE book_chunks_fts
    SET content = new.content, metadata = new.metadata
    WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS book_chunks_ad AFTER DELETE ON book_chunks BEGIN
    DELETE FROM book_chunks_fts WHERE id = old.id;
END;
