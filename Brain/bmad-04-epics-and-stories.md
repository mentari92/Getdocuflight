# Epics & Stories
# GetDocuFlight – AI Visa Predictor

**Version:** 2.0  
**Status:** Final — Ready for Development  
**Updated:** Document upload (Opsi C), consent screen, re-analysis flow, auto-delete

---

## Epic Overview

| Epic | Name | Stories | Priority |
|------|------|---------|----------|
| Epic 1 | Foundation & Auth | 1.1 – 1.3 | Must Have |
| Epic 2 | Predictor Core (Form + Free Preview) | 2.1 – 2.3 | Must Have |
| Epic 3 | Payment & Full Result | 3.1 – 3.3 | Must Have |
| Epic 4 | Document Upload & Re-Analysis | 4.1 – 4.4 | Must Have |

**Build order:** Epic 1 → Epic 2 → Epic 3 → Epic 4

---

## Epic 1: Foundation & Auth

### Story 1.1: Project Setup & Database

**As a** developer  
**I want to** have the project structure, Docker environment, and database ready  
**So that** I can start building features immediately

**Acceptance Criteria:**
- [ ] Next.js app created with App Router, TypeScript, Tailwind
- [ ] Docker Compose with: Next.js, PostgreSQL 16, Redis, MinIO, ClamAV
- [ ] Prisma schema created with all tables: users, predictions, orders, documents, encryption_keys, audit_logs
- [ ] `prisma migrate dev` runs without errors
- [ ] Environment variables documented in `.env.example`
- [ ] MinIO bucket created: `getdocuflight-documents`
- [ ] ClamAV container running and accepting scan requests
- [ ] README with local setup instructions

**Notes for Antigravity:**
- Start in Plan mode: "Create Next.js project with Docker Compose including PostgreSQL, Redis, MinIO, ClamAV"
- Include all Prisma schema tables including documents, encryption_keys, audit_logs

---

### Story 1.2: User Authentication

**As a** visitor  
**I want to** register and log in with email  
**So that** I can use the predictor and access my results

**Acceptance Criteria:**
- [ ] Register form: email, password, confirm password (Zod validation)
- [ ] Login form: email, password
- [ ] Auth.js v5 JWT session configured
- [ ] Protected routes redirect to login
- [ ] Logout clears session
- [ ] Error messages in Bahasa Indonesia

---

### Story 1.3: Payment Infrastructure

**As a** developer  
**I want to** have DompetX and currency API integrated  
**So that** payment features can be built on top

**Acceptance Criteria:**
- [ ] `lib/dompetx.ts` — DompetX API client (create payment, verify webhook HMAC)
- [ ] `lib/cache.ts` — Redis helpers (get, set, delete, TTL)
- [ ] freecurrencyapi.com integrated, result cached Redis key `fx:USD:IDR` TTL 1 hour
- [ ] Function `getIDRAmount(5.00)` returns `{ amountIDR, exchangeRate }`
- [ ] DompetX webhook endpoint created: `/api/payments/webhooks/dompetx`
- [ ] HMAC signature validation on webhook
- [ ] Idempotent webhook handler (same event processed only once)

---

## Epic 2: Predictor Core

### Story 2.1: Predictor Form UI

**As a** logged-in user  
**I want to** fill in my visa application profile  
**So that** I can get an AI prediction

**Acceptance Criteria:**
- [ ] Form renders all 10 fields (as per FR-02)
- [ ] Client-side validation with error messages in Bahasa Indonesia
- [ ] Mobile-responsive (375px minimum)
- [ ] Loading state during submission
- [ ] Form works on slow 3G connection

---

### Story 2.2: Scoring Engine

**As a** developer  
**I want to** implement the two-stage scoring engine  
**So that** AI predictions are generated from form input

**Acceptance Criteria:**
- [ ] `lib/scoring.ts` implements all rule-based scoring logic (6 rules as per FR-03)
- [ ] `lib/openai.ts` sends enriched prompt to GPT-4o, receives structured JSON response
- [ ] Response includes: `approvalScore`, `riskLevel`, `teaser` (1-2 paragraphs), `factors`, `recommendationSummary`, `recommendation`
- [ ] Result cached in Redis by `inputHash` (TTL 1 hour)
- [ ] Prediction saved to PostgreSQL (`isPaid: false`)
- [ ] Fallback to rule-based score if OpenAI fails
- [ ] API response < 5 seconds

**Teaser prompt requirement:**
- Teaser must hint at issues but NOT reveal specifics
- Must feel compelling enough to pay for full result
- Test: would a user feel curious/worried enough to pay $5 after reading teaser?

---

### Story 2.3: Free Preview Display

**As a** logged-in user  
**I want to** see a 1–2 paragraph teaser after submitting the form  
**So that** I can decide whether to pay for the full result

**Acceptance Criteria:**
- [ ] Teaser text (1–2 paragraphs) displayed prominently
- [ ] Approval score visually blurred/hidden
- [ ] Risk level badge hidden (or shown only as color without label)
- [ ] Factors section hidden with blur overlay
- [ ] Recommendations section hidden
- [ ] CTA button: "Lihat Hasil Lengkap + Saran Perbaikan → $5.00 (Rp ~83.000\*)"
- [ ] Note: "\*Jumlah IDR berdasarkan kurs hari ini"
- [ ] UI looks compelling — teaser feels like it's hiding important information

---

## Epic 3: Payment & Full Result

### Story 3.1: Payment Flow (DompetX)

**As a** logged-in user  
**I want to** pay $5.00 in IDR  
**So that** I can unlock my full prediction result

**Acceptance Criteria:**
- [ ] Clicking CTA shows payment modal with current IDR equivalent
- [ ] Display: "Rp 83.902 (kurs: 1 USD = Rp 16.780)"
- [ ] User selects payment method (QRIS / VA / e-Wallet)
- [ ] `POST /api/payments/create` creates Order with `amountUSD: 5.00`, `amountIDR`, `exchangeRate`
- [ ] Payment instructions shown (QR code or VA number)
- [ ] DompetX webhook received → Order status → COMPLETED
- [ ] `prediction.isPaid = true` after payment
- [ ] `prediction.uploadWindowExpiresAt = paidAt + 24 hours`
- [ ] Confirmation email sent via Resend

---

### Story 3.2: Full Result Display

**As a** paying user  
**I want to** see my complete prediction result immediately after payment  
**So that** I know my visa approval chances and what to improve

**Acceptance Criteria:**
- [ ] Full result shows immediately after payment confirmation (no need to upload documents first)
- [ ] Approval score displayed prominently (large number, e.g., "72/100")
- [ ] Risk level badge visible: LOW (green) / MEDIUM (yellow) / HIGH (red)
- [ ] Factors table: 3–5 rows with name, impact icon (✅/⚠️/❌), detail text
- [ ] **Saran Perbaikan — dua format:**
  - General summary: numbered list 3–4 poin (e.g., "3 hal yang perlu diperkuat")
  - Breakdown spesifik: per faktor bermasalah, angka dan langkah konkret
- [ ] Upload CTA banner visible (if within 24h window):
  - "Tingkatkan akurasi dengan upload dokumen keuangan"
  - Countdown timer: "Tersedia 23 jam 45 menit lagi"
  - Button: "Upload Dokumen untuk Re-Analisis"
- [ ] Disclaimer: "Hasil ini bersifat indikatif dan bukan jaminan persetujuan visa."

---

### Story 3.3: Dashboard – Prediction History

**As a** returning user  
**I want to** view my past predictions  
**So that** I can re-access results I've paid for

**Acceptance Criteria:**
- [ ] Dashboard lists all predictions: destination, date, risk level, paid status
- [ ] Paid predictions: "Lihat Hasil" button + "Upload Dokumen" button (if within 24h window)
- [ ] Unpaid predictions: "Unlock Hasil" button
- [ ] "Hapus Dokumen Saya" button visible if active documents exist
- [ ] Clicking "Hapus Dokumen" immediately deletes all files + shows confirmation
- [ ] If document uploaded: show "✓ Diverifikasi dengan dokumen" badge
- [ ] If upload window expired: "Upload period ended" message shown instead of button

---

## Epic 4: Document Upload & Re-Analysis

### Story 4.1: Document Upload Infrastructure

**As a** developer  
**I want to** build the secure document upload backend  
**So that** user documents are handled safely and in compliance with UU PDP + GDPR

**Acceptance Criteria:**
- [ ] `lib/malware.ts` — ClamAV integration, returns pass/fail
- [ ] `lib/encryption.ts` — AES-256 encrypt/decrypt, per-file key generation
- [ ] `lib/storage.ts` — MinIO client: upload encrypted, download encrypted, delete
- [ ] `lib/document-queue.ts` — Redis deletion queue: schedule deletion, cancel, trigger
- [ ] `lib/audit.ts` — Audit log writer function
- [ ] `POST /api/documents/upload` implements all 13 steps in security flow (Architecture §4)
- [ ] `DELETE /api/documents/[fileId]` deletes file + key + cancels Redis job + logs
- [ ] Storage path format: `uploads/{uuid}/{uuid}.enc` — no userId or filename in path
- [ ] File encrypted BEFORE writing to MinIO (plaintext never touches disk)
- [ ] Encryption key stored in `encryption_keys` table, NOT in MinIO metadata

---

### Story 4.2: Consent Screen

**As a** paid user who wants to upload documents  
**I want to** see a clear consent screen before uploading  
**So that** I understand how my sensitive data will be handled

**Acceptance Criteria:**
- [ ] Consent screen appears BEFORE any file picker is shown
- [ ] 4 checkboxes, all must be checked to proceed:
  1. "Saya memahami dokumen saya akan dianalisis oleh OpenAI (berbasis di Amerika Serikat) hanya untuk tujuan prediksi visa ini."
  2. "Saya memahami dokumen disimpan di server Eropa yang tunduk pada regulasi GDPR."
  3. "Dokumen saya akan dihapus otomatis 24 jam setelah analisis selesai."
  4. "Saya dapat meminta penghapusan dokumen kapan saja melalui halaman dashboard."
- [ ] "Lanjut ke Upload" button disabled until all 4 checkboxes checked
- [ ] Consent recorded in DB (timestamp + userId)
- [ ] Trust signals shown alongside checkboxes:
  - ✓ Enkripsi AES-256
  - ✓ Server GDPR Eropa
  - ✓ Tidak dibaca manusia
  - ✓ Dihapus otomatis
- [ ] Link ke Privacy Policy tersedia

---

### Story 4.3: Document Upload UI

**As a** paid user  
**I want to** upload my rekening koran and other documents  
**So that** I get a more accurate visa prediction

**Acceptance Criteria:**
- [ ] Upload zone shows 4 slots: rekening koran (required), surat kerja (required), slip gaji (optional), halaman visa paspor (optional)
- [ ] Each slot: drag & drop + click to browse
- [ ] Accepted formats: PDF, JPG, PNG only
- [ ] Max file size per file: 10MB (shown in UI)
- [ ] Max 4 files total
- [ ] Progress indicator during upload
- [ ] Malware scan status shown: "Memeriksa keamanan file..."
- [ ] Success state per file: "✓ Terenkripsi dan aman"
- [ ] Error states: "File terinfeksi — tidak dapat diproses" / "Format file tidak didukung" / "File terlalu besar"
- [ ] **No KTP slot** — not shown anywhere in the UI
- [ ] **No passport biometric page** — UI explicitly says "halaman visa dan cap saja, bukan halaman foto"
- [ ] "Analisis Dokumen Saya" button appears after at least rekening koran uploaded

---

### Story 4.4: Re-Analysis Result

**As a** paid user who uploaded documents  
**I want to** see my updated prediction based on actual documents  
**So that** I get the most accurate assessment possible

**Acceptance Criteria:**
- [ ] `POST /api/predict/[id]/reanalyze` processes all uploaded documents (decrypt memory-only → OpenAI vision → update prediction)
- [ ] Processing indicator: "AI sedang membaca dokumen kamu... (estimasi 10–15 detik)"
- [ ] Updated result displayed: `approvalScoreWithDocs`, updated factors, updated recommendations
- [ ] Badge: "✓ Diverifikasi dengan dokumen" shown on result
- [ ] Per factor that changed: notation showing what changed and why
  - e.g., "Keuangan ↑ Updated: Rekening koran menunjukkan pemasukan konsisten Rp 15 juta/bulan"
- [ ] Saran perbaikan diperbarui dengan angka aktual dari dokumen
  - e.g., "Berdasarkan rekening koran kamu, rata-rata saldo 3 bulan terakhir adalah Rp 47 juta. Untuk visa Schengen, idealnya Rp 70 juta..."
- [ ] Countdown timer updates to: "Dokumen kamu akan dihapus dalam 24 jam"
- [ ] "Hapus Dokumen Sekarang" button visible
- [ ] After 24 hours: Redis job triggers deletion → files deleted from MinIO → keys deleted from DB → document status = DELETED → UI shows "Dokumen telah dihapus"
- [ ] Audit log entry created for: re-analysis trigger, completion, deletion

---

## Build Order Checklist

```
Week 1:
☐ Story 1.1 — Project setup, Docker, database schema
☐ Story 1.2 — User authentication
☐ Story 1.3 — Payment infrastructure (DompetX + currency API)

Week 2:
☐ Story 2.1 — Predictor form UI
☐ Story 2.2 — Scoring engine (rule-based + GPT-4o)
☐ Story 2.3 — Free preview (1-2 paragraph teaser)

Week 3:
☐ Story 3.1 — Payment flow
☐ Story 3.2 — Full result display (score + factors + saran perbaikan dua format)
☐ Story 3.3 — Dashboard

Week 4:
☐ Story 4.1 — Document upload infrastructure (security backend)
☐ Story 4.2 — Consent screen
☐ Story 4.3 — Document upload UI
☐ Story 4.4 — Re-analysis result

Before Launch:
☐ Privacy Policy published (mentions GDPR server + OpenAI sub-processor)
☐ OpenAI DPA signed
☐ Breach notification procedure documented
☐ Test auto-delete job fires correctly at 24h
☐ Test manual delete clears all: MinIO + DB key + Redis job
```
