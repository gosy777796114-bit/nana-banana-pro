# AI_CONTEXT.md — مرجع شامل للذكاء الاصطناعي

> **المشروع**: تطبيق نانه وبنانه برو — منصة توليد صور بالذكاء الاصطناعي
> **آخر تحديث**: 2026-07-25
> **الغرض**: أي نموذج ذكاء اصطناعي يقرأ هذا الملف يجب أن يفهم المشروع كاملاً ويتمكن من التعديل عليه دون أخطاء

---

## 1. فكرة التطبيق

تطبيق ويب + سطح مكتب عربي بالكامل (RTL) يتيح للمستخدمين:
1. **توليد صور بالذكاء الاصطناعي**: إدخال برومبت نصي + صور مرجعية → توليد صورة عبر Gemini API
2. **زوم الأقمشة**: عرض صور أقمشة بـ 6 تخطيطات مختلفة مع إمكانية الزووم المستقل
3. **إدارة اتصالات API**: إضافة/تعديل/حذف/اختبار/تصدير/استيراد اتصالات API متعددة
4. **مشاركة التطبيق**: زر ينسخ رابط الويب الفعلي

### مسار البيانات الأساسي:
```
المستخدم → إدخال برومبت + صور مرجعية → ضغط "توليد"
→ submitGenerationTask() → fetch(genKey URL) → Gemini API
→ استجابة مباشرة (markdown base64) أو async polling
→ عرض الصورة الناتجة مع معلومات الأبعاد والجودة
```

---

## 2. التقنيات واللّغات والمكتبات

### الإطار الأساسي
| التقنية | الإصدار | الملاحظات |
|---------|---------|-----------|
| **React** | ^18.0.0 | واجهة المستخدم |
| **TypeScript** | ~5.9.3 | اللغة البرمجية (strict mode) |
| **Vite** | npm:rolldown-vite@latest | Bundler (نسخة Rolldown) |
| **Tailwind CSS** | ^3.4.11 | نظام الألوان والتنسيق |
| **Electron** | ^26.4.3 | تطبيق سطح المكتب |

### إدارة الحالة والتنقل
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **react-router-dom** | ^7.9.5 | التوجيه (HashRouter) |
| **React Context** | مدمج | إدارة الحالة المركزية |
| **sonner** | ^2.0.7 | الإشعارات |
| **@sentry/react** | ^9.47.1 | مراقبة الأخطاء |

### قواعد البيانات والتخزين
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **@supabase/supabase-js** | 2.103.1 | المصادقة + Storage |
| **appwrite** | ^26.2.0 | تخزين اتصالات سحابي (اختياري) |
| **localStorage** | مدمج | المخزن الأساسي للبيانات |

### واجهة المستخدم
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **Radix UI** | ^1.x - ^2.x | primitives (29 مكتبة) |
| **shadcn/ui** | — | 51 مكون UI جاهز |
| **lucide-react** | ^0.576.0 | الأيقونات |
| **motion** | ^12.23.25 | الحركات (Framer Motion) |
| **class-variance-authority** | ^0.7.1 | إدارة صنفات CSS |
| **clsx** + **tailwind-merge** | ^2.1.1 / ^3.3.1 | دمج CSS classes |
| **cmdk** | ^1.1.1 | Command Palette |

### أدوات أخرى
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **react-hook-form** + **zod** | ^7.66.0 / ^3.25.76 | إدارة + التحقق من النماذج |
| **react-dropzone** | ^14.3.8 | منطقة إفلات الملفات |
| **date-fns** | ^3.6.0 | معالجة التواريخ |
| **qrcode** | ^1.5.4 | توليد QR Code |
| **recharts** | 2.15.4 | الرسوم البيانية |
| **react-helmet-async** | ^2.0.5 | عنوان الصفحة |
| **next-themes** | ^0.4.6 | السمات (dark/light) |
| **embla-carousel-react** | ^8.6.0 | الكاروسيل |
| **vaul** | ^1.1.2 | Drawer |
| **react-resizable-panels** | ^2.1.8 | ألوان قابلة للطي |
| **streamdown** | ^1.4.0 | نصوص متدفقة |

### أدوات التطوير
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **@biomejs/biome** | 2.4.5 | Linter + Formatter |
| **postcss** + **autoprefixer** | ^8.5.6 / ^10.4.27 | معالج CSS |
| **electron-builder** | ^24.8.0 | بناء حزم Windows |
| **concurrently** + **wait-on** | — | تشغيل Electron dev |
| **vite-plugin-svgr** | ^4.5.0 | SVG كمكونات React |

---

## 3. أنماط الكود المتبعة

### Naming Conventions
```typescript
// ملفات المكونات: PascalCase
IntegrationForm.tsx, MainPage.tsx, FabricZoomTab.tsx

// ملفات الخدمات/Hooks: camelCase أو kebab-case
imageGeneration.ts, integrationStorage.ts, use-debounce.ts

// المكونات الداخلية: PascalCase
function Field() {}   // داخل IntegrationForm.tsx
function LogLine() {} // داخل DiagnosticsPanel.tsx

// المتغيرات والدوال: camelCase
const handleSave = () => {};
const { width, height } = resolveDimensions(settings);

// الثوابت: UPPER_SNAKE_CASE
const MAX_CHARS = 10000;
const POLL_INTERVAL_MS = 7000;
const DIMENSION_PRESETS: DimensionPreset[] = [...];

// الأنواع والواجهات: PascalCase
interface IntegrationData { ... }
type GenerationStatus = 'idle' | 'submitting' | ...;

// مسارات alias: @/ يشير إلى src/
import { Button } from '@/components/ui/button';
```

### State Management Patterns
```typescript
// 1. Context للحالة المركزية
const { activeConnection, connections } = useIntegration();

// 2. useState للمكونات المحلية
const [prompt, setPrompt] = useState('');
const [genStatus, setGenStatus] = useState<GenerationStatus>('idle');

// 3. useCallback دائماً للدوال الممررة
const generate = useCallback(async () => {
  // ... logic
}, [prompt, referenceImages, settings, activeConnection]);

// 4. useRef للمؤقتات
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

// 5. useEffect للمزامنة
useEffect(() => {
  const list = storage.loadIntegrations();
  setConnections(list);
}, []);
```

### Error Handling Patterns
```typescript
// 1. try/catch مع رسائل عربية
try {
  const result = await submitGenerationTask(contents, activeConnection);
} catch (err) {
  const errMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
  toast.error(`فشل التوليد: ${errMsg}`);
}

// 2. toast للإشعارات الفورية
toast.success('تم توليد الصورة بنجاح!');
toast.error('يرجى تفعيل اتصال API أولاً');

// 3. DiagnosticsState لتتبع الأخطاء
setDiagnostics(prev => ({
  ...prev,
  apiStatus: 'offline',
  lastError: errMsg,
}));

// 4. Fallback paths
try {
  return await compressHeavyFile(file); // createImageBitmap
} catch {
  // Fall through to classic path
}
```

### API Response Handling
```typescript
// الـ API يُرجع الصورة بـ 6 صيغ مختلفة:
// 1. InlineData (camelCase): part.inlineData.data
// 2. inline_data (snake_case): part.inline_data.data
// 3. Direct properties: part.data + part.mime_type
// 4. Image property: part.image.data
// 5. Markdown text: ![image](data:image/jpeg;base64,...)  ← الصيغة الحالية
// 6. Proxy-wrapped: data.result.imageUrl

// يجب التعامل مع جميع الحالات في extractImageFromParts()
```

### File Organization Rules
```
src/
├── types/          → الأنواع فقط (لا منطق)
├── services/       → منطق الأعمال + API calls
├── contexts/       → React Context (حالة مركزة)
├── db/             → عملاء قواعد البيانات فقط
├── hooks/          → خطافات مخصصة
├── components/     → مكونات UI
│   ├── ui/         → مكونات shadcn/ui عامة (لا تعدل يدوياً)
│   └── common/     → مكونات مشتركة
└── pages/          → صفحات كاملة (tılaً لكل مسار)
```

---

## 4. قواعد التكويد المشروطة

### TypeScript Strict Mode
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```
- **يجب** تعريف جميع الأنواع صراحةً
- **لا** استخدام `any` — استخدم `unknown` أو أنشئ نوعاً مناسباً
- **يجب** أن تكون جميع المتغيرات والمعاملات مستخدمة

### قواعد Import
```typescript
// ✅ صحيح: استخدام alias
import { Button } from '@/components/ui/button';
import type { IntegrationData } from '@/types/integration';

// ❌ خطأ: مسارات نسبية طويلة
import { Button } from '../../../components/ui/button';

// ✅ صحيح: فصل imports about types
import type { ReferenceImage } from '@/types/types';

// ❌ خطأ: عدم استخدام type keyword للأنواع
import { ReferenceImage } from '@/types/types';
```

### قواعد المكونات
```typescript
// ✅ صحيح: المكونات بدون تعليقات
export default function MyComponent({ title, onClick }: Props) {
  return <div>{title}</div>;
}

// ❌ خطأ: إضافة تعليقات توضيحية
// This component renders a title
export default function MyComponent() { ... }

// ✅ صحيح: استخدام className بالعربية
<div className="font-arabic text-sm">نص عربي</div>

// ✅ صحيح: RTL
<div dir="rtl" className="min-h-screen bg-background">
```

### قواعد Tailwind CSS
```typescript
// ✅ صحيح: دمج الفئات مع clsx
className={cn(
  'flex items-center gap-2',
  isActive && 'bg-primary text-primary-foreground',
  !isActive && 'text-muted-foreground'
)}

// ✅ صحيح: استخدام CSS variables للألوان
<div className="bg-card text-foreground border-border">

// ❌ خطأ: ألوان hardcoded
<div className="bg-white text-black">
```

### قواعد Electron
```javascript
// ✅ صحيح: ملفات Electron تستخدم .cjs (لأن package.json type: "module")
// electron/main.cjs
// electron/preload.cjs

// ✅ صحيح: webPreferences آمنة
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
}
```

### قواعد Git
```bash
# ✅ ملفات لا تُرفع
.env
.env.local
.env.*.local
node_modules/
dist/
release/
*.local

# ✅ ملفات تُرفع
src/**
electron/**
public/**
*.json
*.ts
*.tsx
*.cjs
vercel.json
```

### قواعد RTL (Right-to-Left)
```tsx
// ✅ صحيح: كل واجهة المستخدم بالعربية مع RTL
<div dir="rtl" className="min-h-screen bg-background" dir="rtl">
  <h1 className="font-arabic">عنوان عربي</h1>
  <p className="text-xs text-muted-foreground font-arabic">نص فرعي</p>
</div>

// ✅ صحيح: محاذاة النصوص
<div className="text-right">نص من اليمين</div>
<div className="flex items-center gap-2">
  <span className="ml-2">الأيقونة قبل النص في RTL</span>
</div>
```

---

## 5. معلومات الاتصال الافتراضية

```typescript
const DEFAULT_INTEGRATION = {
  name: 'بنانه برو',
  architectureType: 'direct',
  baseUrl: 'https://api-integrations.appmedo.com/app-8actmiuaw4ch',
  appId: 'app-8actmiuaw4ch',
  genModel: 'api-Xa6JZ58oPMEa/v1beta/models/gemini-3-pro-image-preview:generateContent',
  visionModel: 'api-rLob8RdzAOl9/v1beta/models/gemini-2.5-flash:generateContent',
  genKey: 'https://api-integrations.appmedo.com/app-8actmiuaw4ch/api-Xa6JZ58oPMEa/v1beta/models/gemini-3-pro-image-preview:generateContent',
  visionKey: 'https://api-integrations.appmedo.com/app-8actmiuaw4ch/api-rLob8RdzAOl9/v1beta/models/gemini-2.5-flash:generateContent',
  headerKey: 'X-App-Id',
  headerValue: 'app-8actmiuaw4ch',
};
```

---

## 6. أوامر بناء وتشغيل

```bash
# تطبيق الويب
npm run dev              # تشغيل تطوير (localhost:5173)
npm run build:web        # بناء للإنتاج (dist/)
npm run preview          # معاينة البناء

# Electron
npm run electron:dev     # تشغيل تطوير Electron
npm run electron:preview # بناء + تشغيل Electron
npm run electron:build:win # بناء حزمة Windows (Setup + Portable)

# ملاحظة: على Windows، استخدم:
powershell -ExecutionPolicy Bypass -Command "npm run build:web"
```

---

## 7. نقاط انتباه مهمة للتعديل

1. **الملفات في `src/components/ui/`** مولّدة تلقائياً من shadcn/ui — لا تعدلها يدوياً إلا إذا كنت تعرف ما تفعل
2. **`imageGeneration.ts`** يحتوي على منطق API حرج — أي تعديل يجب اختباره
3. **`submitGenerationTask`** تتعامل مع 6 صيغ مختلفة للاستجابة — لا تحذف أي case
4. **localStorage** هو المخزن الأساسي — Appwrite اختياري فقط
5. **`main.cjs` و `preload.cjs`** يجب أن تبقى `.cjs` (لأن `type: "module"`)
6. **`package.json` icon** يجب أن يشير إلى ملف `.ico` بحجم ≥256×256
7. **التطبيق RTL بالكامل** — لا تستخدم `dir="ltr"` في أي مكان
8. **`vercel.json`** يحتوي على SPA rewrite rule — لا تحذفه
9. **رسائل الخطأ بالعربية** — حافظ على تناسق اللغة
10. **Sentry** مُهيأ في `main.tsx` — لا تحذف ErrorBoundary
