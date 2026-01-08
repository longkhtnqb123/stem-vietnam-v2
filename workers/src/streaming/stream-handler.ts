// Streaming Handler - Stream CoT with thinking display
// Chú thích: Real-time streaming cho better UX

export interface StreamChunk {
    type: 'thinking_start' | 'thinking' | 'thinking_end' | 'answer_start' | 'answer' | 'answer_end' | 'error' | 'done';
    content: string;
    metadata?: any;
}

/**
 * Stream CoT response with thinking phases
 */
export async function* streamChatWithCoT({
    query,
    context,
    systemPrompt,
    apiKey,
    model = 'google/gemini-2.0-flash-exp:free'
}: {
    query: string;
    context?: string;
    systemPrompt?: string;
    apiKey: string;
    model?: string;
}): AsyncGenerator<StreamChunk> {
    const { streamCoTResponse } = await import('../reasoning/chain-of-thought');

    try {
        yield { type: 'thinking_start', content: '' };

        for await (const chunk of streamCoTResponse({
            query,
            context,
            systemPrompt,
            model,
            apiKey
        })) {
            yield chunk as StreamChunk;
        }

        yield { type: 'done', content: '' };
    } catch (error) {
        console.error('[Stream] Error:', error);
        yield {
            type: 'error',
            content: `Streaming error: ${error}`
        };
    }
}

/**
 * Convert stream to SSE format for HTTP response
 */
export function createSSEStream(
    generator: AsyncGenerator<StreamChunk>
): ReadableStream {
    return new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            try {
                for await (const chunk of generator) {
                    const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
                    controller.enqueue(encoder.encode(sseData));
                }

                // Send final event
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            } catch (error) {
                console.error('[SSE] Stream error:', error);
                const errorChunk: StreamChunk = {
                    type: 'error',
                    content: `Stream error: ${error}`
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                controller.close();
            }
        }
    });
}

/**
 * Handle streaming chat request
 */
export async function handleChatStream(
    request: Request,
    env: any
): Promise<Response> {
    try {
        const body = await request.json() as {
            message: string;
            context?: string;
            systemPrompt?: string;
            useCoT?: boolean;
        };

        if (!env.OPENROUTER_API_KEY) {
            return new Response('API key not configured', { status: 500 });
        }

        // Create stream generator
        const generator = streamChatWithCoT({
            query: body.message,
            context: body.context,
            systemPrompt: body.systemPrompt,
            apiKey: env.OPENROUTER_API_KEY
        });

        // Convert to SSE stream
        const stream = createSSEStream(generator);

        // Return SSE response
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('[ChatStream] Error:', error);
        return new Response(`Error: ${error}`, { status: 500 });
    }
}
