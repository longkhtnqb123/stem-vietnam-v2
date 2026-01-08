// A/B Testing Framework
// Chú thích: Test different variants to optimize performance

export type Variant = 'control' | 'variant_a' | 'variant_b';

export interface ABTestConfig {
    testId: string;
    variants: {
        control: number;     // 50% traffic
        variant_a: number;   // 25% traffic
        variant_b: number;   // 25% traffic
    };
}

export interface ABTestResult {
    variant: Variant;
    metrics: {
        responseTime: number;
        quality: number;
        userSatisfaction?: number;
    };
}

/**
 * Assign user to variant (consistent assignment)
 */
export function assignVariant(userId: string, config: ABTestConfig): Variant {
    // Hash userId to get consistent variant
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    const random = Math.abs(hash) % 100;

    if (random < config.variants.control) {
        return 'control';
    } else if (random < config.variants.control + config.variants.variant_a) {
        return 'variant_a';
    } else {
        return 'variant_b';
    }
}

/**
 * Log A/B test result to D1
 */
export async function logABTest({
    db,
    userId,
    testId,
    variant,
    metrics
}: {
    db: D1Database;
    userId: string;
    testId: string;
    variant: Variant;
    metrics: ABTestResult['metrics'];
}): Promise<void> {
    try {
        await db.prepare(`
            INSERT INTO ab_test_results (
                user_id, test_id, variant,
                response_time, quality, user_satisfaction,
                timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            testId,
            variant,
            metrics.responseTime,
            metrics.quality,
            metrics.userSatisfaction || null,
            Date.now()
        ).run();
    } catch (error) {
        console.error('[ABTest] Log error:', error);
    }
}

/**
 * Get A/B test statistics
 */
export async function getABTestStats({
    db,
    testId
}: {
    db: D1Database;
    testId: string;
}): Promise<Record<Variant, { count: number; avgResponseTime: number; avgQuality: number }>> {
    try {
        const results = await db.prepare(`
            SELECT 
                variant,
                COUNT(*) as count,
                AVG(response_time) as avg_response_time,
                AVG(quality) as avg_quality
            FROM ab_test_results
            WHERE test_id = ?
            GROUP BY variant
        `).bind(testId).all();

        const stats: any = {
            control: { count: 0, avgResponseTime: 0, avgQuality: 0 },
            variant_a: { count: 0, avgResponseTime: 0, avgQuality: 0 },
            variant_b: { count: 0, avgResponseTime: 0, avgQuality: 0 }
        };

        for (const row of results.results) {
            const variant = row.variant as Variant;
            stats[variant] = {
                count: row.count as number,
                avgResponseTime: row.avg_response_time as number,
                avgQuality: row.avg_quality as number
            };
        }

        return stats;
    } catch (error) {
        console.error('[ABTest] Stats error:', error);
        return {
            control: { count: 0, avgResponseTime: 0, avgQuality: 0 },
            variant_a: { count: 0, avgResponseTime: 0, avgQuality: 0 },
            variant_b: { count: 0, avgResponseTime: 0, avgQuality: 0 }
        };
    }
}
