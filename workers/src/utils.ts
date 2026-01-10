export function getAllowedOrigin(requestOrigin: string | null, allowedOrigins: string): string {
    if (!requestOrigin || !allowedOrigins) return '*';

    // Robust splitting: handle semicolon, comma, space, and remove quotes
    const cleanOrigins = allowedOrigins.replace(/['"]/g, '');
    const origins = cleanOrigins.split(/[;,| ]+/).map(o => o.trim()).filter(o => o.length > 0);

    if (origins.includes('*')) return '*';
    if (origins.includes(requestOrigin)) return requestOrigin;

    // Fallback logic
    return origins[0] || '*';
}

export function corsHeaders(origin: string): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true'
    };
}

export function jsonResponse(data: unknown, status: number, origin: string): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
        },
    });
}
