// Agent System - Base classes for multi-agent collaboration
// Chú thích: Multi-agent vượt trội single agent ở complex tasks

export interface Tool {
    name: string;
    description: string;
    execute: (input: any) => Promise<any>;
}

export interface AgentConfig {
    role: string;
    description: string;
    tools: Tool[];
    model?: string;
}

export interface AgentResponse {
    success: boolean;
    result: string;
    toolCalls?: Array<{ tool: string; input: any; output: any }>;
    confidence: number;
}

/**
 * Base Agent class
 */
export class Agent {
    private role: string;
    private description: string;
    private tools: Map<string, Tool>;
    private model: string;

    constructor(config: AgentConfig) {
        this.role = config.role;
        this.description = config.description;
        this.tools = new Map();
        config.tools.forEach(tool => this.tools.set(tool.name, tool));
        this.model = config.model || 'google/gemini-2.0-flash-exp:free';
    }

    /**
     * Process a task
     */
    async process({
        task,
        context,
        apiKey
    }: {
        task: string;
        context?: string;
        apiKey: string;
    }): Promise<AgentResponse> {
        const { callOpenRouter } = await import('../openrouter');

        // Build prompt with role and tools
        const prompt = this.buildPrompt(task, context);

        try {
            const response = await callOpenRouter(apiKey, {
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
            });

            // Parse tool calls from response
            const toolCalls = await this.executeToolCalls(response.text);

            return {
                success: true,
                result: response.text,
                toolCalls,
                confidence: 0.85
            };
        } catch (error) {
            console.error(`[Agent:${this.role}] Error:`, error);
            return {
                success: false,
                result: `Error: ${error}`,
                confidence: 0
            };
        }
    }

    /**
     * Build prompt with role description and available tools
     */
    private buildPrompt(task: string, context?: string): string {
        const toolList = Array.from(this.tools.values())
            .map(t => `- **${t.name}**: ${t.description}`)
            .join('\n');

        return `Bạn là **${this.role}**.

**Mô tả vai trò**: ${this.description}

**Nhiệm vụ**: ${task}

${context ? `**Context**:\n${context}\n` : ''}
${toolList ? `\n**Tools có thể dùng**:\n${toolList}\n\nNếu cần dùng tool, format: USE_TOOL[tool_name](input)\n` : ''}
Hãy hoàn thành nhiệm vụ một cách chuyên nghiệp.`;
    }

    /**
     * Execute tool calls mentioned in response
     */
    private async executeToolCalls(response: string): Promise<Array<{ tool: string; input: any; output: any }>> {
        const toolCalls: Array<{ tool: string; input: any; output: any }> = [];

        // Parse tool calls from response (format: USE_TOOL[tool_name](input))
        const matches = response.matchAll(/USE_TOOL\[(\w+)\]\((.*?)\)/g);

        for (const match of matches) {
            const toolName = match[1];
            const inputStr = match[2];

            const tool = this.tools.get(toolName);
            if (!tool) {
                console.warn(`[Agent] Unknown tool: ${toolName}`);
                continue;
            }

            try {
                const input = JSON.parse(inputStr);
                const output = await tool.execute(input);
                toolCalls.push({ tool: toolName, input, output });
            } catch (error) {
                console.error(`[Agent] Tool ${toolName} failed:`, error);
            }
        }

        return toolCalls;
    }

    getRole(): string {
        return this.role;
    }

    getTools(): string[] {
        return Array.from(this.tools.keys());
    }
}

/**
 * Orchestrator - Coordinates multiple agents
 */
export class Orchestrator {
    private agents: Map<string, Agent>;
    private model: string;

    constructor(agents: Agent[], model = 'google/gemini-2.0-flash-exp:free') {
        this.agents = new Map();
        agents.forEach(agent => this.agents.set(agent.getRole(), agent));
        this.model = model;
    }

    /**
     * Process complex task by delegating to appropriate agents
     */
    async process({
        task,
        context,
        apiKey
    }: {
        task: string;
        context?: string;
        apiKey: string;
    }): Promise<{
        result: string;
        agentResponses: Array<{ agent: string; response: AgentResponse }>;
    }> {
        const { callOpenRouter } = await import('../openrouter');

        // Step 1: Orchestrator decides which agents to use
        const agentList = Array.from(this.agents.keys()).join(', ');
        const planningPrompt = `Bạn là **Orchestrator** - điều phối viên.

**Task**: ${task}

**Available Agents**: ${agentList}

Hãy quyết định:
1. Agent nào phù hợp nhất để xử lý task này?
2. Task có cần chia nhỏ không?

Format output:
SELECTED_AGENTS: [agent1, agent2, ...]
SUBTASKS:
- agent1: subtask description
- agent2: subtask description
`;

        const plan = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: planningPrompt }],
            model: this.model
        });

        // Step 2: Parse plan and delegate to agents
        const selectedAgents = this.parsePlan(plan.text);
        const agentResponses: Array<{ agent: string; response: AgentResponse }> = [];

        for (const { agentRole, subtask } of selectedAgents) {
            const agent = this.agents.get(agentRole);
            if (!agent) continue;

            const response = await agent.process({
                task: subtask,
                context,
                apiKey
            });

            agentResponses.push({ agent: agentRole, response });
        }

        // Step 3: Synthesize results
        const synthesis = await this.synthesize(task, agentResponses, apiKey);

        return {
            result: synthesis,
            agentResponses
        };
    }

    /**
     * Parse orchestrator's plan
     */
    private parsePlan(planText: string): Array<{ agentRole: string; subtask: string }> {
        const subtasks: Array<{ agentRole: string; subtask: string }> = [];

        // Extract subtasks from plan
        const lines = planText.split('\n');
        let inSubtasks = false;

        for (const line of lines) {
            if (line.includes('SUBTASKS:')) {
                inSubtasks = true;
                continue;
            }

            if (inSubtasks && line.trim().startsWith('-')) {
                const match = line.match(/- (\w+): (.+)/);
                if (match) {
                    subtasks.push({
                        agentRole: match[1],
                        subtask: match[2]
                    });
                }
            }
        }

        // Fallback: if no subtasks, use first agent
        if (subtasks.length === 0 && this.agents.size > 0) {
            const firstAgent = Array.from(this.agents.keys())[0];
            subtasks.push({
                agentRole: firstAgent,
                subtask: planText
            });
        }

        return subtasks;
    }

    /**
     * Synthesize results from multiple agents
     */
    private async synthesize(
        task: string,
        agentResponses: Array<{ agent: string; response: AgentResponse }>,
        apiKey: string
    ): Promise<string> {
        const { callOpenRouter } = await import('../openrouter');

        const responsesText = agentResponses
            .map(ar => `**${ar.agent}**: ${ar.response.result}`)
            .join('\n\n');

        const synthesisPrompt = `Bạn là **Synthesizer** - tổng hợp kết quả.

**Original Task**: ${task}

**Kết quả từ các agents**:
${responsesText}

Hãy tổng hợp thành câu trả lời cuối cùng, súc tích và đầy đủ.`;

        const result = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: synthesisPrompt }],
            model: this.model
        });

        return result.text;
    }

    addAgent(agent: Agent): void {
        this.agents.set(agent.getRole(), agent);
    }

    getAgents(): string[] {
        return Array.from(this.agents.keys());
    }
}
