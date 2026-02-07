// UsageStatsCard - Component hien thi thong ke su dung AI
import { useState, useEffect } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

interface UsageStats {
    summary: {
        totalCalls: number;
        totalTokensIn: number;
        totalTokensOut: number;
        totalTokens: number;
        avgLatency: number;
    };
    byAction: Array<{
        actionType: string;
        calls: number;
        tokensIn: number;
        tokensOut: number;
    }>;
    byModel: Array<{
        model: string;
        calls: number;
        tokensIn: number;
        tokensOut: number;
    }>;
    daily: Array<{
        date: string;
        calls: number;
        tokens: number;
    }>;
}

interface UsageStatsCardProps {
    token: string;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatActionType(action: string): string {
    const map: Record<string, string> = {
        'chat': 'Chat AI',
        'exam_generate': 'Tạo đề thi',
        'rag_search': 'Tìm SGK',
    };
    return map[action] || action;
}

function formatModelName(model: string): string {
    if (model.includes('gemini')) return 'Gemini Flash';
    if (model.includes('deepseek')) return 'DeepSeek R1';
    if (model.includes('mimo')) return 'MiMo Code';
    if (model.includes('devstral')) return 'Devstral';
    return model.split('/').pop() || model;
}

export default function UsageStatsCard({ token }: UsageStatsCardProps) {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/api/usage/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!res.ok) {
                    throw new Error('Không thể tải thống kê');
                }

                const data = await res.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [token]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="text-center text-slate-500 py-4">
                    <span className="lms-guide-tag">STAT</span>
                    <p>Chưa có dữ liệu sử dụng AI</p>
                </div>
            </div>
        );
    }

    const { summary, byAction, byModel, daily } = stats;
    const maxDailyTokens = Math.max(...daily.map(d => d.tokens), 1);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="lms-guide-tag">AI</span>
                Thống kê sử dụng AI
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl p-3 text-white">
                    <div className="text-xs opacity-80">Tổng tokens</div>
                    <p className="text-xl font-bold">{formatNumber(summary.totalTokens)}</p>
                </div>
                <div className="bg-gradient-to-br from-secondary-500 to-secondary-400 rounded-xl p-3 text-white">
                    <div className="text-xs opacity-80">Số lần gọi</div>
                    <p className="text-xl font-bold">{summary.totalCalls}</p>
                </div>
                <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl p-3 text-white">
                    <div className="text-xs opacity-80">Input</div>
                    <p className="text-xl font-bold">{formatNumber(summary.totalTokensIn)}</p>
                </div>
                <div className="bg-gradient-to-br from-primary-500 to-secondary-300 rounded-xl p-3 text-white">
                    <div className="text-xs opacity-80">Độ trễ TB</div>
                    <p className="text-xl font-bold">{summary.avgLatency}ms</p>
                </div>
            </div>

            {daily.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Token 7 ngày gần nhất
                    </h3>
                    <div className="flex items-end justify-between gap-1 h-20">
                        {daily.slice(0, 7).reverse().map((d, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-primary-500 to-secondary-400 rounded-t-sm transition-all"
                                    style={{ height: `${(d.tokens / maxDailyTokens) * 100}%`, minHeight: d.tokens > 0 ? '8px' : '2px' }}
                                    title={`${d.tokens} tokens`}
                                />
                                <span className="text-[10px] text-slate-500 mt-1">
                                    {new Date(d.date).getDate()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {byAction.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Theo tính năng
                        </h3>
                        <div className="space-y-2">
                            {byAction.slice(0, 3).map((a, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {formatActionType(a.actionType)}
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {a.calls} lần
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {byModel.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Theo model AI
                        </h3>
                        <div className="space-y-2">
                            {byModel.slice(0, 3).map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {formatModelName(m.model)}
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {formatNumber(m.tokensIn + m.tokensOut)} tok
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
