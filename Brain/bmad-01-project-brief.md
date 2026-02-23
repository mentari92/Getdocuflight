# Project Brief: GetDocuFlight – AI Visa Predictor & Travel Tools

**Version:** 3.0  
**Status:** Final — Ready for Development  
**Updated:** 3 products (AI Predictor $5, Dummy Flight $10, Bundle $20), order form, live chat, document upload, compliance

---

## Problem Statement

Travelers from developing countries (Indonesia, Philippines, Vietnam, Nigeria, etc.) struggle to assess their visa application chances before spending time and money on the full application process. There is no accessible, personalized tool that evaluates their specific profile — employment status, financial standing, travel history — and gives an honest probability of approval.

The result: applicants waste money on visa fees, flights, and accommodation bookings only to get rejected, often without understanding why.

---

## Solution

A travel support platform with 3 core products:

### Product 1: AI Visa Predictor ($5)
1. Takes a user's profile as input via form (nationality, destination, finances, travel history)
2. Returns a **1–2 paragraph free preview** to create curiosity
3. Unlocks **full results + personalized recommendations** behind a **$5 paywall**
4. Optionally allows document upload within 24 hours post-payment for **higher-accuracy re-analysis**

### Product 2: Dummy Flight Ticket ($10)
- Flight reservation with **valid PNR** for visa application purposes
- Ordered via **order form at `/order`** (no login required)
- Link shared from Live Chat + landing page
- **Payment via DompetX (Local) or Polar.sh (Credit Card)**
- CS processes order → delivered within 1–2 hours via email

### Product 3: Bundle — Dummy Flight + Hotel ($20)
- Flight reservation + hotel booking confirmation in one order
- Ordered via **order form at `/order`** (no login required)
- Single payment of $20 via DompetX or Polar.sh
- CS processes order → both documents delivered within 1–2 hours via email

### Product 4: Smart Navigator (FREE)
- **Lead Magnet** to drive traffic and build trust
- Combines **Visa Checker** (global requirements) + **AI Itinerary Generator**
- Results delivered instantly via OpenAI
- Optional email capture for lead generation (saved to `FreeToolsUsage` table)

### Authentication Rules
- **AI Visa Predictor:** Login/signup **required** (data keamanan user)
- **Dummy Flight / Bundle:** **No login required** (guest checkout via form)

---

## Target Users

**Primary:** Indonesian travelers applying for visas to Japan, Australia, South Korea, Schengen countries, and the US.

**Secondary:** Travelers from Philippines, Vietnam, India, and Nigeria with the same pain point.

**User persona:** Mentari, 28, marketing professional in Jakarta. Wants to apply for a Japan tourist visa. Has savings but is unsure if her profile is strong enough. Does not want to waste the Rp 1.5 million embassy fee if her chances are low.

---

## MVP Scope

**In scope:**
- User registration and login (email)
- **AI Visa Predictor ($5):**
  - Visa predictor form (10 input fields)
  - Rule-based + AI scoring engine (GPT-4o for document vision support)
  - **Free preview:** 1–2 paragraph teaser result (no score, no breakdown)
  - **Paid full result** ($5): approval score, factor breakdown, general summary + specific recommendations
  - **Document upload:** After payment, user can upload documents within 24 hours to trigger re-analysis for higher accuracy
  - Document types allowed: rekening koran, surat keterangan kerja, slip gaji, halaman visa/cap paspor
  - **No upload:** KTP, NIK, paspor halaman biodata — tidak diperlukan
- **Dummy Flight Ticket ($10):** ordered via order form at `/order`, valid PNR, delivered 1–2 hours
- **Bundle Flight + Hotel ($20):** both documents ordered in one form, delivered 1–2 hours
- **Live Chat:** customer service widget for ordering support and general inquiries
- Email delivery of prediction result via Resend
- User dashboard: prediction history + re-access paid results + document upload CTA
- Consent screen before any document upload (UU PDP + GDPR compliant)
- Auto-delete documents within 24 hours after re-analysis completes
- **Gateway Support:** Dual-gateway (DompetX for Indonesia, Polar.sh for Credit Card)
- **Developer Sandbox:** Instrumented local payment mocking for zero-cost dev testing

**Out of scope (later phases):**
- Free visa checker
- Blog / content

---

## Business Model

### AI Visa Predictor

**Free tier:**
- Submit form → AI generates result
- See 1–2 paragraph teaser only (no score, no breakdown, no recommendations)
- Teaser hints at key issues but doesn't reveal them explicitly
- CTA: *"Unlock Full Analysis → $5"*

**Paid tier — $5 USD:**
- Payment via DompetX (VA, QRIS, GoPay, OVO, DANA, ShopeePay)
- **Immediately after payment:** Full result from form data
  - Approval score (0–100)
  - Risk level badge (LOW / MEDIUM / HIGH)
  - 3–5 factors with impact analysis
  - Saran perbaikan (general summary + specific per-factor recommendations)
- **Within 24 hours:** User can upload documents for re-analysis
  - Upload trigger: re-run AI with document context → updated score + revised recommendations
  - Documents added: rekening koran (highest value), surat kerja, slip gaji, halaman visa/cap paspor

### Dummy Flight Ticket — $10 USD
- Customer fills order form at `/order` (no login, guest checkout)
- Selects product: Flight only ($10) or Bundle Flight + Hotel ($20)
- Fills passenger + flight details
- **Pays immediately via DompetX** after form submission
- CS processes order → delivers dummy ticket with valid PNR via email
- Delivered within 1–2 hours

### Bundle (Flight + Hotel) — $20 USD
- Customer selects Bundle option at `/order`
- Fills both flight and hotel details in one form
- Single payment of $20 via DompetX
- Both documents delivered within 1–2 hours

---

## Success Metrics

- 100 paid predictions in first 30 days post-launch
- Conversion rate: form submission → payment ≥ 15%
- Document upload rate (post-payment): ≥ 30%
- Average rating from users ≥ 4/5

---

## Tech Stack (Pre-decided, LOCKED)

| Component | Technology | Notes |
|-----------|-----------|-------|
| Framework | Next.js (App Router) | |
| Database | PostgreSQL 16 + Prisma | |
| Cache / Queue | Redis | Results cache + document deletion jobs |
| Auth | Auth.js (NextAuth v5) | |
| AI | OpenAI GPT-4o | Upgraded from mini — needed for document vision (PDF/image reading) |
| Payment | DompetX | IDR methods |
| Email | Resend | |
| File Storage | MinIO (active) | AES-256 per-user encryption |
| Malware Scan | ClamAV (Docker) | Free, open source |
| Hosting | VPS Contabo — **Europe region** | GDPR compliance for data protection |
| Currency API | freecurrencyapi.com | Free tier: 5,000 req/month |

---

## Server Location Decision

**Contabo VPS di region Eropa (Jerman).**

Alasan: Server di Eropa tunduk pada GDPR — regulasi perlindungan data terkuat di dunia. UU PDP Indonesia Pasal 56 mengizinkan transfer data ke negara dengan standar perlindungan setara atau lebih tinggi. GDPR memenuhi syarat tersebut.

Implikasi: Privacy Policy wajib menyebutkan bahwa data disimpan di server Eropa yang tunduk pada GDPR, dan dokumen diproses oleh OpenAI (AS) berdasarkan OpenAI Data Processing Agreement.

---

## Compliance Requirements

| Regulasi | Status | Kewajiban Utama |
|----------|--------|----------------|
| UU PDP No. 27/2022 (Indonesia) | ✅ Berlaku penuh okt 2024 | Explicit consent, hak hapus data, breach notification 3×24 jam |
| GDPR (Eropa) | ✅ Berlaku di server location | Server Contabo Eropa, audit trail, data minimization |
| OpenAI DPA | Wajib sebelum production | Data Processing Agreement dengan OpenAI untuk processing dokumen user |

**Kewajiban minimum sebelum launch:**
1. Consent screen sebelum upload dokumen — menyebutkan OpenAI sebagai sub-processor
2. Tombol "Hapus dokumen saya" yang berfungsi di dashboard
3. Auto-delete dokumen 24 jam setelah re-analysis
4. Privacy Policy yang menyebutkan server Eropa + OpenAI DPA
5. Prosedur breach notification (max 3×24 jam ke user + lembaga)

---

## Constraints

- Solo developer, limited budget
- Must launch within 4–6 weeks
- Hosting on existing Contabo VPS (Europe)
- Payment gateway must support Indonesian methods (VA, QRIS, e-Wallet)

---

## Risks

| Risk | Mitigation |
|------|-----------|
| OpenAI API costs higher (GPT-4o vs mini) | Cache results by inputHash; document upload only on paid tier |
| Low conversion from preview to paid | Make 1–2 paragraph teaser compelling — hint at problems without revealing them |
| Document breach / UU PDP violation | 6-layer security architecture: ClamAV + AES-256 + memory-only processing + auto-delete + audit log |
| DompetX integration delay | Build payment flow last; use mock webhook in dev |
| AI result accuracy questioned | Add disclaimer: "indicative only, not a guarantee" |
| GDPR compliance complexity | Server di Eropa = GDPR applies by default; OpenAI DPA covers sub-processing |
