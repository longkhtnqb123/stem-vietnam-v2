// Settings API Client
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: {
        prompt: string;
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
}

export interface UserSettings {
    chatModel: string;
    examModel: string;
    ragEnabled: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: 'vi' | 'en';
    customPrompts?: {
        chat?: string;
        exam?: string;
    };
    apiKeys?: {
        openRouter?: string;
        huggingFace?: string;
        gemini?: string;
    };
}

/**
 * Get available AI models from OpenRouter
 */
export async function getAvailableModels(token: string): Promise<OpenRouterModel[]> {
    const response = await fetch(`${API_BASE_URL}/api/settings/models`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
}

/**
 * Refresh models cache
 */
export async function refreshModels(token: string): Promise<OpenRouterModel[]> {
    const response = await fetch(`${API_BASE_URL}/api/settings/models/refresh`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to refresh models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
}

/**
 * Get user settings
 */
export async function getUserSettings(token: string): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get settings: ${response.statusText}`);
    }

    const data = await response.json();
    return data.settings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(
    token: string,
    settings: Partial<UserSettings>
): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    });

    if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`);
    }

    const data = await response.json();
    return data.settings;
}
