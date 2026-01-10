// Chú thích: Settings Routes - CRUD API for user preferences
import { Env } from './index';
import { getUserFromToken } from './auth-routes';
import { jsonResponse, getAllowedOrigin } from './utils';
import { getCachedModels } from './openrouter-models';

// Default settings structure
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

const DEFAULT_SETTINGS: UserSettings = {
    chatModel: 'google/gemini-2.0-flash-exp:free',
    examModel: 'google/gemini-2.0-flash-exp:free',
    ragEnabled: true,
    theme: 'auto',
    language: 'vi',
};

/**
 * GET /api/settings - Get user settings
 */
export async function handleGetSettings(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);

    try {
        const user = await getUserFromToken(request, env);
        if (!user) {
            return jsonResponse({ error: 'Unauthorized' }, 401, origin);
        }

        // Fetch from D1
        const result = await env.DB.prepare(
            'SELECT preferences FROM user_settings WHERE user_id = ?'
        ).bind(user.sub).first<{ preferences: string }>();

        if (!result) {
            // Return defaults for new user
            return jsonResponse({
                success: true,
                settings: DEFAULT_SETTINGS
            }, 200, origin);
        }

        const settings = JSON.parse(result.preferences) as UserSettings;
        return jsonResponse({
            success: true,
            settings
        }, 200, origin);

    } catch (error: any) {
        console.error('[settings] get error:', error);
        return jsonResponse({
            error: 'Failed to get settings',
            details: error.message
        }, 500, origin);
    }
}

/**
 * PUT /api/settings - Update user settings
 */
export async function handleUpdateSettings(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);

    try {
        const user = await getUserFromToken(request, env);
        if (!user) {
            return jsonResponse({ error: 'Unauthorized' }, 401, origin);
        }

        const body = await request.json() as Partial<UserSettings>;

        // Validate required fields
        if (body.chatModel || body.examModel) {
            // TODO: Validate model IDs exist in available models
        }

        // Fetch existing or use defaults
        const existing = await env.DB.prepare(
            'SELECT preferences FROM user_settings WHERE user_id = ?'
        ).bind(user.sub).first<{ preferences: string }>();

        const currentSettings = existing
            ? JSON.parse(existing.preferences) as UserSettings
            : DEFAULT_SETTINGS;

        // Merge with updates
        const updatedSettings: UserSettings = {
            ...currentSettings,
            ...body,
        };

        const now = Date.now();

        // Upsert
        await env.DB.prepare(`
            INSERT INTO user_settings (user_id, preferences, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                preferences = excluded.preferences,
                updated_at = excluded.updated_at
        `).bind(
            user.sub,
            JSON.stringify(updatedSettings),
            now,
            now
        ).run();

        return jsonResponse({
            success: true,
            settings: updatedSettings
        }, 200, origin);

    } catch (error: any) {
        console.error('[settings] update error:', error);
        return jsonResponse({
            error: 'Failed to update settings',
            details: error.message
        }, 500, origin);
    }
}

/**
 * GET /api/settings/models - Get available models from OpenRouter
 */
export async function handleGetModels(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);

    try {
        // Optional: require auth to prevent abuse
        const user = await getUserFromToken(request, env);
        if (!user) {
            return jsonResponse({ error: 'Unauthorized' }, 401, origin);
        }

        const models = await getCachedModels(env);

        return jsonResponse({
            success: true,
            models,
            count: models.length
        }, 200, origin);

    } catch (error: any) {
        console.error('[settings] get models error:', error);
        return jsonResponse({
            error: 'Failed to fetch models',
            details: error.message
        }, 500, origin);
    }
}

/**
 * POST /api/settings/models/refresh - Force refresh models cache
 */
export async function handleRefreshModels(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);

    try {
        const user = await getUserFromToken(request, env);
        if (!user) {
            return jsonResponse({ error: 'Unauthorized' }, 401, origin);
        }

        // Clear cache by deleting the row
        await env.DB.prepare('DELETE FROM model_cache WHERE id = 1').run();

        // Fetch fresh
        const models = await getCachedModels(env);

        return jsonResponse({
            success: true,
            models,
            count: models.length,
            message: 'Models refreshed successfully'
        }, 200, origin);

    } catch (error: any) {
        console.error('[settings] refresh models error:', error);
        return jsonResponse({
            error: 'Failed to refresh models',
            details: error.message
        }, 500, origin);
    }
}
