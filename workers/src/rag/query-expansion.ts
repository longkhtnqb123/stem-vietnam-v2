// Query Expansion - Expand user query for better retrieval
// Chú thích: Query expansion giúp tìm được documents relevant hơn bằng cách mở rộng câu hỏi

import { callOpenRouter } from '../openrouter';

export interface ExpandedQuery {
    original: string;
    synonyms: string[];
    translations: string[];
    relatedTerms: string[];
    all: string[]; // Combined unique queries
}

/**
 * Expand query using LLM
 */
export async function expandQuery({
    query,
    model = 'google/gemini-2.0-flash-exp:free',
    apiKey,
    maxExpansions = 5
}: {
    query: string;
    model?: string;
    apiKey: string;
    maxExpansions?: number;
}): Promise<ExpandedQuery> {
    const prompt = `
Given the user query, generate alternative phrasings and related terms for better search.

**Query**: ${query}

**Generate**:
1. **Synonyms**: Alternative Vietnamese terms for key concepts
2. **Translations**: English equivalents (if applicable)
3. **Related Terms**: Broader or narrower concepts

Format as JSON:
{
  "synonyms": ["term1", "term2"],
  "translations": ["english1", "english2"],
  "relatedTerms": ["related1", "related2"]
}

Limit to ${maxExpansions} items per category.
Return ONLY the JSON.`;

    try {
        const response = await callOpenRouter({
            messages: [{ role: 'user', content: prompt }],
            model,
            apiKey,
            max_tokens: 300,
            temperature: 0.3
        });

        const data = JSON.parse(response.content.trim()) as {
            synonyms: string[];
            translations: string[];
            relatedTerms: string[];
        };

        // Combine all expansions
        const all = new Set([
            query,
            ...data.synonyms,
            ...data.translations,
            ...data.relatedTerms
        ]);

        console.log('[QueryExpansion] Expanded:', {
            original: query,
            totalVariants: all.size
        });

        return {
            original: query,
            synonyms: data.synonyms || [],
            translations: data.translations || [],
            relatedTerms: data.relatedTerms || [],
            all: Array.from(all)
        };
    } catch (error) {
        console.error('[QueryExpansion] Error:', error);

        // Fallback: return original query only
        return {
            original: query,
            synonyms: [],
            translations: [],
            relatedTerms: [],
            all: [query]
        };
    }
}

/**
 * Simple expansion using predefined rules/dictionary
 * Faster but less flexible than LLM-based
 */
export function ruleBasedExpansion(query: string): string[] {
    const expansions = [query];
    const queryLower = query.toLowerCase();

    // Technical term mappings
    const termMappings: Record<string, string[]> = {
        'lan': ['local area network', 'mạng cục bộ', 'mạng máy tính'],
        'wan': ['wide area network', 'mạng diện rộng'],
        'cpu': ['central processing unit', 'bộ xử lý trung tâm', 'vi xử lý'],
        'ram': ['random access memory', 'bộ nhớ truy cập ngẫu nhiên'],
        'rom': ['read only memory', 'bộ nhớ chỉ đọc'],
        'ai': ['artificial intelligence', 'trí tuệ nhân tạo'],
        'ml': ['machine learning', 'học máy'],
        'iot': ['internet of things', 'internet vạn vật'],
    };

    // Check for known terms
    for (const [term, variants] of Object.entries(termMappings)) {
        if (queryLower.includes(term)) {
            expansions.push(...variants);
        }
    }

    // Remove duplicates
    return Array.from(new Set(expansions));
}

/**
 * Multi-query expansion: Run multiple expanded queries and merge results
 * Use with hybrid search for best results
 */
export async function multiQuerySearch<T extends { id: string; score: number }>({
    query,
    searchFn,
    topK = 10,
    apiKey
}: {
    query: string;
    searchFn: (q: string) => Promise<T[]>;
    topK?: number;
    apiKey: string;
}): Promise<T[]> {
    // 1. Expand query
    const expanded = await expandQuery({ query, apiKey });

    // 2. Search with each variant
    const allResults = await Promise.all(
        expanded.all.slice(0, 3).map(q => searchFn(q)) // Limit to 3 queries to avoid quota
    );

    // 3. Merge and deduplicate
    const merged = new Map<string, T>();

    for (const results of allResults) {
        for (const result of results) {
            const existing = merged.get(result.id);
            if (!existing || result.score > existing.score) {
                merged.set(result.id, result);
            }
        }
    }

    // 4. Sort and return top K
    const sorted = Array.from(merged.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    console.log('[MultiQuerySearch] Merged:', {
        queriesRun: expanded.all.length,
        totalResults: merged.size,
        topK: sorted.length
    });

    return sorted;
}
