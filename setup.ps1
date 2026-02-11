# NexusAI Platform Setup Script (PowerShell)
Write-Host "🔧 NexusAI Platform Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# 1. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

# 2. Generate Prisma client
Write-Host "⚙️ Generating Prisma client..." -ForegroundColor Yellow
pnpm --filter @repo/database exec prisma generate

# 3. Run migrations / Sync DB
Write-Host "🗄️ Syncing database schema..." -ForegroundColor Yellow
# Try migrate first, then db push as fallback
try {
    pnpm --filter @repo/database exec prisma migrate deploy
} catch {
    Write-Host "⚠️ Migration deploy failed, trying db push..." -ForegroundColor Gray
    pnpm --filter @repo/database exec prisma db push
}

# 4. Seed the database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
pnpm --filter @repo/database exec prisma db seed

# 5. Build shared packages
Write-Host "🔨 Building shared packages..." -ForegroundColor Yellow
try {
    pnpm --filter @repo/shared build
} catch {
    Write-Host "⚠️ Shared package build failed (may be empty), continuing..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server:"
Write-Host "  pnpm dev"
Write-Host ""
Write-Host "Or start just the Next.js app (which includes the API):"
Write-Host "  pnpm --filter web dev"
Write-Host ""
Write-Host "Access the app at: http://localhost:3000"
Write-Host "Use ?testAuth=true for demo mode without Google OAuth"
