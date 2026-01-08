
import { Env } from './index';
import { getAllowedOrigin } from './utils';

// Helper: Get file content from R2
export async function getFileFromR2(fileName: string, env: Env): Promise<Response> {
    if (!env.BOOKS_BUCKET) {
        return new Response('R2 Bucket not configured', { status: 500 });
    }

    const object = await env.BOOKS_BUCKET.get(fileName);

    if (!object) {
        return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 year

    return new Response(object.body, {
        headers,
    });
}

// Handler cho route: /api/storage/books/:path*
export async function handleStorageRequest(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);
    const url = new URL(request.url);
    // Path format: /api/storage/books/sgk/filename.pdf
    // Cần extract: books/sgk/filename.pdf
    const path = url.pathname.replace('/api/storage/', '');

    console.log('[storage] serving', path, 'method:', request.method);

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Handle HEAD method
    if (request.method === 'HEAD') {
        try {
            const object = await env.BOOKS_BUCKET.head(path);

            if (!object) {
                return new Response(null, {
                    status: 404,
                    headers: {
                        'Access-Control-Allow-Origin': origin,
                    }
                });
            }

            return new Response(null, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Length': object.size.toString(),
                    'Access-Control-Allow-Origin': origin,
                    'Cache-Control': 'public, max-age=3600',
                },
            });
        } catch (error) {
            console.error('[storage] HEAD error:', error);
            return new Response(null, {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                }
            });
        }
    }

    // Handle GET method
    if (request.method === 'GET') {
        const response = await getFileFromR2(path, env);
        // Add CORS header
        response.headers.set('Access-Control-Allow-Origin', origin);
        return response;
    }

    return new Response('Method not allowed', {
        status: 405,
        headers: {
            'Access-Control-Allow-Origin': origin,
        }
    });
}
