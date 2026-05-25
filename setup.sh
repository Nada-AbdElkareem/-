#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 🏥 Medical Guest House Management System — Quick Setup Script
# نظام إدارة دار الضيافة الطبية — سكريبت الإعداد السريع
# ═══════════════════════════════════════════════════════════════════

set -e

echo ""
echo "🏥 Medical Guest House Management System"
echo "══════════════════════════════════════════"

# ─── Check Node.js ───────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌ Node.js غير مثبّت!"
  echo "   يرجى تثبيته من: https://nodejs.org/ (v20 أو أحدث)"
  exit 1
fi

NODE_VER=$(node -v)
echo "✅ Node.js: $NODE_VER"

# ─── Check npm ───────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  echo "❌ npm غير مثبّت!"
  exit 1
fi

echo "✅ npm: $(npm -v)"

# ─── Install dependencies ────────────────────────────────────────
echo ""
echo "📦 تثبيت المتطلبات..."
npm ci --prefer-offline 2>/dev/null || npm install

# ─── Setup .env ──────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo ""
  echo "⚙️  إنشاء ملف .env من المثال..."
  cp .env.example .env
  echo "📝 يرجى تعديل ملف .env وإضافة GEMINI_API_KEY إذا أردت ميزات الذكاء الاصطناعي"
fi

# ─── Done ────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "✅ الإعداد اكتمل بنجاح!"
echo ""
echo "🚀 لتشغيل التطبيق:"
echo "   npm run electron         ← تشغيل تطبيق Electron"
echo "   npm run dev              ← تشغيل كخادم ويب (للتطوير)"
echo ""
echo "📦 لبناء installer:"
echo "   npm run dist:win         ← Windows (.exe)"
echo "   npm run dist:linux       ← Linux (.AppImage)"
echo "══════════════════════════════════════════"
