// Specialized Agents - Pre-configured agents for specific tasks
// Chú thích: Mỗi agent có expertise riêng

import { Agent, type Tool } from './agent-system';

/**
 * Researcher Agent - Tìm kiếm và tổng hợp thông tin
 */
export function createResearcherAgent(tools: {
    searchTool?: Tool;
    ragTool?: Tool;
}): Agent {
    const agentTools: Tool[] = [];

    if (tools.searchTool) agentTools.push(tools.searchTool);
    if (tools.ragTool) agentTools.push(tools.ragTool);

    return new Agent({
        role: 'Researcher',
        description: 'Chuyên gia nghiên cứu và tìm kiếm thông tin. Giỏi tra cứu, phân tích tài liệu, tổng hợp kiến thức.',
        tools: agentTools
    });
}

/**
 * Mathematician Agent - Giải toán và logic
 */
export function createMathematicianAgent(tools: {
    calculatorTool?: Tool;
}): Agent {
    const agentTools: Tool[] = [];

    if (tools.calculatorTool) agentTools.push(tools.calculatorTool);

    return new Agent({
        role: 'Mathematician',
        description: 'Chuyên gia toán học. Giỏi giải phương trình, chứng minh, tính toán phức tạp, suy luận logic.',
        tools: agentTools,
        model: 'google/gemini-2.0-flash-exp:free' // Gemini tốt với math
    });
}

/**
 * Coder Agent - Lập trình và debug
 */
export function createCoderAgent(tools: {
    pythonTool?: Tool;
    debugTool?: Tool;
}): Agent {
    const agentTools: Tool[] = [];

    if (tools.pythonTool) agentTools.push(tools.pythonTool);
    if (tools.debugTool) agentTools.push(tools.debugTool);

    return new Agent({
        role: 'Coder',
        description: 'Chuyên gia lập trình. Giỏi viết code, debug, giải thích thuật toán, optimize performance.',
        tools: agentTools,
        model: 'anthropic/claude-3.5-sonnet' // Claude tốt với code (nếu có budget)
    });
}

/**
 * Writer Agent - Viết văn và sáng tạo
 */
export function createWriterAgent(tools: {
    grammarTool?: Tool;
}): Agent {
    const agentTools: Tool[] = [];

    if (tools.grammarTool) agentTools.push(tools.grammarTool);

    return new Agent({
        role: 'Writer',
        description: 'Chuyên gia viết lách. Giỏi soạn thảo văn bản, bài luận, kịch bản, giải thích rõ ràng.',
        tools: agentTools
    });
}

/**
 * Critic Agent - Review và cải thiện
 */
export function createCriticAgent(): Agent {
    return new Agent({
        role: 'Critic',
        description: 'Thẩm định viên chuyên nghiệp. Giỏi tìm lỗi, đánh giá chất lượng, đề xuất cải thiện.',
        tools: []
    });
}

/**
 * Create default agent team
 */
export function createDefaultAgentTeam(tools: {
    searchTool?: Tool;
    ragTool?: Tool;
    calculatorTool?: Tool;
    pythonTool?: Tool;
}): Agent[] {
    return [
        createResearcherAgent({ searchTool: tools.searchTool, ragTool: tools.ragTool }),
        createMathematicianAgent({ calculatorTool: tools.calculatorTool }),
        createCoderAgent({ pythonTool: tools.pythonTool }),
        createWriterAgent({}),
        createCriticAgent()
    ];
}

/**
 * Smart agent selector - Chọn agent phù hợp dựa vào task
 */
export function selectAgentForTask(task: string, agents: Agent[]): Agent | null {
    const taskLower = task.toLowerCase();

    // Math keywords
    if (taskLower.match(/giải|tính|phương trình|công thức|toán|số|calculate/)) {
        return agents.find(a => a.getRole() === 'Mathematician') || null;
    }

    // Code keywords
    if (taskLower.match(/code|lập trình|python|javascript|bug|debug|function|class/)) {
        return agents.find(a => a.getRole() === 'Coder') || null;
    }

    // Research keywords
    if (taskLower.match(/tìm|search|nghiên cứu|tra cứu|thông tin|tài liệu/)) {
        return agents.find(a => a.getRole() === 'Researcher') || null;
    }

    // Writing keywords
    if (taskLower.match(/viết|soạn|bài luận|essay|thơ|truyện/)) {
        return agents.find(a => a.getRole() === 'Writer') || null;
    }

    // Review keywords
    if (taskLower.match(/review|kiểm tra|đánh giá|sửa|cải thiện/)) {
        return agents.find(a => a.getRole() === 'Critic') || null;
    }

    // Default: Researcher for general queries
    return agents.find(a => a.getRole() === 'Researcher') || agents[0] || null;
}
