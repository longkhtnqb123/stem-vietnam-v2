// Enhanced Semantic Cache - Cải thiện phát hiện câu hỏi tương đương
// Chú thích: Nhận diện ngay cả khi dùng từ khác nhau

import { SemanticCache, type CachedResponse } from './semantic-cache';

/**
 * Enhanced cache with multi-level similarity
 */
export class EnhancedSemanticCache extends SemanticCache {
    /**
     * Multi-level cache check (exact → semantic → fuzzy)
     */
    async getWithFuzzyMatch({
        query,
        queryEmbedding,
        apiKey
    }: {
        query: string;
        queryEmbedding?: number[];
        apiKey: string;
    }): Promise<CachedResponse | null> {
        // Level 1: Exact match (fastest)
        const exactMatch = await super.get({ query, queryEmbedding, apiKey });
        if (exactMatch) {
            console.log('[EnhancedCache] Exact match');
            return exactMatch;
        }

        // Level 2: Normalized match (handle typos, spaces)
        const normalized = this.normalizeQuery(query);
        const normalizedMatch = await super.get({ query: normalized, queryEmbedding, apiKey });
        if (normalizedMatch) {
            console.log('[EnhancedCache] Normalized match');
            return normalizedMatch;
        }

        // Level 3: Semantic match (0.95 threshold)
        if (!queryEmbedding) {
            const { createEmbedding } = await import('../huggingface');
            const result = await createEmbedding(apiKey, query);
            queryEmbedding = result.embedding;
        }

        const semanticMatch = await this.semanticSearch(queryEmbedding, 0.95);
        if (semanticMatch) {
            console.log('[EnhancedCache] Semantic match (0.95)');
            return semanticMatch;
        }

        // Level 4: Fuzzy match (0.90 threshold - more lenient)
        const fuzzyMatch = await this.semanticSearch(queryEmbedding, 0.90);
        if (fuzzyMatch) {
            console.log('[EnhancedCache] Fuzzy match (0.90)');
            return fuzzyMatch;
        }

        // Level 5: Keyword-based fallback
        const keywordMatch = await this.keywordMatch(query);
        if (keywordMatch) {
            console.log('[EnhancedCache] Keyword match');
            return keywordMatch;
        }

        console.log('[EnhancedCache] Complete miss');
        return null;
    }

    /**
     * Normalize query to handle variations
     */
    private normalizeQuery(query: string): string {
        return query
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')  // Multiple spaces → single space
            .replace(/[?!.,]/g, '') // Remove punctuation
            .normalize('NFD')       // Normalize Vietnamese diacritics
            .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
    }

    /**
     * Semantic search with custom threshold
     */
    private async semanticSearch(embedding: number[], threshold: number): Promise<CachedResponse | null> {
        const recentKeys = await this.getRecentKeys();

        for (const key of recentKeys) {
            const cached = await this.kv.get(key, 'json') as CachedResponse | null;
            if (!cached) continue;

            const similarity = this.cosineSimilarity(embedding, cached.queryEmbedding);
            if (similarity >= threshold) {
                await this.incrementHitCount(key, cached);
                return cached;
            }
        }

        return null;
    }

    /**
     * Keyword-based matching (fallback)
     */
    private async keywordMatch(query: string): Promise<CachedResponse | null> {
        const keywords = this.extractKeywords(query);
        if (keywords.length === 0) return null;

        const recentKeys = await this.getRecentKeys();

        for (const key of recentKeys) {
            const cached = await this.kv.get(key, 'json') as CachedResponse | null;
            if (!cached) continue;

            const cachedKeywords = this.extractKeywords(cached.query);
            const overlap = this.calculateOverlap(keywords, cachedKeywords);

            if (overlap > 0.7) { // 70% keyword overlap
                await this.incrementHitCount(key, cached);
                return cached;
            }
        }

        return null;
    }

    /**
     * Extract important keywords
     */
    private extractKeywords(text: string): string[] {
        const stopwords = ['là', 'gì', 'của', 'và', 'có', 'the', 'is', 'a', 'an', 'in', 'on', 'at'];

        return text
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopwords.includes(word));
    }

    /**
     * Calculate keyword overlap (Jaccard similarity)
     */
    private calculateOverlap(keywords1: string[], keywords2: string[]): number {
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }
}
