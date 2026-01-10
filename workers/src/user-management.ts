import { Env } from './index';
import { jsonResponse } from './utils';
import { hashPassword, generateId } from './auth';

// Helper types
interface CreateUserBody {
    email: string;
    name: string;
    password?: string; // Optional, default will be generated or '123456'
    role?: string;
}

export async function createUser(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as CreateUserBody;
        const { email, name, role = 'student' } = body;
        let { password } = body;

        if (!email || !name) {
            return jsonResponse({ error: 'Email and Name are required' }, 400);
        }

        // Check if user exists
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (existing) {
            return jsonResponse({ error: 'Email already exists' }, 409);
        }

        // Generate ID and Password
        const id = generateId();
        if (!password) password = 'StemPassword123!'; // Default password if not provided
        const passwordHash = await hashPassword(password);
        const now = Date.now();

        await env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, email.toLowerCase(), passwordHash, name, role, now, now).run();

        return jsonResponse({
            success: true,
            user: { id, email, name, role },
            message: 'User created successfully'
        }, 201);

    } catch (error: any) {
        console.error('[admin] create user error:', error);
        return jsonResponse({ error: 'Internal server error', details: error.message }, 500);
    }
}

export async function bulkCreateUsers(request: Request, env: Env): Promise<Response> {
    try {
        const users = await request.json() as CreateUserBody[];

        if (!Array.isArray(users) || users.length === 0) {
            return jsonResponse({ error: 'Invalid input: expected array of users' }, 400);
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        const now = Date.now();
        const defaultPassword = 'StemPassword123!';
        const defaultHash = await hashPassword(defaultPassword);

        for (const user of users) {
            const { email, name, role = 'student', password } = user;

            // Basic validation
            if (!email || !name) {
                results.failed++;
                results.errors.push(`Missing email or name for user: ${JSON.stringify(user)}`);
                continue;
            }

            const id = generateId();
            const pHash = password ? await hashPassword(password) : defaultHash;

            try {
                await env.DB.prepare(
                    'INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
                ).bind(id, email.toLowerCase(), pHash, name, role, now, now).run();
                results.success++;
            } catch (err: any) {
                if (err.message?.includes('UNIQUE')) {
                    results.failed++;
                    results.errors.push(`Email ${email} already exists`);
                } else {
                    results.failed++;
                    results.errors.push(`Error creating ${email}: ${err.message}`);
                }
            }
        }

        return jsonResponse({ success: true, results }, 200);

    } catch (error: any) {
        console.error('[admin] bulk create error:', error);
        return jsonResponse({ error: 'Internal server error', details: error.message }, 500);
    }
}

export async function updateUserDetails(id: string, request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as { name?: string; email?: string; role?: string; password?: string };
        const { name, email, role, password } = body;

        // Build query dynamically
        const updates: string[] = [];
        const params: any[] = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email.toLowerCase());
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (password) {
            const hash = await hashPassword(password);
            updates.push('password_hash = ?');
            params.push(hash);
        }

        if (updates.length === 0) {
            return jsonResponse({ error: 'No fields to update' }, 400);
        }

        updates.push('updated_at = ?');
        params.push(Date.now());

        params.push(id); // For WHERE clause

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

        const result = await env.DB.prepare(query).bind(...params).run();

        if (result.meta.changes === 0) {
            return jsonResponse({ error: 'User not found or no changes made' }, 404);
        }

        return jsonResponse({ success: true, message: 'User updated successfully' }, 200);

    } catch (error: any) {
        console.error('[admin] update user error:', error);
        return jsonResponse({ error: 'Update failed', details: error.message }, 500);
    }
}
