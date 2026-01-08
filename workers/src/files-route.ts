// Chú thích: Helper xử lý file request từ R2 bucket
// Support range request cho PDF/Audio/Video streaming
import { R2Bucket, R2ObjectBody } from '@cloudflare/workers-types';

export async function handleFileRequest(
    request: Request,
    bucket: R2Bucket,
    path: string,
    corsOrigin: string
): Promise<Response> {
    // 1. Validate method
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // 2. Clean path (remove leading /api/books/)
    // path passed in is usually "books/sgk/..." or just "sgk/..." depending on routing
    // We assume the internal structure in R2 matches the request path
    const objectKey = path.startsWith('/') ? path.slice(1) : path;

    // 3. Get file info
    const object = await bucket.get(objectKey);

    if (!object) {
        return new Response('File Not Found', {
            status: 404,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
            }
        });
    }

    // 4. Handle Headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Access-Control-Allow-Origin', corsOrigin);
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache 1 day

    // 5. Handle Range Request
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
        // Simple range parsing
        // Range: bytes=0-1023
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : object.size - 1;
        const chunksize = (end - start) + 1;

        // Get range object
        const rangeObject = await bucket.get(objectKey, {
            range: { offset: start, length: chunksize }
        });

        if (rangeObject && 'body' in rangeObject) { // Check if body exists
            headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
            headers.set('Content-Length', chunksize.toString());

            return new Response(rangeObject.body, {
                status: 206,
                headers
            });
        }
    }

    // 6. Return full object
    return new Response(object.body, {
        headers
    });
}
