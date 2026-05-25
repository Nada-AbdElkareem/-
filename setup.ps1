# ═══════════════════════════════════════════════════════════════════
# 🏥 Medical Guest House Management System — Quick Setup (Windows)
# نظام إدارة دار الضيافة الطبية — سكريبت الإعداد للـ Windows
# ═══════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🏥 Medical Guest House Management System" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan

# ─── Check Node.js ───────────────────────────────────────────────
try {
    $nodeVer = node -v
    Write-Host "✅ Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js غير مثبّت!" -ForegroundColor Red
    Write-Host "   يرجى تثبيته من: https://nodejs.org/ (v20 أو أحدث)" -ForegroundColor Yellow
    exit 1
}

# ─── Check npm ───────────────────────────────────────────────────
try {
    $npmVer = npm -v
    Write-Host "✅ npm: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "❌ npm غير مثبّت!" -ForegroundColor Red
    exit 1
}

# ─── Install dependencies ────────────────────────────────────────
Write-Host ""
Write-Host "📦 تثبيت المتطلبات..." -ForegroundColor Yellow

try {
    npm ci --prefer-offline
} catch {
    Write-Host "⚠️  npm ci فشل، جاري المحاولة بـ npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ تم تثبيت المتطلبات" -ForegroundColor Green

# ─── Setup .env ──────────────────────────────────────────────────
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "⚙️  إنشاء ملف .env من المثال..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 يرجى تعديل ملف .env وإضافة GEMINI_API_KEY إذا أردت ميزات الذكاء الاصطناعي" -ForegroundColor Cyan
}

# ─── Done ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ الإعداد اكتمل بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 لتشغيل التطبيق:" -ForegroundColor White
Write-Host "   npm run electron         " -NoNewline -ForegroundColor Yellow
Write-Host "← تشغيل تطبيق Electron" -ForegroundColor Gray
Write-Host "   npm run dev              " -NoNewline -ForegroundColor Yellow
Write-Host "← تشغيل كخادم ويب (للتطوير)" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 لبناء installer:" -ForegroundColor White
Write-Host "   npm run dist:win         " -NoNewline -ForegroundColor Yellow
Write-Host "← Windows (.exe)" -ForegroundColor Gray
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
