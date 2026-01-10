# 🔧 Developer Guide - STEM Vietnam

> Technical documentation for developers

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │    Backend      │     │   AI Services   │
│  React + Vite   │────▶│Cloudflare Worker│────▶│   OpenRouter    │
│  Tailwind CSS   │     │     + Hono      │     │   HuggingFace   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    Database     │
                        │  Cloudflare D1  │
                        │    Vectorize    │
                        └─────────────────┘
```

---

## Environment Setup

### Required Environment Variables

Create `workers/.dev.vars` for local development:

```env
JWT_SECRET=your-super-secret-key-here
OPENROUTER_API_KEY=sk-or-v1-xxxxx
HF_API_TOKEN=hf_xxxxx
CORS_ORIGIN=http://localhost:5173
```

### Wrangler Configuration

Edit `workers/wrangler.toml`:

```toml
name = "stem-vietnam-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "stem-vietnam-db"
database_id = "your-database-id"

[[vectorize]]
binding = "VECTORIZE"
index_name = "stem-vectors"

[[r2_buckets]]
binding = "R2"
bucket_name = "stem-files"

[vars]
CORS_ORIGIN = "https://stem-vietnam.pages.dev"
```

---

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    avatar_url TEXT,
    school_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
);

-- Conversations (AI Chat)
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    created_at INTEGER,
    updated_at INTEGER
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER
);

-- Exam Templates
CREATE TABLE exam_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT,
    grade TEXT,
    questions JSON,
    created_by TEXT,
    is_public INTEGER DEFAULT 1,
    created_at INTEGER
);

-- Exam Attempts
CREATE TABLE exam_attempts (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    answers JSON,
    score INTEGER,
    started_at INTEGER,
    submitted_at INTEGER
);
```

### Gamification Tables

```sql
-- Badges
CREATE TABLE badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    criteria JSON
);

-- User Badges
CREATE TABLE user_badges (
    user_id TEXT,
    badge_id TEXT,
    earned_at INTEGER,
    PRIMARY KEY (user_id, badge_id)
);

-- Daily Goals
CREATE TABLE daily_goals (
    user_id TEXT,
    date TEXT,
    target INTEGER DEFAULT 3,
    completed INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

-- XP Transactions
CREATE TABLE xp_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at INTEGER
);
```

---

## API Development

### Adding New Routes

1. Create route file: `workers/src/my-routes.ts`

```typescript
import { Env } from './index';
import { jsonResponse } from './utils';

export async function handleMyFeature(request: Request, env: Env): Promise<Response> {
    try {
        // Your logic here
        return jsonResponse({ success: true }, 200);
    } catch (error) {
        return jsonResponse({ error: 'Something went wrong' }, 500);
    }
}
```

2. Import in `workers/src/index.ts`:

```typescript
import { handleMyFeature } from './my-routes';

// In fetch handler
if (path === '/api/my-feature') {
    return handleMyFeature(request, env);
}
```

### Authentication Middleware

```typescript
import { getUserFromToken } from './auth-routes';

// Protected route
const user = await getUserFromToken(request, env);
if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
}
```

---

## Frontend Development

### Component Structure

```
src/components/
├── layout/
│   ├── MainLayout.tsx      # Standard sidebar layout
│   └── ImmersiveLayout.tsx # Floating dock layout
├── gamification/
│   ├── XPBar.tsx
│   ├── BadgeDisplay.tsx
│   └── Leaderboard.tsx
└── ui/
    ├── Button.tsx
    ├── Modal.tsx
    └── Card.tsx
```

### State Management (Zustand)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    login: async (email, password) => {
        const res = await fetch('/api/auth/login', {...});
        const data = await res.json();
        set({ user: data.user, token: data.token });
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
    }
}));
```

---

## Testing

### Backend Testing

```bash
# Run local backend
cd workers
npx wrangler dev

# Test endpoints
curl http://localhost:8787/api/health
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Frontend Testing

```bash
npm run dev
# Open http://localhost:5173
```

---

## Deployment

### Frontend (Cloudflare Pages)

```bash
npm run build
# Deploy via Cloudflare Dashboard or Wrangler
```

### Backend (Cloudflare Workers)

```bash
cd workers
npx wrangler deploy
```

### Database Migrations

```bash
# Apply migrations to production
npx wrangler d1 migrations apply stem-vietnam-db --remote
```

---

## Performance Tips

1. **Use Batch Queries** for bulk operations
2. **Cache** frequently accessed data
3. **Lazy Load** heavy components
4. **Optimize Images** before upload
5. **Use Vectorize** for semantic search

---

## Security Checklist

- [ ] JWT tokens expire after 7 days
- [ ] Passwords hashed with bcrypt
- [ ] CORS properly configured
- [ ] Admin routes require authentication
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled

---

*For questions, contact the development team.*
