# STRUCTURE.md — شجرة المجلدات والملفات

> **المشروع**: تطبيق نانه وبنانه برو
> **آخر تحديث**: 2026-07-25

---

## الشجرة الكاملة

```
J:\Nana_and_Banana_Pro_تطبيق_نانه_وبنانه_برو\
│
├── 📄 AI_CONTEXT.md                    # مرجع الذكاء الاصطناعي (هذا الملف)
├── 📄 STRUCTURE.md                     # شجرة الملفات (هذا الملف)
├── 📄 PROJECT_STATE.md                 # حالة المشروع الحالية
├── 📄 DATABASE_SCHEMA.md               # مخطط قاعدة البيانات
├── 📄 README.md                        # وصف المشروع
│
├── ⚙️ الإعدادات الأساسية
│   ├── package.json                    # تعريف المشروع + التبعيات + سكربتات البناء
│   ├── tsconfig.json                   # TypeScript الأساسي (يُحيل للفرعيين)
│   ├── tsconfig.app.json               # TypeScript لـ src/ (strict, react-jsx)
│   ├── tsconfig.node.json              # TypeScript لـ vite.config.ts
│   ├── tsconfig.check.json             # TypeScript للتحقق
│   ├── vite.config.ts                  # إعدادات Vite (Rolldown + React + SVGR)
│   ├── tailwind.config.js              # إعدادات Tailwind (ألوان HSL + RTL)
│   ├── postcss.config.js               # PostCSS plugins
│   ├── biome.json                      # Biome linter/formatter config
│   ├── components.json                 # shadcn/ui config
│   ├── vercel.json                     # Vercel SPA rewrites
│   ├── pnpm-workspace.yaml             # pnpm workspace config
│   └── .gitignore                      # ملفات مستبعدة من Git
│
├── 🔐 متغيرات البيئة
│   └── .env                            # VITE_SUPABASE_*, VITE_APPWRITE_* (غير مُرفع)
│
├── 🖼️ الأيقونات والصور
│   ├── icon.ico                        # أيقونة Windows (256×256+)
│   ├── favicon.ico                     # أيقونة المتصفح
│   ├── favicon.png                     # أيقونة PNG
│   ├── icon.jpg.jpg                    # الأيقونة الأصلية
│   ├── convert_icon.py                 # سكربت تحويل PNG → ICO
│   └── public/
│       ├── favicon.png                 # أيقونة المتصفح
│       └── images/
│           ├── favicon.ico             # أيقونة المتصفح (نسخة)
│           ├── logo/
│           │   ├── auth-logo.svg       # شعار صفحة المصادقة
│           │   ├── logo-dark.svg       # شعار الوضع الداكن
│           │   └── logo-icon.svg       # أيقونة الشعار فقط
│           ├── error/
│           │   ├── 404.svg             # صفحة 404
│           │   ├── 404-dark.svg        # صفحة 404 (الوضع الداكن)
│           │   ├── 500.svg             # صفحة 500
│           │   ├── 500-dark.svg        # صفحة 500 (الوضع الداكن)
│           │   ├── 503.svg             # صفحة 503
│           │   └── 503-dark.svg        # صفحة 503 (الوضع الداكن)
│           └── shape/
│               └── grid-01.svg         # شكل شبكي
│
├── 📜 سكربتات التشغيل
│   ├── تشغيل_التطبيق.bat               # سكربت تشغيل Windows
│   ├── create_shortcut.py              # إنشاء اختصار سطح المكتب
│   ├── create_shortcut.ps1             # إنشاء اختصار (PowerShell)
│   └── main.py                         # سكربت Python
│
├── 📋 ملفات مرجعية
│   ├── requirements.txt                # متطلبات Python
│   ├── app_data.json                   # بيانات التطبيق المساعدة
│   ├── historical_context.txt          # السياق التاريخي للمشروع
│   ├── wait-versions.txt               # إصدارات الانتظار
│   └── sgconfig.yml                    # إعدادات SG
│
├── 📂 .rules/                          # سكربتات فحص الجودة
│   ├── check.sh
│   ├── testBuild.sh
│   ├── SelectItem.yml
│   ├── contrast.yml
│   ├── require-button-interaction.yml
│   ├── slot-nesting.yml
│   ├── supabase-edge-function-get-body.yml
│   ├── supabase-google-sso.yml
│   └── toast-hook.yml
│
├── 📂 docs/                            # التوثيق
│   └── prd.md                          # Product Requirements Document
│
├── 📂 electron/                        # تطبيق سطح المكتب
│   ├── main.cjs                        # العملية الرئيسية (BrowserWindow)
│   └── preload.cjs                     # سكربت Preload (electronAPI)
│
├── 📂 supabase/                        # Edge Functions
│   └── functions/
│       ├── image-generation-submit/
│       │   └── index.ts                # إرسال طلب توليد إلى Gateway
│       └── image-generation-query/
│           └── index.ts                # الاستعلام عن حالة المهمة + حفظ الصورة
│
├── 📂 src/                             # الكود المصدري الرئيسي
│   │
│   ├── 📄 App.tsx                      # المكون الجذرى — يلف IntegrationProvider
│   ├── 📄 main.tsx                     # نقطة الدخول — Sentry + BrowserRouter
│   ├── 📄 routes.tsx                   # تعريف المسارات (/, /login, /404)
│   ├── 📄 index.css                    # الأنماط الأساسية + CSS Variables + Tailwind
│   ├── 📄 global.d.ts                  # تعريفات TypeScript العامة
│   ├── 📄 svg.d.ts                     # تعريفات SVG modules
│   ├── 📄 vite-env.d.ts                # تعريفات Vite environment
│   │
│   ├── 📂 types/                       # الأنواع TypeScript
│   │   ├── types.ts                    # الأنواع الأساسية (ReferenceImage, GenerationStatus, etc.)
│   │   ├── index.ts                    # نوع Option العام
│   │   └── integration.ts             # أنواع IntegrationData + DEFAULT_INTEGRATION
│   │
│   ├── 📂 services/                    # خدمات الأعمال
│   │   ├── imageGeneration.ts          # ضغط الصور + استخراج base64 + API submit/query
│   │   ├── integrationStorage.ts       # CRUD اتصالات API في localStorage
│   │   ├── promptStorage.ts            # CRUD البرومبتات المحفوظة
│   │   └── .keep                       # ملف فارغ للحفاظ على المجلد
│   │
│   ├── 📂 contexts/                    # React Contexts
│   │   ├── IntegrationContext.tsx       # سياق اتصالات API (+ Appwrite dual-write)
│   │   └── AuthContext.tsx             # سياق المصادقة (Supabase)
│   │
│   ├── 📂 db/                          # عملاء قواعد البيانات
│   │   ├── supabase.ts                 # عميل Supabase
│   │   └── appwrite.ts                 # عميل Appwrite + CRUD helpers
│   │
│   ├── 📂 hooks/                       # خطافات مخصصة
│   │   ├── use-debounce.ts             # تأخير القيمة (500ms default)
│   │   ├── use-go-back.ts              # التنقل للخلف
│   │   ├── use-mobile.tsx              # كشف الشاشات <768px
│   │   └── use-supabase-upload.ts      # رفع الملفات لـ Supabase Storage
│   │
│   ├── 📂 lib/                         # مكتبات مساعدة
│   │   └── utils.ts                    # cn(), createQueryString(), formatDate()
│   │
│   ├── 📂 components/                  # المكونات
│   │   │
│   │   ├── 📄 ConnectionSwitcher.tsx   # قائمة منسدلة لتبديل الاتصال النشط
│   │   ├── 📄 DiagnosticsPanel.tsx     # لوحة تشخيص (حالة + تحذيرات + سجلات)
│   │   ├── 📄 GenerationProgressBar.tsx # شريط تقدم التوليد (ثابت في الأسفل)
│   │   ├── 📄 ImageSettingsPanel.tsx   # إعدادات الأبعاد والجودة
│   │   ├── 📄 PromptInput.tsx          # إدخال البرومبت + حفظ/تحميل محفوظات
│   │   ├── 📄 ReferenceImageUpload.tsx # رفع الصور المرجعية + ضغط تلقائي
│   │   ├── 📄 ResultSection.tsx        # عرض صورة النتيجة + تنزيل
│   │   ├── 📄 dropzone.tsx             # Dropzone مخصص (Supabase Upload)
│   │   │
│   │   ├── 📄 IntegrationForm.tsx      # نموذج إضافة/تعديل اتصال API (10 حقول)
│   │   ├── 📄 IntegrationCard.tsx      # بطاقة عرض اتصال + قائمة إجراءات
│   │   ├── 📄 IntegrationTestDialog.tsx # حوار اختبار الاتصال
│   │   ├── 📄 IntegrationDataTab.tsx   # تبويب إدارة الاتصالات بالكامل
│   │   │
│   │   ├── 📂 common/                  # مكونات مشتركة
│   │   │   ├── IntersectObserver.tsx   # مراقب التقاطع (tailwindcss-intersect)
│   │   │   ├── PageMeta.tsx            # عنوان الصفحة + AppWrapper
│   │   │   └── RouteGuard.tsx          # حارس المسارات (المصادقة)
│   │   │
│   │   └── 📂 ui/                      # 51 مكون shadcn/ui
│   │       ├── accordion.tsx           # الأكورديون
│   │       ├── alert-dialog.tsx        # حوار التحذير
│   │       ├── alert.tsx               # التنبيه
│   │       ├── aspect-ratio.tsx        # نسبة الأبعاد
│   │       ├── avatar.tsx              # الصورة الرمزية
│   │       ├── badge.tsx               # الشارة
│   │       ├── breadcrumb.tsx          # مسار التنقل
│   │       ├── button.tsx              # الزر
│   │       ├── calendar.tsx            # التقويم
│   │       ├── card.tsx                # البطاقة
│   │       ├── carousel.tsx            # الكاروسيل
│   │       ├── chart.tsx               # الرسم البياني
│   │       ├── checkbox.tsx            # مربع الاختيار
│   │       ├── collapsible.tsx         # القابل للطي
│   │       ├── command.tsx             # Command Palette
│   │       ├── context-menu.tsx        # قائمة السياق
│   │       ├── dialog.tsx              # حوار modal
│   │       ├── drawer.tsx              # الدرج
│   │       ├── dropdown-menu.tsx       # القائمة المنسدلة
│   │       ├── form.tsx                # النموذج
│   │       ├── hover-card.tsx          # بطاقة التمرير
│   │       ├── input-otp.tsx           # إدخال OTP
│   │       ├── input.tsx               # حقل الإدخال
│   │       ├── kbd.tsx                 # لوحة مفاتيح
│   │       ├── label.tsx               # التسمية
│   │       ├── menubar.tsx             # شريط القوائم
│   │       ├── multi-select.tsx        # الاختيار المتعدد
│   │       ├── navigation-menu.tsx     # قائمة التنقل
│   │       ├── pagination.tsx          # ترقيم الصفحات
│   │       ├── popover.tsx             # Popover
│   │       ├── progress.tsx            # شريط التقدم
│   │       ├── qrcodedataurl.tsx       # QR Code
│   │       ├── radio-group.tsx         # الأزرار الراديو
│   │       ├── resizable.tsx           # ألوان قابلة للطي
│   │       ├── scroll-area.tsx         # منطقة التمرير
│   │       ├── select.tsx              # القائمة المنسدلة
│   │       ├── separator.tsx           # الفاصل
│   │       ├── sheet.tsx               # الدرج الجانبي
│   │       ├── sidebar.tsx             # الشريط الجانبي
│   │       ├── skeleton.tsx            # هيكل التحميل
│   │       ├── slider.tsx              # شريط التمرير
│   │       ├── sonner.tsx              # الإشعارات
│   │       ├── switch.tsx              # مفتاح التبديل
│   │       ├── table.tsx               # الجدول
│   │       ├── tabs.tsx                # التبويبات
│   │       ├── textarea.tsx            # منطقة النص
│   │       ├── toggle-group.tsx        # مجموعة التبديل
│   │       ├── toggle.tsx              # زر التبديل
│   │       ├── tooltip.tsx             # تلميحة الأدوات
│   │       ├── video.css               # أنماط الفيديو
│   │       └── video.tsx               # مشغل الفيديو
│   │
│   └── 📂 pages/                       # صفحات التطبيق
│       ├── MainPage.tsx                # الصفحة الرئيسية (3 تبويبات)
│       ├── FabricZoomTab.tsx           # زوم الأقمشة (Canvas + 6 تخطيطات)
│       ├── NotFound.tsx                # صفحة 404
│       └── SamplePage.tsx              # صفحة نموذجية فارغة
│
├── 📂 dist/                            # بناء الويب (output)
│   ├── index.html                      # نقطة الدخول
│   └── assets/
│       ├── index-XXXXXXX.css           # الأنماط (78KB)
│       └── index-XXXXXXX.js            # السكربتات (644KB)
│
└── 📂 release/                         # بناء Electron (output)
    ├── تطبيق نانه وبنانه برو Setup 0.0.1.exe     # مثبت Windows (NSIS)
    ├── تطبيق نانه وبنانه برو 0.0.1.exe            # نسخة محمولة
    ├── تطبيق نانه وبنانه برو Setup 0.0.1.exe.blockmap
    └── win-unpacked/
        ├── تطبيق نانه وبنانه برو.exe               # الملف التنفيذي
        └── resources/
            ├── app.asar                            # حزمة التطبيق
            └── elevate.exe                         # أداة الصلاحيات
```

---

## وظائف الملفات الرئيسية

### ملفات الإعدادات

| الملف | الوظيفة | ملاحظات |
|-------|---------|---------|
| `package.json` | تعريف المشروع: `name`, `version`, `main`, `scripts`, `build`, `dependencies`, `devDependencies` | `type: "module"` → Electron يrequire `.cjs` |
| `vite.config.ts` | إعدادات Vite: `base: './'`, plugins (React + SVGR), alias `@` → `src/` | base نسبي لـ Electron |
| `tailwind.config.js` | ألوان HSL كاملة, dark mode `class`, plugins, content paths | نظام ألوان `card`, `primary`, `muted` |
| `tsconfig.json` | TypeScript: `target: ES2020`, `module: ESNext`, `paths: @/*` | يُحيل لملفين فرعيين |
| `vercel.json` | SPA rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` | ضروري لـ SPA |

### ملفات التطبيق

| الملف | الوظيفة | السطور |
|-------|---------|--------|
| `src/main.tsx` | نقطة الدخول: Sentry.init + React.createRoot + AppWrapper + App | ~30 |
| `src/App.tsx` | المكون الجذرى: HashRouter + IntegrationProvider + Routes + Toaster | ~30 |
| `src/routes.tsx` | مسارات: `/` → MainPage, `/login` → AuthContext, `*` → NotFound | ~30 |
| `src/pages/MainPage.tsx` | الصفحة الرئيسية: 3 تبويبات + حالة التوليد الكاملة + polling | 559 |
| `src/pages/FabricZoomTab.tsx` | زوم الأقمشة: Canvas + 6 تخطيطات + crop يدوي + حماية ذاكرة | 1011 |
| `src/services/imageGeneration.ts` | خدمات API: ضغط + base64 + submit + query + 6 صيغ استجابة | 454 |
| `src/services/integrationStorage.ts` | CRUD localStorage + import/export + test connection | 245 |
| `src/services/promptStorage.ts` | CRUD البرومبتات المحفوظة + pywebview API | 104 |
| `src/contexts/IntegrationContext.tsx` | سياق الاتصالات: connections + active + CRUD + Appwrite | 177 |
| `src/contexts/AuthContext.tsx` | سياق المصادقة: signIn + signUp + profile (Supabase) | 131 |
| `src/components/IntegrationDataTab.tsx` | تبويب كامل: بحث + بطاقة + إضافة + تعديل + حذف + اختبار + تصدير | 225 |
| `src/components/ConnectionSwitcher.tsx` | DropdownMenu لتبديل الاتصال النشط | 75 |
| `src/components/PromptInput.tsx` | إدخال البرومبت + حفظ/تحميل محفوظات + Sheet | 350 |
| `src/components/ReferenceImageUpload.tsx` | رفع صور + ضغط تلقائي + شبكة عرض | 230 |
| `electron/main.cjs` | Electron main process: BrowserWindow + dev/prod | 48 |
| `electron/preload.cjs` | Electron preload: exposes electronAPI | 6 |

---

## ملاحظات مهمة

1. **`src/components/ui/`** — 51 مكون مولّدة من shadcn/ui. **لا تعدلها يدوياً** إلا إذا كنت تعرف النتيجة
2. **`dist/` و `release/`** — مجلدات output. لا تُعدّل يدوياً
3. **`.env`** — يحتوي مفاتيح حساسة. **لا يُرفع إلى Git**
4. **`.rules/`** — سكربتات فحص الجودة. لا تحتاج تعديل عادةً
5. **`supabase/functions/`** — Edge Functions قديمة. التطبيق ي今は يستخدم fetch مباشر
