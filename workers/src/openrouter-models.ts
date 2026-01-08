// Chú thích: OpenRouter Models API Client
// Fetch available AI models from OpenRouter for user selection

export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: {
        prompt: string; // USD per 1M tokens
        completion: string;
        image?: string;
        request?: string;
    };
    context_length: number;
    architecture?: {
        modality: string;
        tokenizer: string;
        instruct_type?: string;
    };
    top_provider?: {
        context_length: number;
        max_completion_tokens?: number;
        is_moderated: boolean;
    };
    per_request_limits?: {
        prompt_tokens?: string;
        completion_tokens?: string;
    };
}

export interface ModelCategory {
    provider: string;
    models: OpenRouterModel[];
}

// Cache settings
const MODELS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch available models from OpenRouter API
 */
export async function fetchAvailableModels(apiKey: string): Promise<OpenRouterModel[]> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json() as { data: OpenRouterModel[] };
        return data.data || [];
    } catch (error) {
        console.error('[openrouter-models] fetch error:', error);
        throw error;
    }
}

/**
 * Get cached models from D1 or fetch fresh
 */
export async function getCachedModels(
    env: { DB: D1Database; OPENROUTER_API_KEY: string }
): Promise<OpenRouterModel[]> {
    try {
        // Try cache first
        const cached = await env.DB.prepare(
            'SELECT models, updated_at FROM model_cache WHERE id = 1 AND updated_at > ?'
        ).bind(Date.now() - MODELS_CACHE_TTL).first<{ models: string; updated_at: number }>();

        if (cached) {
            console.log('[openrouter-models] cache hit');
            return JSON.parse(cached.models);
        }

        // Cache miss, fetch fresh
        console.log('[openrouter-models] cache miss, fetching fresh');
        const models = await fetchAvailableModels(env.OPENROUTER_API_KEY);

        // Update cache
        await env.DB.prepare(`
            INSERT OR REPLACE INTO model_cache (id, models, updated_at)
            VALUES (1, ?, ?)
        `).bind(JSON.stringify(models), Date.now()).run();

        return models;
    } catch (error) {
        console.error('[openrouter-models] cache error:', error);
        // Fallback: try to fetch without cache
        return fetchAvailableModels(env.OPENROUTER_API_KEY);
    }
}

/**
 * Filter models by criteria
 */
export function filterModels(
    models: OpenRouterModel[],
    criteria: {
        freeOnly?: boolean;
        provider?: string;
        searchTerm?: string;
        maxContextLength?: number;
    }
): OpenRouterModel[] {
    let filtered = [...models];

    // Filter free models
    if (criteria.freeOnly) {
        filtered = filtered.filter(m =>
            m.id.includes(':free') ||
            (m.pricing.prompt === '0' && m.pricing.completion === '0')
        );
    }

    // Filter by provider (OpenAI, Anthropic, Google, etc.)
    if (criteria.provider) {
        filtered = filtered.filter(m =>
            m.id.toLowerCase().startsWith(criteria.provider!.toLowerCase())
        );
    }

    // Search by name or id
    if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        filtered = filtered.filter(m =>
            m.id.toLowerCase().includes(term) ||
            m.name.toLowerCase().includes(term) ||
            m.description?.toLowerCase().includes(term)
        );
    }

    // Filter by context length
    if (criteria.maxContextLength) {
        filtered = filtered.filter(m => m.context_length <= criteria.maxContextLength!);
    }

    return filtered;
}

/**
 * Group models by provider
 */
export function groupModelsByProvider(models: OpenRouterModel[]): ModelCategory[] {
    const grouped = new Map<string, OpenRouterModel[]>();

    for (const model of models) {
        const provider = model.id.split('/')[0] || 'other';
        if (!grouped.has(provider)) {
            grouped.set(provider, []);
        }
        grouped.get(provider)!.push(model);
    }

    return Array.from(grouped.entries()).map(([provider, models]) => ({
        provider,
        models: models.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

/**
 * Get model details by ID
 */
export function getModelById(models: OpenRouterModel[], modelId: string): OpenRouterModel | null {
    return models.find(m => m.id === modelId) || null;
}

/**
 * Check if model is free
 */
export function isModelFree(model: OpenRouterModel): boolean {
    return model.id.includes(':free') ||
        (model.pricing.prompt === '0' && model.pricing.completion === '0');
}

/**
 * Format pricing for display
 */
export function formatPricing(model: OpenRouterModel): string {
    const prompt = parseFloat(model.pricing.prompt);
    const completion = parseFloat(model.pricing.completion);

    if (prompt === 0 && completion === 0) {
        return 'Miễn phí';
    }

    return `$${prompt.toFixed(2)}/$${completion.toFixed(2)} / 1M tokens`;
}
