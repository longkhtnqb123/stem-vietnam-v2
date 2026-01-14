// Q&A Platform Crawler - VnDoc, HocMai, VietJack
// Chú thích: Crawl community Q&A, practice questions, mock exams

import type { Env } from '../index';

/**
 * Q&A Platforms for GDPT 2018 content
 */
export const QA_PLATFORMS = {
    vndoc: {
        name: 'VnDoc',
        base_url: 'https://vndoc.com',
        endpoints: [
            '/cong-nghe-10-ket-noi-tri-thuc',
            '/cong-nghe-11-ket-noi-tri-thuc',
            '/cong-nghe-12-ket-noi-tri-thuc',
            '/de-thi-cong-nghe-10',
            '/de-thi-cong-nghe-11',
            '/de-thi-cong-nghe-12'
        ],
        gdpt2018_verified: true
    },
    hocmai: {
        name: 'HocMai',
        base_url: 'https://hocmai.vn',
        endpoints: [
            '/cong-nghe-10',
            '/cong-nghe-11',
            '/cong-nghe-12'
        ],
        gdpt2018_verified: true
    },
    vietjack: {
        name: 'VietJack',
        base_url: 'https://vietjack.com',
        endpoints: [
            '/tai-lieu-hoc-tap-lop-10/cong-nghe-10-ket-noi-tri-thuc',
            '/tai-lieu-hoc-tap-lop-11/cong-nghe-11-ket-noi-tri-thuc',
            '/tai-lieu-hoc-tap-lop-12/cong-nghe-12-ket-noi-tri-thuc'
        ],
        gdpt2018_verified: true
    }
} as const;

interface QAPair {
    id: string;
    question: string;
    answer: string;
    source_platform: string;
    topic?: string;
    grade?: number;
    quality_score: number;
}

/**
 * Crawl Q&A from single platform
 */
export async function crawlQAPlatform(
    platform: keyof typeof QA_PLATFORMS,
    env: Env
): Promise<{ success: boolean; pairs: number }> {
    const config = QA_PLATFORMS[platform];
    console.log(`[Q&A Crawler] Starting: ${config.name}`);

    const allPairs: QAPair[] = [];

    for (const endpoint of config.endpoints) {
        try {
            const url = config.base_url + endpoint;
            console.log(`[Q&A Crawler] Fetching: ${url}`);

            const response = await fetch(url);
            if (!response.ok) continue;

            const html = await response.text();

            // Parse Q&A pairs
            const pairs = parseQAPairs(html, platform, endpoint);

            // Filter quality
            const qualityPairs = pairs.filter(p => p.quality_score >= 60);

            allPairs.push(...qualityPairs);

            console.log(`[Q&A Crawler] Found ${qualityPairs.length} quality pairs from ${url}`);

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.warn(`[Q&A Crawler] Failed ${endpoint}:`, error);
        }
    }

    // Store in D1
    for (const pair of allPairs) {
        await env.DB.prepare(`
            INSERT OR REPLACE INTO qa_pairs (
                id, question, answer, source_platform, topic, grade,
                quality_score, verified, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            pair.id,
            pair.question,
            pair.answer,
            pair.source_platform,
            pair.topic || null,
            pair.grade || null,
            pair.quality_score,
            config.gdpt2018_verified,
            JSON.stringify({ platform }),
            Date.now()
        ).run();
    }

    // Store backup in R2
    await env.BOOKS_BUCKET.put(
        `qa/${platform}-gdpt2018.json`,
        JSON.stringify({
            metadata: {
                platform: config.name,
                total_pairs: allPairs.length,
                endpoints: config.endpoints.length,
                gdpt2018_verified: config.gdpt2018_verified,
                crawled_at: new Date().toISOString()
            },
            pairs: allPairs
        })
    );

    console.log(`[Q&A Crawler] ✅ ${config.name}: ${allPairs.length} pairs stored`);

    return { success: true, pairs: allPairs.length };
}

/**
 * Crawl all Q&A platforms
 */
export async function crawlAllQA(env: Env) {
    const results = [];

    for (const platform of Object.keys(QA_PLATFORMS) as Array<keyof typeof QA_PLATFORMS>) {
        const result = await crawlQAPlatform(platform, env);
        results.push({
            platform,
            ...result
        });

        // Rate limiting between platforms
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const totalPairs = results.reduce((sum, r) => sum + r.pairs, 0);
    const successCount = results.filter(r => r.success).length;

    console.log(`[Q&A Crawler] === Complete ===`);
    console.log(`Success: ${successCount}/${Object.keys(QA_PLATFORMS).length} platforms`);
    console.log(`Total Q&A pairs: ${totalPairs}`);

    return results;
}

/**
 * Parse Q&A pairs from HTML
 */
function parseQAPairs(html: string, platform: string, endpoint: string): QAPair[] {
    const pairs: QAPair[] = [];

    // Extract grade from endpoint
    const gradeMatch = endpoint.match(/(\d+)/);
    const grade = gradeMatch ? parseInt(gradeMatch[1]) : undefined;

    // Simplified parsing - would use proper HTML parser/Cheerio in production
    // Pattern variations based on platform

    // VnDoc pattern: <h3>Câu hỏi: ...</h3> <div class="answer">...</div>
    const vndocPattern = /<h[23]>([^<]*(?:Câu hỏi|Question)[^<]*?)<\/h[23]>[\s\S]*?<div[^>]*(?:answer|content)[^>]*>([\s\S]*?)<\/div>/gi;

    // HocMai pattern: <div class="question">...</div> <div class="solution">...</div>
    const hocmaiPattern = /<div[^>]*question[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div[^>]*solution[^>]*>([\s\S]*?)<\/div>/gi;

    // VietJack pattern: <strong>Câu ...</strong> ... <p>Đáp án: ...</p>
    const vietjackPattern = /<strong>([^<]*Câu[^<]*)<\/strong>([\s\S]*?)<p>([^<]*(?:Đáp án|Trả lời)[^<]*)<\/p>/gi;

    let match;
    let pairIndex = 0;

    // Try different patterns
    const patterns = [vndocPattern, hocmaiPattern, vietjackPattern];

    for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex

        while ((match = pattern.exec(html)) !== null && pairIndex < 100) {
            const question = cleanHTML(match[1]);
            const answer = cleanHTML(match[2] || match[3] || '');

            if (question.length < 10 || answer.length < 20) continue;

            // Quality scoring
            const quality_score = calculateQualityScore(question, answer);

            pairs.push({
                id: `qa-${platform}-${endpoint.replace(/\//g, '-')}-${pairIndex}`,
                question,
                answer,
                source_platform: platform,
                grade,
                quality_score
            });

            pairIndex++;
        }

        if (pairs.length > 0) break; // Stop if we found pairs with this pattern
    }

    return pairs;
}

/**
 * Clean HTML tags and entities
 */
function cleanHTML(text: string): string {
    return text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Calculate Q&A quality score (0-100)
 */
function calculateQualityScore(question: string, answer: string): number {
    let score = 0;

    // Length check
    if (answer.length > 50) score += 20;
    if (answer.length > 150) score += 10;

    // Has Vietnamese diacritics (not poor translation)
    if (/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(answer)) {
        score += 20;
    }

    // Has technical terms relevant to technology
    const technicalTerms = [
        'điện', 'máy', 'công nghệ', 'hệ thống', 'nguyên lý',
        'mạch', 'động cơ', 'công suất', 'năng lượng', 'thiết kế'
    ];
    const termCount = technicalTerms.filter(term =>
        answer.toLowerCase().includes(term)
    ).length;
    score += Math.min(termCount * 5, 20);

    // Has examples or explanation markers
    if (/(?:ví dụ|chẳng hạn|cụ thể|như sau|bao gồm)/i.test(answer)) {
        score += 10;
    }

    // Not spam/placeholder
    if (!/(đang cập nhật|click here|download|đăng ký)/i.test(answer)) {
        score += 10;
    }

    // Complete sentences
    if (answer.match(/[.!?]/) && answer.split(/[.!?]/).length > 2) {
        score += 10;
    }

    return Math.min(score, 100);
}
