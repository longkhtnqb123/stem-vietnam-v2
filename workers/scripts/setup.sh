#!/bin/bash
# Complete Setup Script - Run all migrations and setup

echo "🚀 Starting Complete Setup..."

# 1. Apply all D1 migrations
echo ""
echo "📦 Applying D1 migrations..."
npx wrangler d1 execute stem-vietnam-db --remote --file=migrations/004_fts5_search.sql
npx wrangler d1 execute stem-vietnam-db --remote --file=migrations/005_memory_cache.sql
npx wrangler d1 execute stem-vietnam-db --remote --file=migrations/006_eval_fewshot.sql
npx wrangler d1 execute stem-vietnam-db --remote --file=migrations/007_production_features.sql

# 2. Verify tables created
echo ""
echo "✅ Verifying tables..."
npx wrangler d1 execute stem-vietnam-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 3. Create KV namespace (if not exists)
echo ""
echo "🗄️ Creating KV namespace for cache..."
npx wrangler kv:namespace create "CACHE"
echo ""
echo "⚠️  IMPORTANT: Copy the KV namespace ID to wrangler.toml!"

# 4. Deploy worker
echo ""
echo "🚀 Deploying worker..."
npm run deploy

echo ""
echo "✅ Setup complete!"
echo "Next steps:"
echo "1. Update wrangler.toml with KV namespace ID"
echo "2. Run: npm run deploy"
echo "3. Test: npm run test"
