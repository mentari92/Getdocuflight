# Epics & Stories
# GetDocuFlight – AI Visa Predictor

**Version:** 3.0  
**Status:** Final — Ready for Development  
**Updated:** 3 products (AI Predictor $5, Dummy Flight $10, Bundle $20), Live Chat, order form, document upload

---

## Epic Overview

| Epic | Name | Stories | Priority |
|------|------|---------|----------|
| Epic 1 | Foundation & Auth | 1.1 – 1.3 | Must Have |
| Epic 2 | Predictor Core (Form + Free Preview) | 2.1 – 2.3 | Must Have |
| Epic 3 | Payment & Full Result | 3.1 – 3.3 | Must Have |
| Epic 4 | Document Upload & Re-Analysis | 4.1 – 4.4 | Must Have |
| Epic 5 | Live Chat & Dummy Flight/Bundle | 5.1 – 5.5 | Must Have |

**Build order:** Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5

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
- [ ] Function `getIDRAmount(10.00)` returns `{ amountIDR, exchangeRate }`
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
- [ ] CTA button: "Unlock Full Analysis → $5"
- [ ] Note: "\*Jumlah IDR berdasarkan kurs hari ini"
- [ ] UI looks compelling — teaser feels like it's hiding important information

---

## Epic 3: Payment & Full Result

### Story 3.1: Payment Flow (DompetX)

**As a** logged-in user  
**I want to** pay $5  
**So that** I can unlock my full prediction result

**Acceptance Criteria:**
- [ ] Clicking CTA shows payment modal with current IDR equivalent
- [ ] Display: "$5 USD"
- [ ] User selects payment method (QRIS / VA / e-Wallet)
- [ ] `POST /api/payments/create` creates Order with `amountUSD: 5.00`
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

Week 5:
☐ Story 5.1 — Live Chat (widget + admin panel)
☐ Story 5.2 — Order Form + Payment for Dummy Flight ($10) & Bundle ($20)

Before Launch:
☐ Privacy Policy published (mentions GDPR server + OpenAI sub-processor)
☐ OpenAI DPA signed
☐ Breach notification procedure documented
☐ Test auto-delete job fires correctly at 24h
☐ Test manual delete clears all: MinIO + DB key + Redis job
```

---

## Epic 5: Live Chat & Dummy Flight/Bundle

### Story 5.1: Live Chat Widget & Admin Panel

**As a** visitor  
**I want to** chat with customer service directly on the website  
**So that** I can ask questions and order dummy tickets/hotel

**Acceptance Criteria:**
- [ ] Floating chat bubble visible on all public pages (bottom-right)
- [ ] Click opens chat panel with name input
- [ ] After entering name, visitor can send and receive messages
- [ ] Messages stored in PostgreSQL (ChatConversation + ChatMessage tables)
- [ ] Polling every 4 seconds for real-time feel
- [ ] Visitor ID persisted in localStorage across sessions
- [ ] Admin panel at `/admin/chat` lists all conversations
- [ ] Admin can select conversation and reply
- [ ] Admin-only access (role check)

---

### Story 5.2: Order Form + Payment for Dummy Ticket & Hotel

**As a** visitor  
**I want to** fill out an order form and pay for a dummy flight ticket or hotel reservation  
**So that** I get valid documents for my visa application without needing to log in

**Acceptance Criteria:**
- [ ] Order form at `/order` is public (no login required)
- [ ] Step 1: Select product — Flight only ($10) / Bundle Flight+Hotel ($20)
- [ ] Step 2: Passenger details — full name, email, phone/WhatsApp
- [ ] Step 3: Flight details (always shown) — departure city, arrival city, departure date, return date, one-way/round-trip
- [ ] Step 4: Hotel details (shown if Bundle) — city, check-in, check-out
- [ ] Step 5: Submit → redirect to DompetX payment
- [ ] Payment confirmed → DummyOrder created in admin dashboard (status: PAID)
- [ ] Admin can see all dummy orders at `/admin/orders`
- [ ] CS processes order → marks as DELIVERED → customer notified
- [ ] Dummy flight ticket delivered with valid PNR via email within 1–2 hours
- [ ] Bundle: both flight ticket and hotel reservation delivered via email within 1–2 hours
- [ ] Live Chat auto-greeting includes link to `/order` form
- [ ] Landing page CTA also links to `/order`

---

### Story 5.3: Document Auditor Upsell Links

**As a** business owner
**I want** the Document Auditor to suggest our Dummy Ticket & Hotel services when users are missing travel documents
**So that** we can upsell our core product to users who clearly need it

**Acceptance Criteria:**
- [ ] When the AI gap analysis flags missing flight/ticket/itinerary documents, display a prominent CTA to book a dummy flight
- [ ] When the AI gap analysis flags missing hotel/accommodation documents, display a prominent CTA to book a dummy hotel bundle
- [ ] Links should point directly to `/order`
- [ ] UI should integrate naturally into the `AuditResultsDisplay` component without breaking existing layout

---

### Story 5.4: Searchable City Dropdowns

**As a** visitor
**I want** to search for departure, arrival, and hotel cities using an autocomplete dropdown like on dummy-tickets.com
**So that** I can easily find my specific route and not just rely on a small static list

**Acceptance Criteria:**
- [x] Departure City, Arrival City, and Hotel City inputs are replaced with a searchable combobox element.
- [x] Users can type to filter a comprehensive list of major international cities/airports (e.g., "Jakarta (CGK)").
- [x] The dropdown shows "Popular Cities" when the input is focused but empty.
- [x] The dropdown closes when clicking outside or selecting an option.
- [x] The component matches the visual Bazi aesthetic of the current order form.

---

### Story 5.4b: Global Countries in Searchable Dropdown

**As a** visitor
**I want** to be able to search for and select any country in the world, not just specific cities
**So that** I can order dummy tickets for global routes where my specific city might not be listed

**Acceptance Criteria:**
- [x] The `COUNTRIES` list (190+ countries) is merged into the autocomplete dropdown's dataset.
- [x] Users can type a country (e.g., "Japan") and select the country directly (e.g., "🇯🇵 Japan").
- [x] The UI gracefully handles list items that are countries (no airport code needed).
- [x] The dropdown search logic works across both specific cities and general countries simultaneously.

### Story 5.5: Smart Navigator (Lead Magnet)

**As a** visitor
**I want** to check my visa requirements and get a sample travel itinerary for free
**So that** I can plan my trip and see the value of GetDocuFlight's premium services

**Acceptance Criteria:**
- [x] Dedicated page at `/smart-navigator` using the premium Bazi aesthetic.
- [x] Form with Nationality, Destination, and optional Email input.
- [x] Integration with GPT-4o to generate both visa requirements and a 7-day itinerary.
- [x] Result is logged to the `FreeToolsUsage` table for lead generation.
- [x] Prominent "Get Official Dummy Ticket" CTA shown after the AI result.
- [x] Mobile-responsive layout for easy access on the go.

### Epic 6: Analytics & Optimization

### Story 6.1: PostHog Analytics Integration
**As a** founder
**I want** to track user behavior and conversion funnels
**So that** I can optimize the product and maximize revenue

**Acceptance Criteria:**
- [x] PostHog integrated with Next.js App Router via instrumentation.
- [x] Session Recording enabled for all public and dashboard pages.
- [x] Type-safe event registry (`analytics.ts`) implemented.
- [x] Server-side event capture supported via PostHog Node SDK.
- [x] User identity linked between NextAuth and PostHog.
- [x] Autocapture and Heatmaps functional.
