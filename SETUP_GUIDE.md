# دليل الإعداد النهائي — Medical Guest House System

## الخطوات المطلوبة للتشغيل

### 1️⃣ فتح PowerShell كـ Administrator في مجلد المشروع
```
cd "c:\Projects\remix_-remix_-medical-guest-house-management-system"
```

### 2️⃣ تثبيت كل الـ dependencies (بما فيها Electron)
```powershell
npm install --save-dev electron@33 electron-builder@25 @electron/rebuild concurrently wait-on
```

### 3️⃣ بناء المشروع للتأكد من عدم وجود أخطاء
```powershell
npm run build
```

### 4️⃣ تهيئة Git ورفع على GitHub
```powershell
# تهيئة git (لو مش موجود)
git init

# إضافة كل الملفات
git add .

# Commit أول
git commit -m "feat: initial commit — Electron + React + Express + GitHub Actions CI/CD"

# ربط بـ repository
git remote add origin https://github.com/Nada-AbdElkareem/-.git

# رفع على main branch
git branch -M main
git push -u origin main
```

### 5️⃣ اختبار Electron (بعد التثبيت)
```powershell
# وضع التطوير
npm run electron:dev

# أو بناء installer
npm run dist:win
```

### 6️⃣ إصدار نسخة جديدة (يشغّل GitHub Actions تلقائياً)
```powershell
git tag v1.0.0
git push origin v1.0.0
```
سيقوم GitHub Actions ببناء installer للـ Windows تلقائياً!

---

## ملاحظات مهمة
- لو عندك `git` مثبّت مسبقاً في المجلد، استبدل `git init` بـ `git status`
- لو طلب GitHub اسم مستخدم/password، استخدم GitHub Personal Access Token
- ملف `sqlite_db.db` لن يُرفع على GitHub (موجود في .gitignore) - هذا مقصود لحماية البيانات
