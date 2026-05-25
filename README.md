# 🏥 نظام إدارة دار الضيافة الطبية
### Medical Guest House Management System

<div align="center">

![CI](https://github.com/Nada-AbdElkareem/-/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/Nada-AbdElkareem/-/actions/workflows/release.yml/badge.svg)

تطبيق سطح مكتب متكامل لإدارة دور الضيافة الطبية — مبني بـ **Electron + React + Express + SQLite**

</div>

---

## ✨ المميزات

- 🏠 **إدارة الغرف والأسرّة** — تتبع كامل لحالة كل غرفة وسرير
- 👥 **إدارة المرضى والمرافقين** — ملفات شاملة مع سجل الإقامات
- 📋 **إدارة الإقامات** — تسجيل دخول وخروج مع تجديد تلقائي
- 💰 **نظام الفواتير والخدمات** — إصدار فواتير PDF
- 📊 **تقارير وإحصائيات** — رسوم بيانية تفاعلية
- 🔒 **إدارة المستخدمين والصلاحيات** — نظام أدوار متعدد
- 🤖 **دعم الذكاء الاصطناعي** (Gemini) لاقتراحات ذكية
- 🌙 **وضع داكن / فاتح**

---

## 🛠️ التقنيات المستخدمة

| الجزء | التقنية |
|---|---|
| واجهة المستخدم | React 19 + Vite + TailwindCSS 4 |
| الخادم الخلفي | Express.js + TypeScript |
| قاعدة البيانات | SQLite (better-sqlite3) + Drizzle ORM |
| تطبيق سطح المكتب | Electron 33 |
| التغليف | electron-builder |

---

## 🚀 البدء السريع

### المتطلبات
- [Node.js](https://nodejs.org/) v20 أو أحدث
- npm v10 أو أحدث

### التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/Nada-AbdElkareem/-.git
cd -

# 2. تثبيت المتطلبات
npm ci

# 3. إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env وضع GEMINI_API_KEY

# 4. تشغيل كتطبيق ويب (وضع التطوير)
npm run dev

# أو تشغيل كتطبيق Electron
npm run electron:dev
```

---

## 📦 البناء والتوزيع

```bash
# بناء كتطبيق Electron وإنشاء مثبّت (installer)
npm run dist

# Windows فقط
npm run dist:win

# Linux فقط
npm run dist:lin
```

سيوجد المثبّت في مجلد `dist-electron/`.

---

## 🔄 GitHub Actions (CI/CD)

### CI (كل push)
يتحقق تلقائياً من:
- ✅ TypeScript type-check (بدون أخطاء)
- ✅ بناء Vite frontend
- ✅ تجميع Express backend

### Release (عند رفع tag)
لإصدار نسخة جديدة:

```bash
git tag v1.0.1
git push origin v1.0.1
```

سيقوم GitHub Actions تلقائياً بـ:
1. بناء installer لـ Windows (`.exe`)
2. بناء حزمة لـ Linux (`.AppImage`)
3. إنشاء GitHub Release مع روابط التحميل

---

## 📁 هيكل المشروع

```
├── electron/
│   ├── main.cjs         # نقطة بداية Electron (CommonJS)
│   ├── preload.cjs      # واجهة آمنة للـ renderer
│   └── loading.html     # شاشة التحميل
├── src/
│   ├── components/      # مكونات React
│   ├── pages/           # صفحات التطبيق
│   ├── db/              # schema وconnection قاعدة البيانات
│   └── hooks/           # React hooks مخصصة
├── .github/
│   └── workflows/
│       ├── ci.yml       # CI: type-check + build
│       └── release.yml  # Release: electron installer
├── server.ts            # Express backend
└── package.json
```

---

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/my-feature`)
3. Commit التغييرات (`git commit -m 'feat: add my feature'`)
4. Push (`git push origin feature/my-feature`)
5. افتح Pull Request

---

<div align="center">
صُنع بـ ❤️ بواسطة <strong>Nada AbdElkareem</strong>
</div>
