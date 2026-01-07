// Chú thích: DuckDuckGo Search API client cho Cloudflare Workers
// DuckDuckGo Instant Answer API - miễn phí, không cần API key
// Dùng để bổ sung thông tin web search cho AI

// ============================================
// TYPES
// ============================================

export interface DuckDuckGoResult {
    query: string;
    abstract: string;
    abstractSource: string;
    abstractURL: string;
    heading: string;
    relatedTopics: Array<{
        text: string;
        url: string;
    }>;
    answer: string;
    answerType: string;
    image: string;
    infobox?: {
        content: Array<{
            label: string;
            value: string;
        }>;
    };
}

export interface WebSearchResult {
    source: 'duckduckgo';
    query: string;
    summary: string;
    sources: Array<{
        title: string;
        url: string;
        snippet: string;
    }>;
    timestamp: number;
}

// ============================================
// DUCKDUCKGO INSTANT ANSWER API
// ============================================

const DDG_API_URL = 'https://api.duckduckgo.com/';

// Chú thích: Gọi DuckDuckGo Instant Answer API
// API này trả về thông tin nhanh từ Wikipedia, Wikidata, etc.
export async function searchDuckDuckGo(query: string): Promise<WebSearchResult> {
    const t0 = Date.now();

    try {
        // Chú thích: DuckDuckGo API params
        // format=json: trả về JSON
        // no_redirect=1: không redirect
        // no_html=1: không HTML trong response
        // skip_disambig=1: skip disambiguation pages
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            no_redirect: '1',
            no_html: '1',
            skip_disambig: '1',
        });

        const response = await fetch(`${DDG_API_URL}?${params.toString()}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'STEM-Vietnam-Bot/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`DuckDuckGo API error: ${response.status}`);
        }

        const data = await response.json() as {
            Abstract: string;
            AbstractSource: string;
            AbstractURL: string;
            Heading: string;
            Answer: string;
            AnswerType: string;
            Image: string;
            RelatedTopics: Array<{
                Text?: string;
                FirstURL?: string;
                Topics?: Array<{
                    Text: string;
                    FirstURL: string;
                }>;
            }>;
            Infobox?: {
                content: Array<{
                    label: string;
                    value: string;
                }>;
            };
        };

        // Chú thích: Build summary từ response
        let summary = '';

        // Ưu tiên Answer (direct answer)
        if (data.Answer) {
            summary = data.Answer;
        }
        // Sau đó Abstract (từ Wikipedia, etc.)
        else if (data.Abstract) {
            summary = data.Abstract;
            if (data.AbstractSource) {
                summary += ` (Nguồn: ${data.AbstractSource})`;
            }
        }

        // Chú thích: Extract related topics làm sources
        const sources: Array<{ title: string; url: string; snippet: string }> = [];

        if (data.RelatedTopics) {
            for (const topic of data.RelatedTopics.slice(0, 5)) {
                if (topic.Text && topic.FirstURL) {
                    sources.push({
                        title: topic.Text.split(' - ')[0] || topic.Text,
                        url: topic.FirstURL,
                        snippet: topic.Text,
                    });
                }
                // Nested topics (categories)
                if (topic.Topics) {
                    for (const subTopic of topic.Topics.slice(0, 3)) {
                        sources.push({
                            title: subTopic.Text.split(' - ')[0] || subTopic.Text,
                            url: subTopic.FirstURL,
                            snippet: subTopic.Text,
                        });
                    }
                }
            }
        }

        const latency = Date.now() - t0;
        console.log('[duckduckgo] search done', {
            query,
            latency,
            hasAbstract: !!data.Abstract,
            hasAnswer: !!data.Answer,
            sourcesCount: sources.length,
        });

        return {
            source: 'duckduckgo',
            query,
            summary,
            sources: sources.slice(0, 5), // Giới hạn 5 sources
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error('[duckduckgo] error:', error);

        // Trả về empty result thay vì throw
        return {
            source: 'duckduckgo',
            query,
            summary: '',
            sources: [],
            timestamp: Date.now(),
        };
    }
}

// ============================================
// DUCKDUCKGO HTML SEARCH (Scraping fallback)
// ============================================

// Chú thích: Fallback search qua DuckDuckGo HTML (khi Instant Answer không có kết quả)
// Sử dụng DuckDuckGo Lite (text-only version)
export async function searchDuckDuckGoHTML(query: string): Promise<WebSearchResult> {
    const t0 = Date.now();

    try {
        const params = new URLSearchParams({
            q: query,
        });

        // Chú thích: DuckDuckGo Lite - phiên bản text-only, dễ parse hơn
        const response = await fetch(`https://lite.duckduckgo.com/lite/?${params.toString()}`, {
            headers: {
                'User-Agent': 'STEM-Vietnam-Bot/1.0',
                'Accept': 'text/html',
            },
        });

        if (!response.ok) {
            throw new Error(`DuckDuckGo Lite error: ${response.status}`);
        }

        const html = await response.text();

        // Chú thích: Simple regex extraction (không dùng DOM parser trong Workers)
        const sources: Array<{ title: string; url: string; snippet: string }> = [];

        // Pattern để tìm kết quả search
        // Format: <a class="result-link" href="URL">Title</a>
        const linkRegex = /<a[^>]*class="[^"]*result-link[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        const snippetRegex = /<td[^>]*class="[^"]*result-snippet[^"]*"[^>]*>([^<]+)<\/td>/gi;

        let match;
        const titles: string[] = [];
        const urls: string[] = [];
        const snippets: string[] = [];

        while ((match = linkRegex.exec(html)) !== null && titles.length < 5) {
            urls.push(match[1]);
            titles.push(match[2].trim());
        }

        while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
            snippets.push(match[1].trim());
        }

        for (let i = 0; i < Math.min(titles.length, urls.length); i++) {
            sources.push({
                title: titles[i],
                url: urls[i],
                snippet: snippets[i] || '',
            });
        }

        const latency = Date.now() - t0;
        console.log('[duckduckgo-lite] search done', {
            query,
            latency,
            sourcesCount: sources.length,
        });

        // Chú thích: Tạo summary từ snippets
        const summary = sources
            .slice(0, 3)
            .map(s => s.snippet)
            .filter(Boolean)
            .join(' ');

        return {
            source: 'duckduckgo',
            query,
            summary,
            sources,
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error('[duckduckgo-lite] error:', error);

        return {
            source: 'duckduckgo',
            query,
            summary: '',
            sources: [],
            timestamp: Date.now(),
        };
    }
}

// ============================================
// UNIFIED SEARCH FUNCTION
// ============================================

// Chú thích: Hàm search thống nhất - thử Instant Answer trước, fallback sang HTML
export async function webSearch(query: string): Promise<WebSearchResult> {
    // Thử Instant Answer API trước (nhanh hơn, structured data)
    const instantResult = await searchDuckDuckGo(query);

    // Nếu có kết quả, return luôn
    if (instantResult.summary || instantResult.sources.length > 0) {
        return instantResult;
    }

    // Fallback sang HTML search
    console.info('[websearch] Instant Answer empty, trying HTML search');
    return searchDuckDuckGoHTML(query);
}

// Chú thích: Format kết quả search thành context string cho AI
export function formatSearchResultsAsContext(result: WebSearchResult): string {
    if (!result.summary && result.sources.length === 0) {
        return '';
    }

    let context = `=== KẾT QUẢ TÌM KIẾM WEB ===\n`;
    context += `Truy vấn: "${result.query}"\n\n`;

    if (result.summary) {
        context += `**Tóm tắt:** ${result.summary}\n\n`;
    }

    if (result.sources.length > 0) {
        context += `**Nguồn tham khảo:**\n`;
        for (const source of result.sources) {
            context += `- ${source.title}\n`;
            if (source.snippet) {
                context += `  ${source.snippet}\n`;
            }
            context += `  URL: ${source.url}\n\n`;
        }
    }

    context += `=== HẾT KẾT QUẢ TÌM KIẾM ===\n`;
    return context;
}
