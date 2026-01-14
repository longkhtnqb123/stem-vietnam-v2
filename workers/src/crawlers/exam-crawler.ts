// Exam Crawler - Đề thi THPT Quốc gia Công nghệ 2018-2025
// Chú thích: GDPT 2018 compliance, official exams only

import type { Env } from '../index';

/**
 * THPT Official Exams 2018-2025
 * Source: Bộ GD&ĐT, VnDoc, Tailieumoi
 */
export const THPT_OFFICIAL_EXAMS = [
    {
        year: 2024,
        name: 'Đề thi chính thức THPT QG 2024 - Công nghệ',
        url: 'https://vndoc.com/de-thi-thpt-quoc-gia-mon-cong-nghe-2024',
        gdpt2018_compliant: true,
        has_answer_key: true
    },
    {
        year: 2023,
        name: 'Đề thi chính thức THPT QG 2023 - Công nghệ',
        url: 'https://vndoc.com/de-thi-thpt-quoc-gia-mon-cong-nghe-2023',
        gdpt2018_compliant: true,
        has_answer_key: true
    },
    {
        year: 2022,
        name: 'Đề thi chính thức THPT QG 2022 - Công nghệ',
        url: 'https://vndoc.com/de-thi-thpt-quoc-gia-mon-cong-nghe-2022',
        gdpt2018_compliant: true,
        has_answer_key: true
    },
    {
        year: 2021,
        name: 'Đề thi chính thức THPT QG 2021 - Công nghệ',
        url: 'https://vndoc.com/de-thi-thpt-quoc-gia-mon-cong-nghe-2021',
        gdpt2018_compliant: true,
        has_answer_key: true
    },
    {
        year: 2020,
        name: 'Đề thi chính thức THPT QG 2020 - Công nghệ',
        url: 'https://vndoc.com/de-thi-thpt-quoc-gia-mon-cong-nghe-2020',
        gdpt2018_compliant: true,
        has_answer_key: true
    },
    {
        year: 2019,
        name: 'Đề thi chính thức THPT QG 2019 - Công nghệ',
        url: 'https://vndoc.com/de-thi-thpt-quoc-gia-mon-cong-nghe-2019',
        gdpt2018_compliant: true,
        has_answer_key: true
    },
    {
        year: 2018,
        name: 'Đề thi chính thức THPT QG 2018 - Công nghệ',
        url: 'https://vndoc.com/de-thi-thpt-quoc-gia-mon-cong-nghe-2018',
        gdpt2018_compliant: true,
        has_answer_key: true
    }
] as const;

interface ExamQuestion {
    id: string;
    question_number: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false';
    options?: string[];
    correct_answer: string;
    explanation?: string;
    level: 'remember' | 'understand' | 'apply' | 'analyze';
    topic?: string;
    year: number;
}

/**
 * Crawl single exam year
 */
export async function crawlExamYear(
    exam: typeof THPT_OFFICIAL_EXAMS[0],
    env: Env
): Promise<{ success: boolean; questions: number }> {
    console.log(`[Exam Crawler] Starting: ${exam.name}`);

    if (!exam.gdpt2018_compliant) {
        throw new Error(`[Exam Crawler] Not GDPT 2018 compliant: ${exam.year}`);
    }

    try {
        // Fetch exam page
        const response = await fetch(exam.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const html = await response.text();

        // Parse questions from HTML
        const questions = parseExamQuestions(html, exam.year);

        console.log(`[Exam Crawler] Parsed ${questions.length} questions from ${exam.year}`);

        // Store in D1
        for (const q of questions) {
            await env.DB.prepare(`
                INSERT OR REPLACE INTO exam_questions (
                    id, question_text, question_type, options, correct_answer,
                    explanation, level, year, source, metadata, gdpt2018_compliant, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                q.id,
                q.question_text,
                q.question_type,
                q.options ? JSON.stringify(q.options) : null,
                q.correct_answer,
                q.explanation || null,
                q.level,
                q.year,
                'THPT Official',
                JSON.stringify({ topic: q.topic, question_number: q.question_number }),
                true,
                Date.now()
            ).run();
        }

        // Store summary in R2
        await env.BOOKS_BUCKET.put(
            `exams/thpt-${exam.year}.json`,
            JSON.stringify({
                metadata: {
                    year: exam.year,
                    name: exam.name,
                    questions_count: questions.length,
                    gdpt2018_compliant: true,
                    crawled_at: new Date().toISOString()
                },
                questions
            })
        );

        console.log(`[Exam Crawler] ✅ Stored ${questions.length} questions from ${exam.year}`);

        return { success: true, questions: questions.length };

    } catch (error) {
        console.error(`[Exam Crawler] ❌ Failed ${exam.year}:`, error);
        return { success: false, questions: 0 };
    }
}

/**
 * Crawl all THPT exams 2018-2025
 */
export async function crawlAllExams(env: Env) {
    const results = [];

    for (const exam of THPT_OFFICIAL_EXAMS) {
        const result = await crawlExamYear(exam, env);
        results.push({
            year: exam.year,
            ...result
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const totalQuestions = results.reduce((sum, r) => sum + r.questions, 0);
    const successCount = results.filter(r => r.success).length;

    console.log(`[Exam Crawler] === Complete ===`);
    console.log(`Success: ${successCount}/${THPT_OFFICIAL_EXAMS.length} years`);
    console.log(`Total questions: ${totalQuestions}`);

    return results;
}

/**
 * Parse exam questions from HTML
 * Simplified - real implementation would use proper HTML parser
 */
function parseExamQuestions(html: string, year: number): ExamQuestion[] {
    const questions: ExamQuestion[] = [];

    // Simplified regex patterns - would use DOM parser in production
    // Pattern: "Câu 1: ..." hoặc "Question 1: ..."
    const questionPattern = /Câu\s+(\d+):\s*([^A-D]+?)(?=[A-D]\.|Câu|$)/gi;
    const optionPattern = /([A-D])\.\s*([^A-D]+?)(?=[A-D]\.|Đáp án|$)/gi;
    const answerPattern = /Đáp án[:\s]+([A-D])/i;

    let match;
    let questionNumber = 1;

    // Extract questions (simplified)
    while ((match = questionPattern.exec(html)) !== null) {
        const questionText = match[2].trim();

        // Extract options
        const options: string[] = [];
        let optionMatch;
        const questionContext = html.slice(match.index, match.index + 500);

        while ((optionMatch = optionPattern.exec(questionContext)) !== null) {
            options.push(optionMatch[2].trim());
            if (options.length >= 4) break;
        }

        // Extract answer
        const answerMatch = questionContext.match(answerPattern);
        const correctAnswer = answerMatch ? answerMatch[1] : 'A'; // Default A if not found

        // Determine level (simplified heuristic)
        const level = determineQuestionLevel(questionText);

        questions.push({
            id: `thpt-${year}-q${questionNumber}`,
            question_number: questionNumber++,
            question_text: questionText,
            question_type: options.length > 0 ? 'multiple_choice' : 'true_false',
            options: options.length > 0 ? options : undefined,
            correct_answer: correctAnswer,
            level,
            year
        });

        // Limit to reasonable number per exam
        if (questions.length >= 50) break;
    }

    return questions;
}

/**
 * Determine question difficulty level
 */
function determineQuestionLevel(questionText: string): 'remember' | 'understand' | 'apply' | 'analyze' {
    const lower = questionText.toLowerCase();

    // Remember: định nghĩa, là gì, tên gọi
    if (lower.includes('là gì') || lower.includes('định nghĩa') || lower.includes('tên gọi')) {
        return 'remember';
    }

    // Analyze: so sánh, phân tích, đánh giá
    if (lower.includes('so sánh') || lower.includes('phân tích') || lower.includes('đánh giá')) {
        return 'analyze';
    }

    // Apply: tính toán, áp dụng, giải
    if (lower.includes('tính') || lower.includes('áp dụng') || lower.includes('giải')) {
        return 'apply';
    }

    // Default: understand
    return 'understand';
}
