// Chú thích: Auth module - JWT và password hashing cho Cloudflare Workers
// Không dùng external dependencies, chỉ Web Crypto API

const HASH_ITERATIONS = 100000;
const HASH_LENGTH = 32;

// Chú thích: Hash password với PBKDF2
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: HASH_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        HASH_LENGTH * 8
    );

    // Format: salt:hash (base64)
    const saltB64 = btoa(String.fromCharCode(...salt));
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return `${saltB64}:${hashB64}`;
}

// Chú thích: Verify password
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltB64, hashB64] = storedHash.split(':');
    if (!saltB64 || !hashB64) return false;

    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: HASH_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        HASH_LENGTH * 8
    );

    const computedHashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return computedHashB64 === hashB64;
}

// Chú thích: JWT payload interface
export interface JWTPayload {
    sub: string; // user id
    email: string;
    name: string;
    iat: number;
    exp: number;
}

// Chú thích: Helper to handle Unicode in btoa/atob
function base64UrlEncode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(padded)));
}

// Chú thích: Create JWT token
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInHours = 24 * 7): Promise<string> {
    const encoder = new TextEncoder();

    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JWTPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInHours * 3600,
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));

    const data = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${data}.${signatureB64}`;
}

// Chú thích: Verify JWT token
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64, signatureB64] = parts;
        const encoder = new TextEncoder();

        // Verify signature
        const data = `${headerB64}.${payloadB64}`;
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        // Decode signature
        const signaturePadded = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
        const signature = Uint8Array.from(atob(signaturePadded), c => c.charCodeAt(0));

        const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
        if (!valid) return null;

        // Decode payload
        try {
            const payloadJson = base64UrlDecode(payloadB64);
            const payload: JWTPayload = JSON.parse(payloadJson);

            // Check expiration
            if (payload.exp < Math.floor(Date.now() / 1000)) {
                return null;
            }

            return payload;
        } catch (e) {
            console.error('JWT Decode Error:', e);
            return null;
        }
    } catch {
        return null;
    }
}

// Chú thích: Generate unique ID
export function generateId(): string {
    return crypto.randomUUID();
}
