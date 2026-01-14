// Enhanced Semantic Cache V2 - Aggressive optimization cho speed & hit rate
// Chú thích: Query normalization + Multi-layer TTL + Higher precision threshold

import { SemanticCache, type CachedResponse } from './semantic-cache';

/**
 * Cache TTL strategy theo loại query
 */
const CACHE_TTL = {
    COMMON: 7 * 24 * 60 * 60,    // 7 ngày cho top queries
    ACADEMIC: 24 * 60 * 60,       // 24 giờ cho academic queries
    GENERAL: 60 * 60,             // 1 giờ cho general queries
} as const;

/**
 * Top 100 common queries để pre-warm cache
 */
export const TOP_COMMON_QUERIES = [
    'Giải thích Định lý Pythagoras',
    'Mạch điện 3 pha là gì',
    'So sánh LAN và WAN',
    'Hệ thống điện Việt Nam dùng tần số bao nhiêu',
    'Động cơ không đồng bộ hoạt động thế nào',
    // ... Sẽ expand dần dựa trên analytics
];

/**
 * Enhanced cache V2 với aggressive optimizations
 */
export class EnhancedSemanticCacheV2 extends SemanticCache {
    /**
     * Multi-level cache check với higher precision
     * Thứ tự: Exact → Normalized → Semantic (0.80) → Keyword
     */
    async getWithFuzzyMatch({
        query,
        queryEmbedding,
        apiKey,
        queryType = 'general'
    }: {
        query: string;
        queryEmbedding?: number[];
        apiKey: string;
        queryType?: 'academic' | 'general' | 'common';
    }): Promise<(CachedResponse & { cacheType: string }) | null> {
        const t0 = Date.now();

        // Level 1: Exact match (fastest, most precise)
        const exactKey = this.getCacheKey(query);
        const exactMatch = await this.kv.get(exactKey, 'json') as CachedResponse | null;
        if (exactMatch) {
            console.log('[CacheV2] Exact HIT', { latency: Date.now() - t0 });
            await this.incrementHitCount(exactKey, exactMatch);
            return { ...exactMatch, cacheType: 'exact' };
        }

        // Level 2: Normalized match (handle variations)
        const normalized = this.normalizeQuery(query);
        const normalizedKey = this.getCacheKey(normalized);

        if (normalizedKey !== exactKey) {
            const normalizedMatch = await this.kv.get(normalizedKey, 'json') as CachedResponse | null;
            if (normalizedMatch) {
                console.log('[CacheV2] Normalized HIT', { latency: Date.now() - t0 });
                await this.incrementHitCount(normalizedKey, normalizedMatch);
                return { ...normalizedMatch, cacheType: 'normalized' };
            }
        }

        // Level 3: Semantic match (threshold 0.80 - higher precision)
        if (!queryEmbedding) {
            const { createEmbedding } = await import('../huggingface');
            const result = await createEmbedding(apiKey, query);
            queryEmbedding = result.embedding;
        }

        const semanticMatch = await this.semanticSearch(queryEmbedding, 0.80);
        if (semanticMatch) {
            console.log('[CacheV2] Semantic HIT (≥0.80)', { latency: Date.now() - t0 });
            return { ...semanticMatch, cacheType: 'semantic' };
        }

        // Level 4: Keyword fallback (threshold 0.75)
        const keywordMatch = await this.keywordMatch(query);
        if (keywordMatch) {
            console.log('[CacheV2] Keyword HIT', { latency: Date.now() - t0 });
            return { ...keywordMatch, cacheType: 'keyword' };
        }

        console.log('[CacheV2] MISS', { latency: Date.now() - t0 });
        return null;
    }

    /**
     * Store với tiered TTL strategy
     */
    async set({
        query,
        queryEmbedding,
        response,
        queryType = 'general',
        sources,
        thinking,
        reflection
    }: {
        query: string;
        queryEmbedding: number[];
        response: string;
        queryType?: 'academic' | 'general' | 'common';
        sources?: unknown[];
        thinking?: string;
        reflection?: any;
    }): Promise<void> {
        // Determine TTL based on query type
        const ttl = queryType === 'common' ? CACHE_TTL.COMMON :
            queryType === 'academic' ? CACHE_TTL.ACADEMIC :
                CACHE_TTL.GENERAL;

        const cacheData: CachedResponse = {
            query,
            queryEmbedding,
            response,
            sources,
            thinking,
            reflection,
            timestamp: Date.now(),
            hitCount: 0,
        };

        const key = this.getCacheKey(query);
        await this.kv.put(key, JSON.stringify(cacheData), { expirationTtl: ttl });

        // Update index
        await this.addToIndex(key);

        console.log('[CacheV2] Stored', { queryType, ttl: `${ttl}s` });
    }

    /**
     * Normalize query để tăng cache hit rate
     * - Lowercase
     * - Remove punctuation
     * - Single spaces
     * - Remove stopwords (optional)
     */
    private normalizeQuery(query: string): string {
        return query
            .toLowerCase()
            .replace(/[?!.,;]/g, '')           // Remove punctuation
            .replace(/\s+/g, ' ')              // Normalize spaces
            .trim()
            .normalize('NFD')                  // Normalize Unicode (Vietnamese)
            .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics for matching
    }

    /**
     * Check if query is in TOP_COMMON_QUERIES
     */
    private isCommonQuery(query: string): boolean {
        const normalized = this.normalizeQuery(query);
        return TOP_COMMON_QUERIES.some(q =>
            this.normalizeQuery(q) === normalized
        );
    }

    /**
     * Semantic search với custom threshold
     */
    private async semanticSearch(embedding: number[], threshold: number): Promise<CachedResponse | null> {
        const recentKeys = await this.getRecentKeys(50); // Check 50 recent

        for (const key of recentKeys) {
            const cached = await this.kv.get(key, 'json') as CachedResponse | null;
            if (!cached || !cached.queryEmbedding) continue;

            const similarity = this.cosineSimilarity(embedding, cached.queryEmbedding);
            if (similarity >= threshold) {
                await this.incrementHitCount(key, cached);
                return cached;
            }
        }

        return null;
    }

    /**
     * Keyword-based matching (Jaccard similarity ≥ 0.75)
     */
    private async keywordMatch(query: string): Promise<CachedResponse | null> {
        const keywords = this.extractKeywords(query);
        if (keywords.length === 0) return null;

        const recentKeys = await this.getRecentKeys(30);

        for (const key of recentKeys) {
            const cached = await this.kv.get(key, 'json') as CachedResponse | null;
            if (!cached) continue;

            const cachedKeywords = this.extractKeywords(cached.query);
            const overlap = this.calculateJaccardSimilarity(keywords, cachedKeywords);

            if (overlap >= 0.75) { // Higher threshold
                await this.incrementHitCount(key, cached);
                return cached;
            }
        }

        return null;
    }

    /**
     * Extract keywords (remove stopwords)
     */
    private extractKeywords(text: string): string[] {
        const stopwords = new Set([
            'là', 'gì', 'của', 'và', 'có', 'được', 'cho', 'trong', 'ở',
            'the', 'is', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with'
        ]);

        return text
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopwords.has(word));
    }

    /**
     * Calculate Jaccard similarity
     */
    private calculateJaccardSimilarity(keywords1: string[], keywords2: string[]): number {
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Get recent keys (with limit)
     */
    private async getRecentKeys(limit = 50): Promise<string[]> {
        const indexKey = 'cache:index';
        const index = await this.kv.get(indexKey, 'json') as string[] | null;

        if (!index) return [];

        // Return most recent N keys
        return index.slice(-limit).reverse();
    }

    /**
     * Add key to index
     */
    private async addToIndex(key: string): Promise<void> {
        const indexKey = 'cache:index';
        const index = await this.kv.get(indexKey, 'json') as string[] | null || [];

        if (!index.includes(key)) {
            index.push(key);

            // Keep last 200 keys only
            const trimmed = index.length > 200 ? index.slice(-200) : index;

            await this.kv.put(indexKey, JSON.stringify(trimmed));
        }
    }

    /**
     * Get cache key
     */
    private getCacheKey(query: string): string {
        return `cache:v2:${this.hashString(query)}`;
    }

    /**
     * Simple hash function
     */
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Increment hit count
     */
    private async incrementHitCount(key: string, cached: CachedResponse): Promise<void> {
        cached.hitCount = (cached.hitCount || 0) + 1;
        await this.kv.put(key, JSON.stringify(cached));
    }

    /**
     * Cosine similarity
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
