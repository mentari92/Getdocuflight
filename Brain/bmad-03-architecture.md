# Architecture Document
# GetDocuFlight – AI Visa Predictor & Travel Tools

**Version:** 3.0  
**Status:** Final — Ready for Development  
**Updated:** 3 products (AI Predictor $5, Dummy Flight $10, Bundle $20), order form `/order`, Live Chat, guest checkout, 6-layer security

---

## 1. System Overview

```
Browser / Mobile
      ↓
  Nginx (HTTPS, port 443) — Contabo VPS Europe (GDPR)
      ↓
  Next.js App (App Router) — port 3000
      ↓
  Auth.js (JWT session) — required for AI Predictor, optional for /order
      ↓
  ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
  │              │              │              │              │              │              │
PostgreSQL 16  Redis          OpenAI API    DompetX API    Polar.sh API   MinIO          Resend         PostHog
(Prisma ORM)  (Cache/Queue)  (GPT-4o)      (Local Pay)    (Credit Card)  (Encrypted)    (Email)        (Analytics)

Flows:
1. AI Visa Predictor: Form → Scoring Engine → Free Preview → Pay $5 → Full Result
2. Dummy Order:        /order form → Pay (DompetX/Polar) → Admin dashboard → CS delivers
3. Live Chat:          Widget → PostgreSQL → Admin /admin/chat → Reply
4. Document Upload:    ClamAV → AES-256 → MinIO → GPT-4o vision → Auto-delete 24h
5. Payment Mocking:    Local interceptor (`dompetx.ts`) → `/mock-payment` UI → Synthetic Webhook
6. Smart Navigator:    Public Landing → Form → OpenAI → Result + Itinerary → Lead Capture
```

---

## 2. Folder Structure

```
getdocuflight/
├── app/
│   ├── (marketing)/
│   │   └── visa-predictor/
│   │       └── page.tsx               ← Landing page + AI Predictor form
│   ├── (public)/
│   │   └── order/
│   │       └── page.tsx               ← Dummy ticket/hotel order form (NO LOGIN)
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── predictions/
│   │       │   └── page.tsx           ← Prediction history
│   │       └── predictions/[id]/
│   │           └── page.tsx           ← Full result + upload CTA
│   ├── (admin)/
│   │   └── admin/
│   │       ├── chat/
│   │       │   └── page.tsx           ← Live Chat admin panel
│   │       └── orders/
│   │           └── page.tsx           ← Dummy ticket/hotel orders dashboard
│   └── api/
│       ├── predict/
│       │   └── route.ts               ← POST: scoring engine (form-based)
│       ├── predict/[id]/reanalyze/
│       │   └── route.ts               ← POST: trigger re-analysis after upload
│       ├── documents/
│       │   ├── upload/
│       │   │   └── route.ts           ← POST: file upload endpoint
│       │   └── [fileId]/
│       │       └── route.ts           ← DELETE: manual delete endpoint
│       ├── payments/
│       │   ├── create/
│       │   │   └── route.ts           ← POST: initiate payment (DompetX or Polar.sh)
│       │   └── webhooks/
│       │       ├── dompetx/
│       │       │   └── route.ts       ← POST: DompetX webhook handler
│       │       └── polar/
│       │           └── route.ts       ← POST: Polar.sh webhook handler
│       ├── mock-payment/
│       │   └── route.ts               ← POST: Internal mock gateway (Dev Only)
│       ├── tools/
│       │   └── visa-checker/
│       │       └── route.ts       ← POST: OpenAI-powered visa checker + itinerary
│       ├── dummy-orders/
│       │   └── route.ts               ← POST: create dummy ticket/hotel order (NO AUTH)
│       └── livechat/
│           ├── messages/
│           │   └── route.ts           ← GET/POST: chat messages
│           └── conversations/
│               └── route.ts           ← GET: admin conversations list
│
├── components/
│   ├── predictor/
│   │   ├── PredictorForm.tsx
│   │   ├── PredictorTeaser.tsx        ← Free 1-2 paragraph preview
│   │   ├── PredictorResult.tsx        ← Full result (score + factors + recommendations)
│   │   ├── RecommendationPanel.tsx    ← General summary + specific breakdown
│   │   ├── PaywallCard.tsx
│   │   ├── DocumentUploadConsent.tsx  ← Consent screen (4 checkboxes)
│   │   ├── DocumentUploadZone.tsx     ← File upload UI
│   │   ├── DocumentCountdown.tsx      ← "Dihapus dalam X jam"
│   │   └── DocumentDeleteButton.tsx
│   ├── order/
│   │   └── DummyOrderForm.tsx         ← Order form (product select + details + payment)
│   └── livechat/
│       ├── LiveChat.tsx               ← Floating chat widget
│       └── LiveChatWrapper.tsx        ← Client wrapper (dynamic import)
│
└── lib/
    ├── scoring.ts                     ← Rule-based scoring logic
    ├── openai.ts                      ← OpenAI client + prompts (form + document)
    ├── openai-vision.ts               ← Document parsing with GPT-4o vision
    ├── dompetx.ts                     ← DompetX API client
    ├── cache.ts                       ← Redis helpers
    ├── storage.ts                     ← MinIO client
    ├── encryption.ts                  ← AES-256 per-user key management
    ├── malware.ts                     ← ClamAV integration
    └── document-queue.ts             ← Redis deletion job scheduler
```

---

## 3. Database Schema

### Table: `predictions`

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → users.id |
| fromCountry | String | e.g. "indonesia" |
| toCountry | String | e.g. "japan" |
| inputData | Json | Full form input |
| inputHash | String | SHA-256 of inputData for caching |
| approvalScore | Int | 0–100 (from form, updated after re-analysis) |
| approvalScoreWithDocs | Int? | Updated score after document re-analysis |
| riskLevel | Enum | LOW, MEDIUM, HIGH |
| teaser | String | 1–2 paragraph free preview |
| recommendation | String | AI-generated full recommendation text |
| recommendationSummary | Json | Array: general summary points (3-4 items) |
| factors | Json | Array of factor objects |
| hasDocumentAnalysis | Boolean | Default: false |
| isPaid | Boolean | Default: false |
| orderId | String? | FK → orders.id after payment |
| uploadWindowExpiresAt | DateTime? | Set at payment time + 24 hours |
| createdAt | DateTime | Auto |

**Index:** `inputHash` — for Redis cache lookup

### Table: `orders`

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → users.id |
| productType | Enum | AI_PREDICTION |
| amountUSD | Float | 5.00 for predictor, 10.00 for single, 20.00 for bundle |
| amountIDR | Float | Calculated at checkout |
| exchangeRate | Float | Rate used at checkout |
| currency | String | Default "IDR" |
| status | Enum | PENDING, WAITING_PAYMENT, PAID, COMPLETED, EXPIRED |
| paymentGateway | Enum | DOMPETX, POLAR |
| paymentMethod | String? | "qris", "virtual_account_bca", etc. |
| paymentRef | String? | DompetX reference ID |
| productId | String? | prediction.id |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |
| paidAt | DateTime? | Set when webhook confirms |

### Table: `documents`

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → users.id |
| predictionId | String | FK → predictions.id |
| fileType | Enum | BANK_STATEMENT, EMPLOYMENT_LETTER, SALARY_SLIP, PASSPORT_STAMPS |
| storagePath | String | MinIO path — random UUID, no readable info |
| encryptionKeyId | String | FK → encryptionKeys.id |
| status | Enum | PROCESSING, ANALYZED, DELETED |
| scheduledDeleteAt | DateTime | Set at upload time + 24h |
| deletedAt | DateTime? | Set when deleted |
| createdAt | DateTime | Auto |

### Table: `encryption_keys`

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | Primary key |
| userId | String | FK → users.id |
| documentId | String | FK → documents.id |
| encryptedKey | String | AES-256 key, encrypted with server master key |
| createdAt | DateTime | Auto |
| deletedAt | DateTime? | Deleted when document is deleted |

**PENTING:** Tabel ini terpisah dari MinIO. Jika MinIO breach, file tidak bisa dibaca tanpa kunci dari tabel ini.

### Table: `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | Primary key |
| action | String | "upload", "process", "delete", "manual_delete" |
| fileId | String? | FK → documents.id |
| userId | String | FK → users.id |
| purpose | String | "visa_prediction_reanalysis" |
| ipAddress | String | User IP at time of action |
| timestamp | DateTime | Auto |

### Table: `dummy_orders`

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | Primary key |
| productType | Enum | DUMMY_FLIGHT, DUMMY_BUNDLE |
| fullName | String | Passenger full name (as per passport) |
| email | String | Customer email for delivery |
| phone | String? | WhatsApp / phone number |
| flightFrom | String? | Departure city (if flight/bundle) |
| flightTo | String? | Arrival city (if flight/bundle) |
| departureDate | DateTime? | Flight departure date |
| returnDate | DateTime? | Flight return date (if roundtrip) |
| isRoundTrip | Boolean | Default: false |
| hotelCity | String? | Hotel city (if hotel/bundle) |
| checkIn | DateTime? | Hotel check-in date |
| checkOut | DateTime? | Hotel check-out date |
| amountUSD | Float | 10.00 or 20.00 (bundle) |
| status | Enum | PENDING, PAID, PROCESSING, DELIVERED, EXPIRED |
| paymentRef | String? | DompetX reference ID |
| orderId | String? | FK → orders.id (payment link) |
| createdAt | DateTime | Auto |
| deliveredAt | DateTime? | When CS sent the document |

**Note:** No `userId` FK — this table supports guest checkout (no login required).

### Enums

```prisma
enum RiskLevel { LOW MEDIUM HIGH }
enum OrderStatus { PENDING WAITING_PAYMENT PAID COMPLETED FAILED EXPIRED }
enum ProductType { AI_PREDICTION DUMMY_FLIGHT DUMMY_BUNDLE }
enum PaymentGateway { DOMPETX POLAR }
enum DocumentType { BANK_STATEMENT EMPLOYMENT_LETTER SALARY_SLIP PASSPORT_STAMPS }
enum DocumentStatus { PROCESSING ANALYZED DELETED }
```

---

## 4. API Design

### POST `/api/predict`
**Auth:** Required | **Rate limit:** 10 req/min per userId

**Request:** Form data (nationality, destination, employment, income, etc.)

**Server logic:**
1. Validate via Zod
2. Generate `inputHash` = SHA-256(JSON.stringify(sortedInput))
3. Check Redis cache → hit → skip to step 6
4. Run rule-based scoring → `baseScore`
5. Call OpenAI GPT-4o → receive `{ score, riskLevel, teaser, recommendation, recommendationSummary, factors }`
6. Store in Redis (TTL: 3600s)
7. Save Prediction (isPaid: false)
8. Return preview response

**Response (free):**
```json
{
  "predictionId": "clx...",
  "isPaid": false,
  "teaser": "Profil kamu menunjukkan beberapa kekuatan, namun ada faktor penting yang perlu diperhatikan...",
  "price": { "amountUSD": 5.00, "amountIDR": 83902, "exchangeRate": 16780.4 }
}
```

---

### POST `/api/payments/create`
**Auth:** Required

**Server logic:**
1. Verify predictionId belongs to userId
2. Fetch IDR rate from Redis cache (`fx:USD:IDR`) or freecurrencyapi.com
3. Create Order (PENDING)
4. Call DompetX API → get payment instructions
5. Set `prediction.uploadWindowExpiresAt = now + 24h`
6. Return payment instructions

---

### POST `/api/dummy-orders`
**Auth:** NOT required (guest checkout)

**Request:**
```json
{
  "productType": "DUMMY_FLIGHT | DUMMY_BUNDLE",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+6281234567890",
  "flightFrom": "Jakarta",
  "flightTo": "Tokyo",
  "departureDate": "2026-04-15",
  "returnDate": "2026-04-25",
  "isRoundTrip": true,
  "hotelCity": "Tokyo",
  "checkIn": "2026-04-15",
  "checkOut": "2026-04-25"
}
```

**Server logic:**
1. Validate via Zod (conditional: flight fields required if FLIGHT/BUNDLE, hotel fields if HOTEL/BUNDLE)
2. Calculate amount: $10 (single) or $20 (bundle)
3. Create DummyOrder record (status: PENDING)
4. Create Order record (for DompetX payment)
5. Call DompetX API → get payment instructions
6. Return payment instructions + orderId

**Response:**
```json
{
  "dummyOrderId": "clx...",
  "amount": { "amountUSD": 10.00, "amountIDR": 167804 },
  "paymentInstructions": { "method": "qris", "qrCode": "..." }
}
```

---

### POST `/api/documents/upload`
**Auth:** Required | **Paid users only** | **Within 24h window**

**Request:** FormData with files (PDF/JPG/PNG, max 10MB each, max 4 files)

**Server logic (ordered — security-first):**
1. Check user is paid + upload window not expired
2. Validate file types: PDF, JPG, PNG only — reject all others
3. Validate file size: max 10MB per file
4. **ClamAV malware scan** → reject if infected
5. Generate random UUID for storage path (`uploads/{uuid}/{uuid}.enc`)
6. Generate AES-256 encryption key unique to this user+file
7. Encrypt file in memory
8. Upload encrypted blob to MinIO (no plaintext on disk)
9. Store encryption key in `encryption_keys` table (separate from MinIO)
10. Create `Document` record in DB
11. Schedule deletion job in Redis: `doc:delete:{documentId}` TTL 24h
12. Log to `audit_logs`: action "upload"
13. Return `{ documentId, fileType, status: "processing" }`

---

### POST `/api/predict/[id]/reanalyze`
**Auth:** Required | **Paid users only**

**Server logic:**
1. Verify all uploaded documents belong to this prediction
2. For each document:
   a. Fetch encrypted file from MinIO
   b. Fetch encryption key from `encryption_keys`
   c. Decrypt in memory (never write plaintext to disk)
   d. Send directly to OpenAI GPT-4o vision API
   e. Extract relevant data (bank patterns, employment details, travel history)
3. Compile extracted data + original form input
4. Call OpenAI again with enriched context
5. Update `prediction.approvalScoreWithDocs`, `recommendation`, `recommendationSummary`, `factors`, `hasDocumentAnalysis = true`
6. Log to `audit_logs`: action "process"
7. Return updated prediction

---

### DELETE `/api/documents/[fileId]`
**Auth:** Required | **Owner only**

**Server logic:**
1. Verify fileId belongs to userId
2. Delete encrypted file from MinIO
3. Delete encryption key from `encryption_keys`
4. Mark `document.status = DELETED`, set `deletedAt`
5. Cancel scheduled Redis deletion job
6. Log to `audit_logs`: action "manual_delete"

---

## 5. Caching Strategy

| Key Pattern | TTL | Content |
|-------------|-----|---------|
| `ai:predict:{inputHash}` | 3600s | Full prediction result |
| `fx:USD:IDR` | 3600s | Exchange rate |
| `doc:delete:{documentId}` | 86400s | Deletion job trigger |
| `ratelimit:predict:{userId}` | 60s | Rate limiting counter |

---

## 6. Security Architecture — 6 Layers

### Layer 1: Pre-Upload Validation
```typescript
// lib/malware.ts
await clamavScan(fileBuffer);          // Reject if infected
validateFileType(mimetype);            // PDF, JPG, PNG only
validateFileSize(size, 10 * 1024 * 1024); // Max 10MB
```

### Layer 2: Encrypted Storage (MinIO)
```typescript
// lib/encryption.ts
const key = crypto.randomBytes(32);    // Unique key per file
const encrypted = encryptAES256(fileBuffer, key);
const storagePath = `uploads/${uuid()}/${uuid()}.enc`; // No readable info

await minioClient.putObject(BUCKET, storagePath, encrypted);
await db.encryptionKey.create({ userId, documentId, encryptedKey: encrypt(key, MASTER_KEY) });
```

### Layer 3: Memory-Only Processing
```typescript
// lib/openai-vision.ts
const key = await db.encryptionKey.findUnique({ where: { documentId } });
const decryptedBuffer = decryptAES256(encryptedFile, key); // In memory only
// Never: fs.writeFileSync(...)
const extractedData = await openai.processDocument(decryptedBuffer);
```

### Layer 4: Auto-Delete via Redis Queue
```typescript
// lib/document-queue.ts
await redis.set(`doc:delete:${documentId}`, '1', 'EX', 86400); // 24h TTL
// Worker checks this key and triggers deletion when TTL expires
```

### Layer 5: Audit Logging
```typescript
// lib/audit.ts
await db.auditLog.create({
  action, fileId, userId, purpose: 'visa_prediction_reanalysis',
  ipAddress: req.ip, timestamp: new Date()
});
```

### Layer 6: User Trust Signals (UI)
Dashboard menampilkan:
```
✓ Dokumen dienkripsi segera setelah upload
✓ Hanya digunakan untuk analisis AI — tidak dibaca manusia
✓ Dihapus otomatis 24 jam setelah hasil keluar
✓ Tidak pernah dibagikan ke pihak ketiga
✓ Server di Eropa tunduk pada GDPR
✓ Koneksi aman (HTTPS 256-bit)
```

---

## 7. OpenAI Prompt Architecture

### Prompt 1: Form-Based Analysis (Free + Paid Base)
```
System: You are a visa application analyst specializing in applications from developing countries.
Analyze this visa application profile and return JSON:
{
  "approvalScore": 0-100,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "teaser": "1-2 paragraphs hinting at key issues without revealing specifics — designed to make user want to pay for full result",
  "factors": [{ "name": "", "impact": "positive|neutral|negative", "detail": "" }],
  "recommendationSummary": ["Point 1", "Point 2", "Point 3"],
  "recommendation": "Full detailed recommendations..."
}

TEASER RULES:
- Must hint that there are issues but NOT reveal what they are specifically
- Must be compelling enough that user wants to pay $5 to find out more
- Do NOT say: "Your bank balance is too low" (too specific)
- DO say: "Your financial profile needs attention before applying" (intriguing but vague)
```

### Prompt 2: Document Re-Analysis
```
System: You previously analyzed this visa application profile (form data provided).
Now you have additional document data extracted. Re-analyze with higher accuracy.
Return same JSON structure but updated based on actual document evidence.
For each factor that changed, note WHY it changed based on documents.
For recommendations, provide specific numbers and actionable steps based on actual document data.
```

---

## 8. Architecture Decision Records (ADRs)

### ADR-01: Next.js App Router
Reason: Unified full-stack, no separate backend needed for MVP. Server Components reduce client JS.

### ADR-02: PostgreSQL over MongoDB
Reason: Relational data (users → orders → predictions → documents). ACID transactions needed for payment flow.

### ADR-03: Redis for Caching + Queue
Reason: Sub-100ms cache for AI results + TTL-based deletion queue for documents. Two responsibilities, one service.

### ADR-04: DompetX for Indonesian Payments
Reason: Supports QRIS, VA, e-Wallet (GoPay, OVO, DANA, ShopeePay). Native Indonesian payment methods.

### ADR-05: Dynamic IDR Conversion
Reason: Fixed IDR would become incorrect as exchange rate fluctuates. Dynamic conversion at checkout is more accurate and builds user trust.

### ADR-06: Contabo Europe (GDPR) vs Asia
Reason: GDPR is the strongest data protection standard globally. UU PDP Pasal 56 allows transfer to countries with equivalent or higher standards — GDPR clearly qualifies. Benefit: compliance "inherited" from server location. Trade-off: slightly higher latency for Indonesian users (acceptable for non-real-time use case).

### ADR-07: GPT-4o (Vision) vs GPT-4o-mini
Reason: Document analysis (PDF/image reading) requires vision capability. GPT-4o-mini does not support vision. Cost is higher (~$0.01-0.05/prediction) but $5 pricing absorbs this comfortably.

### ADR-08: No KTP / Passport Biometric Upload
Reason: NIK + passport number combination = highest identity theft risk in Indonesia. Value added for prediction accuracy is minimal (all relevant data capturable via form). Risk vs benefit strongly favors not collecting these documents.

### ADR-09: Opsi C — Pay First, Upload Later (24h Window)
Reason: Reduces friction at payment point. User gets immediate value (full result from form). Upload is an optional upgrade for higher accuracy, not a gate. Builds trust before asking for sensitive documents.

### ADR-10: Per-File AES-256 Encryption Key
Reason: If one key is compromised, only that file is exposed. Shared key = all files exposed. Additional cost: zero (Node.js crypto built-in).

### ADR-11: Guest Checkout for Dummy Ticket/Hotel
Reason: Dummy ticket/hotel orders don't involve sensitive personal data or documents. Requiring login adds friction and reduces conversion. Guest checkout via email is sufficient for delivery and tracking. AI Visa Predictor still requires login because it handles sensitive document data.

### ADR-13: Polar.sh for Credit Card Payments
Reason: Polar.sh provides a beautiful, Stripe-backed checkout with lower overhead for small SaaS than direct Stripe integration. It handles international payments and tax compliance effortlessly.

### ADR-14: Instrumented Local Payment Mocking
Reason: To avoid hitting real payment APIs during local development and to allow full e2e testing of webhooks without public tunneling (ngrok). `dompetx.ts` intercepts dummy keys and redirects to a local `/mock-payment` sandbox.
