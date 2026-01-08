// BM25 - Sparse Keyword Search for Hybrid RAG
// Chú thích: BM25 (Best Matching 25) là thuật toán ranking dựa trên keyword matching
// Kết hợp với vector search để tạo hybrid search mạnh hơn

export interface BM25Document {
    id: string;
    content: string;
    metadata?: Record<string, any>;
}

export interface BM25SearchResult {
    id: string;
    score: number;
    content: string;
    metadata?: Record<string, any>;
}

/**
 * BM25 Scorer - Calculate relevance score
 * Formula: BM25(D, Q) = Σ IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
 */
export class BM25Scorer {
    private k1 = 1.5; // Term frequency saturation
    private b = 0.75; // Length normalization

    private docCount: number = 0;
    private avgDocLength: number = 0;
    private docFrequency: Map<string, number> = new Map(); // How many docs contain term
    private documentLengths: Map<string, number> = new Map();

    constructor(documents: BM25Document[]) {
        this.buildIndex(documents);
    }

    /**
     * Build inverted index for BM25
     */
    private buildIndex(documents: BM25Document[]) {
        this.docCount = documents.length;
        let totalLength = 0;

        // Count document frequencies
        for (const doc of documents) {
            const tokens = this.tokenize(doc.content);
            const uniqueTokens = new Set(tokens);

            this.documentLengths.set(doc.id, tokens.length);
            totalLength += tokens.length;

            // Update document frequency for each unique term
            for (const token of uniqueTokens) {
                this.docFrequency.set(
                    token,
                    (this.docFrequency.get(token) || 0) + 1
                );
            }
        }

        this.avgDocLength = totalLength / this.docCount;
    }

    /**
     * Tokenize text - Simple word splitting + lowercasing
     * TODO: Add Vietnamese-specific tokenization (underthesea, vnTokenizer)
     */
    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1); // Remove single chars
    }

    /**
     * Calculate IDF (Inverse Document Frequency)
     * IDF(t) = log((N - df(t) + 0.5) / (df(t) + 0.5) + 1)
     */
    private idf(term: string): number {
        const df = this.docFrequency.get(term) || 0;
        return Math.log((this.docCount - df + 0.5) / (df + 0.5) + 1);
    }

    /**
     * Calculate BM25 score for a document given a query
     */
    score(query: string, document: BM25Document): number {
        const queryTokens = this.tokenize(query);
        const docTokens = this.tokenize(document.content);
        const docLength = this.documentLengths.get(document.id) || docTokens.length;

        // Term frequency in document
        const termFreq = new Map<string, number>();
        for (const token of docTokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }

        let score = 0;

        for (const qToken of queryTokens) {
            const tf = termFreq.get(qToken) || 0;
            const idfScore = this.idf(qToken);

            // BM25 formula
            const numerator = tf * (this.k1 + 1);
            const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));

            score += idfScore * (numerator / denominator);
        }

        return score;
    }

    /**
     * Search documents using BM25
     */
    search(query: string, documents: BM25Document[], topK: number = 10): BM25SearchResult[] {
        const results: BM25SearchResult[] = documents.map(doc => ({
            id: doc.id,
            score: this.score(query, doc),
            content: doc.content,
            metadata: doc.metadata
        }));

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, topK);
    }
}

/**
 * Search using D1 full-text search (SQLite FTS5)
 * Alternative to in-memory BM25 for production at scale
 */
export async function searchWithFTS5(
    query: string,
    db: D1Database,
    topK: number = 10
): Promise<BM25SearchResult[]> {
    try {
        // FTS5 query với match operator
        const results = await db.prepare(`
            SELECT 
                id,
                content,
                metadata,
                bm25(book_chunks_fts) as score
            FROM book_chunks_fts
            WHERE book_chunks_fts MATCH ?
            ORDER BY score
            LIMIT ?
        `).bind(query, topK).all();

        return results.results.map(row => ({
            id: row.id as string,
            score: -(row.score as number), // BM25 returns negative scores
            content: row.content as string,
            metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined
        }));
    } catch (error) {
        console.error('[BM25] FTS5 search error:', error);
        return [];
    }
}

/**
 * Create FTS5 table for book chunks
 * Run this migration to enable D1-based BM25
 */
export const FTS5_MIGRATION = `
-- Create FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS book_chunks_fts USING fts5(
    id UNINDEXED,
    content,
    metadata UNINDEXED,
    tokenize = 'unicode61 remove_diacritics 1'
);

-- Populate from existing book_chunks table
INSERT INTO book_chunks_fts (id, content, metadata)
SELECT id, content, metadata FROM book_chunks;

-- Trigger to keep FTS table in sync
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
`;
