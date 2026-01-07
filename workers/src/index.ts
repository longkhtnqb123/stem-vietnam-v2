// Chú thích: Entry point cho Cloudflare Workers - Hono Version
// Đã chuyển đổi từ switch-case routing sang Hono framework
import app from './routes';

// Export Hono app as default fetch handler
export default app;
