// Sliding Window - Smart context management for long conversations
// Chú thích: Fit context vào token limit với priority-based selection

export interface ContextItem {
    type: 'system' | 'recent' | 'rag' | 'history' | 'memory';
    content: string;
    priority: number; // 1-10, higher = more important
    tokens: number;
}

/**
 * Optimize context to fit within token budget
 */
export function optimizeContext({
    systemPrompt,
    recentMessages,
    ragContext,
    memoryContext,
    historyMessages,
    maxTokens = 8000
}: {
    systemPrompt: string;
    recentMessages: string[];
    ragContext?: string;
    memoryContext?: string;
    historyMessages?: string[];
    maxTokens?: number;
}): string {
    // Build priority queue
    const items: ContextItem[] = [];

    // System prompt (always include, highest priority)
    items.push({
        type: 'system',
        content: systemPrompt,
        priority: 10,
        tokens: estimateTokens(systemPrompt)
    });

    // Recent messages (high priority)
    recentMessages.forEach((msg, i) => {
        items.push({
            type: 'recent',
            content: msg,
            priority: 9 - i * 0.1, // Most recent = highest priority
            tokens: estimateTokens(msg)
        });
    });

    // RAG context (medium-high priority)
    if (ragContext) {
        items.push({
            type: 'rag',
            content: ragContext,
            priority: 8,
            tokens: estimateTokens(ragContext)
        });
    }

    // Memory context (medium priority)
    if (memoryContext) {
        items.push({
            type: 'memory',
            content: memoryContext,
            priority: 7,
            tokens: estimateTokens(memoryContext)
        });
    }

    // History messages (lower priority)
    if (historyMessages) {
        historyMessages.forEach((msg, i) => {
            items.push({
                type: 'history',
                content: msg,
                priority: 5 - i * 0.1,
                tokens: estimateTokens(msg)
            });
        });
    }

    // Sort by priority (descending)
    items.sort((a, b) => b.priority - a.priority);

    // Fit items within budget
    const selected: ContextItem[] = [];
    let currentTokens = 0;

    for (const item of items) {
        if (currentTokens + item.tokens <= maxTokens) {
            selected.push(item);
            currentTokens += item.tokens;
        } else if (item.priority >= 9) {
            // Force include very high priority items (truncate if needed)
            const remaining = maxTokens - currentTokens;
            if (remaining > 100) {
                const truncated = truncateToTokens(item.content, remaining);
                selected.push({ ...item, content: truncated, tokens: remaining });
                currentTokens += remaining;
            }
        }
    }

    // Build final context string
    const contextParts: string[] = [];

    // Group by type and maintain order
    const system = selected.filter(i => i.type === 'system');
    const memory = selected.filter(i => i.type === 'memory');
    const rag = selected.filter(i => i.type === 'rag');
    const recent = selected.filter(i => i.type === 'recent');
    const history = selected.filter(i => i.type === 'history');

    if (system.length) contextParts.push(system[0].content);
    if (memory.length) contextParts.push(memory[0].content);
    if (rag.length) contextParts.push(rag[0].content);
    if (history.length) contextParts.push(...history.map(h => h.content));
    if (recent.length) contextParts.push(...recent.map(r => r.content));

    console.log('[SlidingWindow] Context optimized:', {
        maxTokens,
        usedTokens: currentTokens,
        itemsIncluded: selected.length,
        itemsDropped: items.length - selected.length
    });

    return contextParts.join('\n\n');
}

/**
 * Estimate tokens (rough approximation)
 */
function estimateTokens(text: string): number {
    // Vietnamese: ~4 chars per token
    // English: ~4 chars per token
    return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit token budget
 */
function truncateToTokens(text: string, maxTokens: number): string {
    const estimatedChars = maxTokens * 4;
    if (text.length <= estimatedChars) return text;

    return text.substring(0, estimatedChars - 3) + '...';
}

/**
 * Score importance of a message
 */
export function scoreImportance(message: string): number {
    let score = 5; // Base score

    // Boost for questions
    if (message.includes('?')) score += 2;

    // Boost for code
    if (message.includes('```') || message.includes('function') || message.includes('class')) score += 1;

    // Boost for math
    if (message.match(/[+\-*/=∫∑]/)) score += 1;

    // Boost for length (more content = more important)
    if (message.length > 500) score += 1;

    return Math.min(score, 10);
}
