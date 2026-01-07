// Chú thích: File Parser Module - Hỗ trợ nhiều format file cho RAG pipeline
// Formats: txt, md, docx, pdf (basic text extraction), html, json
// Đã xoá Document AI OCR (cần GCP)

import mammoth from 'mammoth';

// Chú thích: Supported file types
export type SupportedFileType = 'txt' | 'md' | 'docx' | 'pdf' | 'html' | 'json';

// Chú thích: Interface cho parsed result
export interface ParsedDocument {
    content: string;
    metadata: {
        fileName: string;
        fileType: SupportedFileType;
        originalSize: number;
        extractedLength: number;
    };
}

// Chú thích: Detect file type từ filename hoặc mime type
export function detectFileType(fileName: string, mimeType?: string): SupportedFileType | null {
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Chú thích: Check by extension first
    const extensionMap: Record<string, SupportedFileType> = {
        'txt': 'txt',
        'md': 'md',
        'markdown': 'md',
        'docx': 'docx',
        'pdf': 'pdf',
        'html': 'html',
        'htm': 'html',
        'json': 'json',
    };

    if (extension && extensionMap[extension]) {
        return extensionMap[extension];
    }

    // Chú thích: Fallback to MIME type
    if (mimeType) {
        const mimeMap: Record<string, SupportedFileType> = {
            'text/plain': 'txt',
            'text/markdown': 'md',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/pdf': 'pdf',
            'text/html': 'html',
            'application/json': 'json',
        };

        if (mimeMap[mimeType]) {
            return mimeMap[mimeType];
        }
    }

    return null;
}

// Chú thích: Parse plain text file
async function parseTextFile(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(buffer);

    return {
        content: content.trim(),
        metadata: {
            fileName,
            fileType: 'txt',
            originalSize: buffer.byteLength,
            extractedLength: content.length,
        },
    };
}

// Chú thích: Parse Markdown file (giống text nhưng có thể xử lý thêm)
async function parseMarkdownFile(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(buffer);

    // Chú thích: Có thể thêm logic để loại bỏ markdown syntax nếu cần
    // Hiện tại giữ nguyên vì AI hiểu markdown

    return {
        content: content.trim(),
        metadata: {
            fileName,
            fileType: 'md',
            originalSize: buffer.byteLength,
            extractedLength: content.length,
        },
    };
}

// Chú thích: Parse DOCX file using mammoth
async function parseDocxFile(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
    try {
        // Chú thích: Mammoth chỉ extract text, bỏ formatting
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        const content = result.value;

        if (result.messages.length > 0) {
            console.warn('[file-parser] docx warnings:', result.messages);
        }

        return {
            content: content.trim(),
            metadata: {
                fileName,
                fileType: 'docx',
                originalSize: buffer.byteLength,
                extractedLength: content.length,
            },
        };
    } catch (error) {
        console.error('[file-parser] docx error:', error);
        throw new Error(`Failed to parse DOCX file: ${fileName}`);
    }
}

// Chú thích: Parse PDF file - simplified cho Cloudflare Workers
// Note: pdf-parse không hoạt động tốt trong CF Workers, nên fallback về text extraction đơn giản
async function parsePdfFile(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
    // Chú thích: Trong Cloudflare Workers, không có native PDF support
    // User nên convert PDF sang txt/docx trước khi upload

    // Thử decode như text (chỉ hoạt động với PDF có embedded text layer)
    const decoder = new TextDecoder('utf-8');
    let content = '';

    try {
        const textContent = decoder.decode(buffer);
        // Lọc bỏ binary data, giữ lại text có thể đọc được
        content = textContent
            .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Nếu text quá ít, có thể là scanned PDF
        if (content.length < 100) {
            throw new Error('PDF appears to be scanned or has no extractable text. Please convert to TXT or DOCX.');
        }
    } catch (e) {
        throw new Error(`Failed to parse PDF: ${fileName}. Please convert to TXT or DOCX format.`);
    }

    console.log('[file-parser] pdf parsed (basic)', {
        fileName,
        textLength: content.length,
    });

    return {
        content,
        metadata: {
            fileName,
            fileType: 'pdf',
            originalSize: buffer.byteLength,
            extractedLength: content.length,
        },
    };
}

// Chú thích: Parse HTML file - extract text content
async function parseHtmlFile(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(buffer);

    // Chú thích: Simple HTML to text conversion
    // Remove script and style tags, then strip all HTML tags
    let content = html
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

    return {
        content,
        metadata: {
            fileName,
            fileType: 'html',
            originalSize: buffer.byteLength,
            extractedLength: content.length,
        },
    };
}

// Chú thích: Parse JSON file - stringify for embedding
async function parseJsonFile(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
    const decoder = new TextDecoder('utf-8');
    const jsonString = decoder.decode(buffer);

    try {
        // Chú thích: Parse và format JSON đẹp
        const data = JSON.parse(jsonString);
        const content = JSON.stringify(data, null, 2);

        return {
            content,
            metadata: {
                fileName,
                fileType: 'json',
                originalSize: buffer.byteLength,
                extractedLength: content.length,
            },
        };
    } catch (error) {
        throw new Error(`Invalid JSON file: ${fileName}`);
    }
}

// Chú thích: Main parse function - tự động detect và parse
export async function parseFile(
    buffer: ArrayBuffer,
    fileName: string,
    mimeType?: string
): Promise<ParsedDocument> {
    const fileType = detectFileType(fileName, mimeType);

    if (!fileType) {
        throw new Error(`Unsupported file type: ${fileName}. Supported: txt, md, docx, pdf, html, json`);
    }

    console.log('[file-parser] parsing', { fileName, fileType, size: buffer.byteLength });

    switch (fileType) {
        case 'txt':
            return parseTextFile(buffer, fileName);
        case 'md':
            return parseMarkdownFile(buffer, fileName);
        case 'docx':
            return parseDocxFile(buffer, fileName);
        case 'pdf':
            return parsePdfFile(buffer, fileName);
        case 'html':
            return parseHtmlFile(buffer, fileName);
        case 'json':
            return parseJsonFile(buffer, fileName);
        default:
            throw new Error(`Parser not implemented for: ${fileType}`);
    }
}

// Chú thích: Check if file type is supported
export function isFileTypeSupported(fileName: string, mimeType?: string): boolean {
    return detectFileType(fileName, mimeType) !== null;
}

// Chú thích: Get list of supported extensions
export function getSupportedExtensions(): string[] {
    return ['txt', 'md', 'markdown', 'docx', 'pdf', 'html', 'htm', 'json'];
}

// Chú thích: Get max recommended file size (25MB)
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Chú thích: Check file size
export function isFileSizeValid(size: number): boolean {
    return size <= MAX_FILE_SIZE;
}
