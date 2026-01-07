// Chú thích: Shared types for Hono routes

// Chú thích: Environment bindings
export interface Env {
    // OpenRouter API Key
    OPENROUTER_API_KEY: string;

    // HuggingFace API Token (cho embeddings RAG)
    HF_API_TOKEN: string;

    // JWT Secret for auth
    JWT_SECRET: string;

    // D1 Database
    DB: D1Database;

    // Vectorize (RAG Pipeline)
    VECTORIZE: VectorizeIndex;

    // CORS
    CORS_ORIGIN: string;

    // Max token budget
    MAX_TOKEN_BUDGET?: string;
}

// Chú thích: User payload from JWT
export interface UserPayload {
    sub: string;
    email: string;
    name: string;
}
