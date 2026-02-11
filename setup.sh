#!/usr/bin/env bash
set -e

echo "🔧 NexusAI Platform Setup"
echo "========================="
echo ""

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Generate Prisma client
echo "⚙️ Generating Prisma client..."
pnpm --filter @repo/database exec prisma generate

# 3. Run migrations
echo "🗄️ Running database migrations..."
pnpm --filter @repo/database exec prisma migrate deploy 2>/dev/null || \
  pnpm --filter @repo/database exec prisma db push

# 4. Seed the database
echo "🌱 Seeding database..."
pnpm --filter @repo/database exec prisma db seed

# 5. Build shared packages
echo "🔨 Building shared packages..."
pnpm --filter @repo/shared build 2>/dev/null || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  pnpm dev"
echo ""
echo "Or start just the Next.js app (which includes the API):"
echo "  pnpm --filter web dev"
echo ""
echo "Access the app at: http://localhost:3000"
echo "Use ?testAuth=true for demo mode without Google OAuth"
