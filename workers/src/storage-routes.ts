
import { Env } from './index';

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
    const url = new URL(request.url);
    // Path format: /api/storage/books/sgk/filename.pdf
    // Cần extract: books/sgk/filename.pdf
    const path = url.pathname.replace('/api/storage/', '');

    console.log('[storage] serving', path);

    if (request.method === 'GET') {
        return getFileFromR2(path, env);
    }

    return new Response('Method not allowed', { status: 405 });
}
