// Cloudflare Worker cho crawling jobs
// Chú thích: Orchestrator cho GDPT 2018 data crawling

import type { Env } from './index';
import { crawlAllGDPT2018Textbooks, crawlSingleTextbook, GDPT_2018_TEXTBOOKS } from './crawlers/sgk-gdpt2018-crawler';

export default {
    /**
     * Scheduled crawl - chạy hàng tuần
     */
    async scheduled(event: ScheduledEvent, env: Env) {
        console.log('[Crawler Worker] Scheduled crawl triggered');

        try {
            // Create crawl job
            const jobId = crypto.randomUUID();
            await env.DB.prepare(`
                INSERT INTO crawl_jobs (id, job_type, status, target_source, created_at, started_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                jobId,
                'sgk',
                'running',
                'All GDPT 2018 Textbooks',
                Date.now(),
                Date.now()
            ).run();

            // Execute crawl
            const results = await crawlAllGDPT2018Textbooks(env);

            // Update job status
            const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
            const successCount = results.filter(r => r.success).length;

            await env.DB.prepare(`
                UPDATE crawl_jobs 
                SET status = ?, items_processed = ?, items_total = ?, completed_at = ?
                WHERE id = ?
            `).bind(
                'completed',
                successCount,
                results.length,
                Date.now(),
                jobId
            ).run();

            console.log(`[Crawler Worker] ✅ Crawl complete: ${totalChunks} chunks`);

        } catch (error) {
            console.error('[Crawler Worker] ❌ Crawl failed:', error);
        }
    },

    /**
     * Manual trigger endpoint
     */
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // === Manual crawl trigger ===
        if (path === '/crawl/sgk') {
            try {
                const textbookId = url.searchParams.get('id');

                if (textbookId) {
                    // Crawl single textbook
                    const allTextbooks = [
                        ...GDPT_2018_TEXTBOOKS.grade10,
                        ...GDPT_2018_TEXTBOOKS.grade11,
                        ...GDPT_2018_TEXTBOOKS.grade12
                    ];

                    const textbook = allTextbooks.find(t => t.id === textbookId);

                    if (!textbook) {
                        return new Response(JSON.stringify({
                            error: 'Textbook not found',
                            available_ids: allTextbooks.map(t => t.id)
                        }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders }
                        });
                    }

                    const result = await crawlSingleTextbook(textbook, env);

                    return new Response(JSON.stringify({
                        success: result.success,
                        textbook: textbook.title,
                        chunks: result.chunks
                    }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });

                } else {
                    // Crawl all textbooks
                    const results = await crawlAllGDPT2018Textbooks(env);
                    const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);

                    return new Response(JSON.stringify({
                        success: true,
                        textbooks_crawled: results.length,
                        total_chunks: totalChunks,
                        details: results
                    }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

            } catch (error) {
                return new Response(JSON.stringify({
                    error: 'Crawl failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        // === Get crawl status ===
        if (path === '/crawl/status') {
            try {
                const jobs = await env.DB.prepare(`
                    SELECT * FROM crawl_jobs 
                    ORDER BY created_at DESC 
                    LIMIT 10
                `).all();

                return new Response(JSON.stringify({
                    success: true,
                    jobs: jobs.results
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });

            } catch (error) {
                return new Response(JSON.stringify({
                    error: 'Failed to get status',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        // === Get textbook list ===
        if (path === '/textbooks') {
            const allTextbooks = [
                ...GDPT_2018_TEXTBOOKS.grade10,
                ...GDPT_2018_TEXTBOOKS.grade11,
                ...GDPT_2018_TEXTBOOKS.grade12
            ];

            return new Response(JSON.stringify({
                success: true,
                gdpt2018_compliant: true,
                textbooks: allTextbooks.map(t => ({
                    id: t.id,
                    title: t.title,
                    grade: parseInt(t.id.match(/\d+/)?.[0] || '10'),
                    orientation: t.orientation,
                    chapters: t.chapters,
                    verified: t.gdpt2018_verified
                }))
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Default: Instructions
        return new Response(JSON.stringify({
            service: 'GDPT 2018 Crawler API',
            endpoints: {
                '/textbooks': 'GET - List all GDPT 2018 textbooks',
                '/crawl/sgk': 'POST - Manual crawl trigger (all or ?id=cn10-thiet-ke)',
                '/crawl/status': 'GET - Get crawl jobs status'
            },
            gdpt2018_verified: true
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
};
