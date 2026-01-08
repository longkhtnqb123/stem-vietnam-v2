export function getAllowedOrigin(requestOrigin: string | null, allowedOrigins: string): string {
    if (!requestOrigin) return '*';
    const origins = allowedOrigins.split(';').map(o => o.trim());
    if (origins.includes('*')) return '*';
    if (origins.includes(requestOrigin)) return requestOrigin;
    return origins[0] || '*';
}

export function corsHeaders(origin: string): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
