// Tool Registry - Central registry for all available tools
// Chú thích: Tools cho phép AI agents thực hiện actions cụ thể

import type { Tool } from '../agents/agent-system';

/**
 * Calculator Tool - Tính toán phức tạp
 */
export const calculatorTool: Tool = {
    name: 'calculator',
    description: 'Tính toán biểu thức toán học. Input: { expression: "1+2*3" }. Output: kết quả số.',
    execute: async (input: { expression: string }) => {
        try {
            // Safe eval using Function constructor
            // Chỉ cho phép math operations
            const sanitized = input.expression.replace(/[^0-9+\-*/().^\s]/g, '');

            // Replace ^ with **
            const jsExpression = sanitized.replace(/\^/g, '**');

            const result = Function(`'use strict'; return (${jsExpression})`)();

            console.log('[Calculator] Calculated:', { expression: input.expression, result });
            return { result, expression: input.expression };
        } catch (error) {
            console.error('[Calculator] Error:', error);
            return { error: `Calculation error: ${error}`, expression: input.expression };
        }
    }
};

/**
 * Web Search Tool - Tìm kiếm web (DuckDuckGo)
 */
export function createWebSearchTool(env: { OPENROUTER_API_KEY?: string }): Tool {
    return {
        name: 'web_search',
        description: 'Tìm kiếm thông tin trên web. Input: { query: "search term", numResults: 5 }',
        execute: async (input: { query: string; numResults?: number }) => {
            try {
                const { webSearch } = await import('../duckduckgo');
                const results = await webSearch(input.query, input.numResults || 5);

                console.log('[WebSearch] Found:', {
                    query: input.query,
                    resultsCount: results.sources.length
                });

                return {
                    results: results.sources.map(s => ({
                        title: s.title,
                        snippet: s.snippet,
                        url: s.url
                    }))
                };
            } catch (error) {
                console.error('[WebSearch] Error:', error);
                return { error: `Search failed: ${error}` };
            }
        }
    };
}

/**
 * RAG Tool - Tìm kiếm trong knowledge base
 */
export function createRAGTool(env: {
    VECTORIZE?: VectorizeIndex;
    DB?: D1Database;
    OPENROUTER_API_KEY?: string;
}): Tool {
    return {
        name: 'rag_search',
        description: 'Tìm kiếm trong thư viện SGK. Input: { query: "search term", topK: 5 }',
        execute: async (input: { query: string; topK?: number }) => {
            try {
                if (!env.VECTORIZE || !env.DB || !env.OPENROUTER_API_KEY) {
                    return { error: 'RAG not available (missing bindings)' };
                }

                const { getAdvancedRAGContext } = await import('../rag/advanced-rag-pipeline');

                const result = await getAdvancedRAGContext(
                    env.OPENROUTER_API_KEY,
                    env.VECTORIZE,
                    input.query,
                    env.DB
                );

                console.log('[RAG] Found:', {
                    query: input.query,
                    sourcesCount: result.sources.length
                });

                return {
                    context: result.context,
                    sources: result.sources.map(s => ({
                        id: s.id,
                        content: s.content.substring(0, 200),
                        score: s.score
                    }))
                };
            } catch (error) {
                console.error('[RAG] Error:', error);
                return { error: `RAG search failed: ${error}` };
            }
        }
    };
}

/**
 * Python Executor Tool - Chạy Python code (lightweight)
 * Note: Chưa có sandbox thực sự, chỉ simulate
 */
export const pythonExecutorTool: Tool = {
    name: 'python_executor',
    description: 'Chạy Python code. Input: { code: "print(2+2)" }. Output: kết quả chương trình.',
    execute: async (input: { code: string }) => {
        // TODO: Integrate với Pyodide (WASM) hoặc E2B (sandbox)
        // Hiện tại: simulate một số operations đơn giản

        console.log('[Python] Simulating execution:', input.code.substring(0, 50));

        try {
            // Simulate: detect simple math
            const mathMatch = input.code.match(/print\((.+)\)/);
            if (mathMatch) {
                const expr = mathMatch[1];
                const result = calculatorTool.execute({ expression: expr });
                return {
                    output: `${(await result).result}`,
                    code: input.code,
                    note: 'Simulated (math expression)'
                };
            }

            // Simulate: detect simple operations
            if (input.code.includes('len(')) {
                return {
                    output: 'Length calculation result',
                    code: input.code,
                    note: 'Simulated (string/list operations)'
                };
            }

            return {
                output: 'Code execution simulated',
                code: input.code,
                note: 'Full Python executor not yet implemented. Use Pyodide or E2B for production.'
            };
        } catch (error) {
            return { error: `Execution error: ${error}` };
        }
    }
};

/**
 * Code Explainer Tool - Giải thích code
 */
export function createCodeExplainerTool(apiKey: string): Tool {
    return {
        name: 'code_explainer',
        description: 'Giải thích code. Input: { code: "def foo()...", language: "python" }',
        execute: async (input: { code: string; language?: string }) => {
            try {
                const { callOpenRouter } = await import('../openrouter');

                const prompt = `Giải thích code sau (ngôn ngữ: ${input.language || 'unknown'}):

\`\`\`${input.language || ''}
${input.code}
\`\`\`

Hãy giải thích:
1. Code làm gì
2. Từng dòng có ý nghĩa gì
3. Complexity (time/space)`;

                const response = await callOpenRouter(apiKey, {
                    messages: [{ role: 'user', content: prompt }],
                    model: 'google/gemini-2.0-flash-exp:free'
                });

                return {
                    explanation: response.text,
                    code: input.code
                };
            } catch (error) {
                return { error: `Explanation failed: ${error}` };
            }
        }
    };
}

/**
 * Grammar Check Tool - Kiểm tra ngữ pháp
 */
export const grammarCheckTool: Tool = {
    name: 'grammar_check',
    description: 'Kiểm tra ngữ pháp tiếng Việt/Anh. Input: { text: "..." }',
    execute: async (input: { text: string }) => {
        // Simple heuristic checks (production: dùng LanguageTool API)
        const issues: string[] = [];

        // Check basic Vietnamese diacritics
        if (input.text.match(/[aeiou]{3,}/i)) {
            issues.push('Có thể thiếu dấu thanh');
        }

        // Check double spaces
        if (input.text.includes('  ')) {
            issues.push('Có khoảng trắng thừa');
        }

        // Check sentence capitalization
        const sentences = input.text.split(/[.!?]+/);
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed && !/^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/.test(trimmed)) {
                issues.push('Câu không viết hoa chữ cái đầu');
                break;
            }
        }

        return {
            text: input.text,
            issues,
            isClean: issues.length === 0
        };
    }
};

/**
 * Get all available tools
 */
export function getAllTools(env: any, apiKey: string): Tool[] {
    return [
        calculatorTool,
        createWebSearchTool(env),
        createRAGTool(env),
        pythonExecutorTool,
        createCodeExplainerTool(apiKey),
        grammarCheckTool
    ];
}

/**
 * Get tool by name
 */
export function getTool(name: string, env: any, apiKey: string): Tool | null {
    const tools = getAllTools(env, apiKey);
    return tools.find(t => t.name === name) || null;
}
