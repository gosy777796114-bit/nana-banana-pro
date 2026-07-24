# DATABASE_SCHEMA.md — مخطط قاعدة البيانات

> **المشروع**: تطبيق نانه وبنانه برو
> **آخر تحديث**: 2026-07-25

---

## نظرة عامة

التطبيق يستخدم **3 طبقات تخزين**:

1. **localStorage** — المخزن الأساسي (يعمل دائماً)
2. **Supabase** — المصادقة + Storage (اختياري)
3. **Appwrite** — تخزين اتصالات سحابي (اختياري، غير مُهيّأ حالياً)

---

## 1. localStorage (المخزن المحلي) — الرئيسي

### المفتاح: `nano_banana_integrations`
**النوع**: `string` (JSON array)
**الوصف**: جميع اتصالات API المُضافة من المستخدم

```json
[
  {
    "id": "string (UUID)",
    "name": "string (اسم الاتصال)",
    "architectureType": "'direct' | 'through-proxy'",
    "baseUrl": "string (URL الأساسي)",
    "appId": "string (معرف التطبيق)",
    "genModel": "string (نموذج التوليد)",
    "visionModel": "string (نموذج الرؤية)",
    "genKey": "string (رابط API التوليد الكامل)",
    "visionKey": "string (رابط API الرؤية الكامل)",
    "headerKey": "string (اسم الهيدر)",
    "headerValue": "string (قيمة الهيدر)",
    "submitUrl": "string | undefined (رابط إرسال مخصص)",
    "queryUrl": "string | undefined (رابط الاستعلام مخصص)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
]
```

**الحد الأقصى**: 1000 اتصال
**القيمة الافتراضية**: اتصال "بنانه برو" يُضاف تلقائياً عند التشغيل الأول

---

### المفتاح: `nano_banana_active_connection`
**النوع**: `string` (UUID)
**الوصف**: معرف الاتصال النشط حالياً

```
"some-uuid-string"
```

---

### المفتاح: `nano_banana_saved_prompts`
**النوع**: `string` (JSON array)
**الوصف**: البرومبتات المحفوظة من المستخدم

```json
[
  {
    "id": "string (UUID)",
    "name": "string (اسم البرومبت)",
    "text": "string (نص البرومبت)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
]
```

**الحد الأقصى**: غير محدود

---

### ملاحظات localStorage
- جميع البيانات مخزنة كـ **strings** JSON
- `IntegrationContext` يقرأ/يكتب مباشرة عبر `integrationStorage.ts`
- `promptStorage.ts` يتعامل مع البرومبتات
- **لا توجد relationships** بين الجداول — كل مفتاح مستقل
- البيانات **لا تُزامن** تلقائياً بين الأجهزة (إلا إذا كان Appwrite مُهيّأ)

---

## 2. Supabase — المصادقة + Storage

### جدول: `profiles`
**الحالة**: ⏸️ موجود في الكود لكن لا يُستخدم في الواجهة الرئيسية

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID (PK) | يُطابق `auth.users.id` |
| *(باقي الأعمدة غير معروفة بالضبط — يُقرأ عبر `select('*')`)* |

**الاستخدام في الكود**:
```typescript
// AuthContext.tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

**العلاقة**: `profiles.id` ↔ `auth.users.id` (1:1)

---

### Storage Bucket: `generated-media`
**الحالة**: ⏸️ يُستخدم فقط في Edge Functions القديمة

| الخاصية | القيمة |
|---------|--------|
| **الاسم** | `generated-media` |
| **المسار** | `uploads/{uuid}.{ext}` |
| **الصلاحيات** | عام (public URLs) |
| **الاستخدام** | حفظ الصور المولدة من Edge Functions |

**ملاحظة**: التطبيق الحالي لا يُستخدم Supabase Storage — الصور تُعرض كـ `data:image/...;base64,...` مباشرة

---

### Edge Functions (قديمة — لا تُستخدم حالياً)

#### `image-generation-submit`
```typescript
// المدخلات:
{ contents: Array<{ parts: Array<{ text?: string; inline_data?: {...} }> }> }

// المخرجات:
{ taskId: string; estimatedTime: number }

// يستخدم:
- INTEGRATIONS_API_KEY (Bearer token)
- gateway.appmedo.com/image-generation/submit
```

#### `image-generation-query`
```typescript
// المدخلات:
{ taskId: string }

// المخرجات:
{ taskId: string; status: 'PENDING'|'SUCCESS'|'FAILED'|'TIMEOUT'; imageUrl?: string }

// يستخدم:
- INTEGRATIONS_API_KEY (Bearer token)
- gateway.appmedo.com/image-generation/task
- Supabase Storage (حفظ الصورة)
```

---

## 3. Appwrite — التخزين السحابي (اختياري)

### الحالة: ⏸️ غير مُهيّأ

**المتغيرات المطلوبة** (في `.env`):
```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=  (فارغ)
VITE_APPWRITE_DATABASE_ID= (فارغ)
VITE_APPWRITE_COLLECTION_ID= (فارغ)
```

### المجموعة: `integrations`
**النوع**: Appwrite Collection

| العمود | النوع | الوصف | مطلوب |
|--------|-------|-------|-------|
| `$id` | string | معرف Appwrite | تلقائي |
| `$createdAt` | string | تاريخ الإنشاء | تلقائي |
| `$updatedAt` | string | تاريخ التحديث | تلقائي |
| `appwriteId` | string | المعرف المحلي | نعم |
| `name` | string | اسم الاتصال | نعم |
| `architectureType` | string | نوع المعمارية | نعم |
| `baseUrl` | string | الرابط الأساسي | نعم |
| `appId` | string | معرف التطبيق | نعم |
| `genModel` | string | نموذج التوليد | نعم |
| `visionModel` | string | نموذج الرؤية | نعم |
| `genKey` | string | مفتاح التوليد | نعم |
| `visionKey` | string | مفتاح الرؤية | نعم |
| `headerKey` | string | اسم الهيدر | نعم |
| `headerValue` | string | قيمة الهيدر | نعم |
| `submitUrl` | string | رابط إرسال مخصص | لا |
| `queryUrl` | string | رابط استعلام مخصص | لا |
| `createdAt` | string | تاريخ الإنشاء | نعم |
| `updatedAt` | string | تاريخ التحديث | نعم |

**الفرز**: `$createdAt` تنازلي
**الصلاحيات**: (يُحدد عند إنشاء Collection في Appwrite)

### آلية العمل
```
1. المستخدم يُضيف/يُعدّل اتصال
2. يُحفظ في localStorage أولاً (المخزن الرئيسي)
3. إذا كان Appwrite مُهيّأ → يُحفظ أيضاً في Appwrite (dual-write)
4. عند التشغيل: يُقرأ من Appwrite أولاً → يُحفظ في localStorage
```

---

## 4. العلاقات بين طبقات التخزين

```
┌─────────────────────────────────────────────────────┐
│                   المستخدم                          │
│                     │                               │
│              ┌──────┴──────┐                        │
│              │             │                        │
│              ▼             ▼                        │
│    ┌─────────────┐  ┌──────────────┐               │
│    │ localStorage │  │   Appwrite   │               │
│    │  (أساسي)    │  │  (اختياري)  │               │
│    │             │  │              │               │
│    │ integrations│◄─┤ integrations │               │
│    │ active_id   │  │              │               │
│    │ prompts     │  │              │               │
│    └──────┬──────┘  └──────────────┘               │
│           │                                        │
│           ▼                                        │
│    ┌──────────────┐                                │
│    │  Supabase    │                                │
│    │  (اختياري)  │                                │
│    │              │                                │
│    │  profiles    │ ← auth.users                   │
│    │  Storage     │ ← generated-media              │
│    └──────────────┘                                │
└─────────────────────────────────────────────────────┘
```

---

## 5. أنواع البيانات الرئيسية (TypeScript)

### IntegrationData
```typescript
interface IntegrationData {
  id: string;                    // UUID فريد
  name: string;                  // اسم الاتصال
  architectureType: 'direct' | 'through-proxy';
  baseUrl: string;               // الرابط الأساسي للـ API
  appId: string;                 // معرف التطبيق
  genModel: string;              // نموذج التوليد (Gemini model path)
  visionModel: string;           // نموذج الرؤية
  genKey: string;                // URL الكامل لـ API التوليد
  visionKey: string;             // URL الكامل لـ API الرؤية
  headerKey: string;             // اسم الهيدر (e.g., 'X-App-Id')
  headerValue: string;           // قيمة الهيدر
  submitUrl?: string;            // رابط إرسال مخصص (اختياري)
  queryUrl?: string;             // رابط استعلام مخصص (اختياري)
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
}
```

### ReferenceImage
```typescript
interface ReferenceImage {
  id: string;                    // UUID فريد
  index: number;                 // ترتيب الصورة
  file: File;                    // الملف الأصلي
  name: string;                  // اسم الملف
  sizeBytes: number;             // الحجم بالبايت
  previewUrl: string;            // object URL للمعاينة
  base64?: string;               // base64 مضغوط
  mimeType: string;              // نوع MIME
  uploadProgress: number;        // تقدم الرفع (0-100)
  status: 'uploading' | 'ready' | 'error';
  errorMsg?: string;             // رسالة الخطأ
}
```

### GenerationResult
```typescript
interface GenerationResult {
  imageUrl: string;              // data URL للصورة الناتجة
  width: number;                 // الأبعاد المطلوبة
  height: number;
  quality: string;               // وصف الجودة
  generationTimeMs: number;      // وقت التوليد بالميلي ثانية
  fileSizeEstimate?: number;     // الحجم المقدر
  actualWidth?: number;          // الأبعاد الفعلية (بعد التحميل)
  actualHeight?: number;
}
```

---

## 6. ملاحظات للأمان

1. **`.env` لا يُرفع إلى Git** — يحتوي مفاتيح Supabase و Appwrite
2. **localStorage** — البيانات محلي فقط، لا يمكن لأحد آخر الوصول إليها
3. **Supabase RLS** — يجب تفعيل Row Level Security على `profiles`
4. **Appwrite Permissions** — يجب تحديد صلاحيات الوصول على Collection
5. **API Keys** — تُمرر كـ headers في requests، لا تُخزن في الكود المصدري
6. **Base64 images** — تُعرض مباشرة في DOM (لا external URLs في الحالة الحالية)
