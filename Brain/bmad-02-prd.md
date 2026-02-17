# Product Requirements Document (PRD)
# GetDocuFlight – AI Visa Predictor

**Version:** 2.0  
**Status:** Final — Ready for Development  
**Updated:** Free/paid tier logic, document upload (Opsi C), saran perbaikan format, compliance

---

## 1. Overview

GetDocuFlight's AI Visa Predictor allows travelers to submit their visa application profile and receive an AI-generated approval probability score.

**Free tier:** Submit form → receive 1–2 paragraph teaser result (curiosity-driven, no score/breakdown).

**Paid tier ($5.00 USD):** Unlock full result immediately from form data — approval score, factor breakdown, saran perbaikan (general summary + specific per-factor). Optionally upload documents within 24 hours for re-analysis with higher accuracy.

---

## 2. User Personas

### Persona 1: First-Time Visa Applicant
- Name: Rina, 26, Bandung
- Situation: Applying for Japan tourist visa for the first time
- Pain: Doesn't know if her profile is strong enough; scared of rejection
- Goal: Understand her chances before spending money on the application
- Behavior: Mobile-first, pays via GoPay or OVO

### Persona 2: Experienced Traveler, New Destination
- Name: Budi, 34, Jakarta
- Situation: Has visited Singapore and Malaysia, now applying for Schengen visa
- Pain: Has travel history but unsure if it's enough for Europe
- Goal: Get a breakdown of which factors strengthen or weaken his application
- Behavior: Desktop user, comfortable paying via Virtual Account

---

## 3. Functional Requirements

### FR-01: User Authentication
- Users can register with email and password
- Users can log in with email and password
- Session persists via Auth.js JWT
- Guest checkout is NOT supported in MVP (user must be logged in to submit)

### FR-02: Predictor Form
The form collects the following fields:

| Field | Type | Options |
|-------|------|---------|
| Passport nationality | Dropdown | All countries |
| Destination country | Dropdown | All countries |
| Passport type | Radio | Regular / E-Passport / Official / Diplomatic |
| Travel purpose | Radio | Tourism / Business / Education |
| Prior travel history | Multi-select | List of countries |
| Employment status | Radio | Employed / Self-employed / Student / Unemployed |
| Monthly income (USD) | Number input | — |
| Bank balance (USD) | Number input | — |
| Prior visa refusal | Toggle | Yes / No |
| Intended departure date | Date picker | — |

All fields are required. Form validates client-side and server-side (Zod).

### FR-03: Scoring Engine (Form-Based)
Two-stage process, runs on form submission (free and paid):

**Stage 1 – Rule-based (local, no API call):**
- Prior Schengen / US / UK / JP visa: +15 pts
- Employed full-time: +10 pts
- Bank balance ≥ 3× estimated trip cost: +10 pts
- Prior visa refusal: −20 pts
- Unemployed: −10 pts
- Same nationality as destination country: handled as special case

**Stage 2 – AI Assessment (OpenAI GPT-4o):**
- Rule-based score + full form input sent to AI
- AI returns: final score (0–100), riskLevel, teaser (1–2 paragraphs), recommendation text, factors array
- Result cached in Redis by inputHash (TTL: 1 hour)
- Result saved to PostgreSQL (Prediction table, isPaid: false initially)

### FR-04: Free Preview (1–2 Paragraph Teaser)
After form submission, user sees:

- **Teaser text (1–2 paragraphs):** AI-generated, hints at key issues without revealing specifics
  - Good example: *"Profil kamu menunjukkan beberapa kekuatan, namun ada faktor penting yang perlu diperhatikan sebelum mengajukan visa Jepang. Kondisi keuangan kamu perlu dievaluasi lebih lanjut, dan ada satu elemen dalam riwayat perjalanan yang kemungkinan memengaruhi keputusan petugas imigrasi."*
  - Bad example (jangan begini): *"Saldo tabungan kamu terlalu rendah dan kamu tidak punya visa sebelumnya."* — terlalu spesifik, tidak ada incentive untuk bayar
- Score, risk level, factors, dan recommendations: **hidden / blurred**
- CTA: **"Lihat Hasil Lengkap + Saran Perbaikan → $5.00 (Rp ~83.000\*)"**
- Note: *"\*Jumlah IDR berdasarkan kurs hari ini"*

### FR-05: Payment ($5.00 USD Dynamic IDR)
- Price canonical: **$5.00 USD**, displayed in both USD and IDR
- IDR = `$5.00 × kurs_hari_ini` via freecurrencyapi.com, cached Redis TTL 1 jam
- Display: *"Rp 83.902 (kurs: 1 USD = Rp 16.780)"*
- Payment methods: QRIS / VA (BCA, BNI, BRI, Mandiri) / GoPay / OVO / DANA / ShopeePay
- Order created: status PENDING, `amountUSD: 5.00`, `amountIDR`, `exchangeRate`
- DompetX webhook validated via HMAC before DB write
- On confirmed payment: Order → COMPLETED, Prediction.isPaid = true
- Email sent via Resend: *"Hasil prediksi visa kamu sudah siap"*

### FR-06: Full Result (Immediately After Payment)
User sees full result **langsung dari form data** tanpa perlu upload dokumen dulu:

**Bagian 1 — Score & Risk:**
- Approval score (large, prominent): e.g., 72/100
- Risk level badge: LOW (green) / MEDIUM (yellow) / HIGH (red)

**Bagian 2 — Factor Breakdown:**
- 3–5 baris tabel: nama faktor, impact (positive / neutral / negative), detail text
- Contoh:
  | Faktor | Impact | Detail |
  |--------|--------|--------|
  | Riwayat Perjalanan | ✅ Positif | Pernah ke Singapura dan Malaysia memperkuat profil |
  | Kondisi Keuangan | ⚠️ Perlu Perhatian | Saldo lebih rendah dari threshold ideal |
  | Status Pekerjaan | ✅ Positif | Karyawan tetap meningkatkan kredibilitas |

**Bagian 3 — Saran Perbaikan (dua format):**

*Format A — General Summary:*
Numbered list 3–4 poin: "3 hal utama yang perlu diperkuat sebelum apply"

*Format B — Breakdown Spesifik per Faktor:*
Per faktor yang bermasalah, AI memberikan angka/detail konkret:
- *"Saldo tabungan kamu sekitar $2.800. Untuk visa Schengen 14 hari, idealnya minimal $4.200 (€30.000 coverage + biaya hidup). Pertimbangkan menambah Rp 15–20 juta sebelum apply."*
- *"Kamu belum pernah punya visa negara maju. Coba apply visa Malaysia/Thailand dulu untuk membangun track record."*

**Bagian 4 — Upload CTA (Opsi C):**
- Banner: *"Tingkatkan akurasi dengan upload dokumen keuangan — tersedia selama 23 jam 45 menit lagi"*
- Countdown timer (24 jam dari waktu pembayaran)
- Tombol: "Upload Dokumen untuk Re-Analisis"

**Bagian 5 — Disclaimer:**
*"Hasil ini bersifat indikatif dan bukan jaminan persetujuan visa."*

### FR-07: Document Upload + Re-Analysis (Opsi C)
Available only to paid users, within 24 hours of payment.

**Dokumen yang boleh diupload:**

| Dokumen | Sifat | Yang AI Lakukan |
|---------|-------|----------------|
| Rekening koran 3 bulan | **Paling penting** | Baca pola transaksi, saldo, konsistensi pemasukan |
| Surat keterangan kerja | Penting | Verifikasi nama perusahaan, posisi, masa kerja |
| Slip gaji | Opsional | Konfirmasi konsistensi antara form vs dokumen |
| Halaman visa/cap paspor | Opsional | Ekstrak travel history aktual |

**Dokumen yang TIDAK boleh diupload (tidak diperlukan, risiko terlalu tinggi):**
- ❌ KTP / NIK — semua data bisa diisi di form
- ❌ Paspor halaman biodata — nama + masa berlaku cukup dari form
- ❌ Bukti tiket / hotel — cukup centang "ada/tidak" di form

**Flow upload:**
1. User klik "Upload Dokumen"
2. Tampil **Consent Screen** (wajib centang semua sebelum lanjut):
   ```
   ☐ Saya memahami dokumen saya akan dianalisis oleh OpenAI (berbasis di Amerika Serikat)
     hanya untuk tujuan prediksi visa ini.
   ☐ Saya memahami dokumen disimpan di server Eropa yang tunduk pada GDPR.
   ☐ Dokumen saya akan dihapus otomatis 24 jam setelah analisis selesai.
   ☐ Saya dapat meminta penghapusan dokumen kapan saja melalui dashboard.
   ```
3. Upload file (PDF/JPG/PNG, max 10MB per file, max 4 file total)
4. Server: malware scan (ClamAV) → enkripsi AES-256 → kirim ke OpenAI (memory only) → update prediction
5. User dapat hasil re-analysis: updated score + revised recommendations dengan konteks dokumen
6. Dashboard menampilkan countdown: *"Dokumen kamu akan dihapus dalam 18 jam 32 menit"*

**Re-analysis result format:**
Sama dengan FR-06, ditambah:
- Badge: "✓ Diverifikasi dengan dokumen"
- Catatan per faktor yang berubah setelah dokumen diproses

### FR-08: User Dashboard
- Lihat semua prediksi (destination, tanggal, risk level, status bayar)
- Prediksi berbayar: tombol "Lihat Hasil" + tombol "Upload Dokumen" (jika < 24 jam)
- Prediksi belum bayar: tombol "Unlock Hasil"
- Tombol **"Hapus Dokumen Saya"** — menghapus semua file dari storage + membatalkan deletion job
- Countdown timer dokumen (jika ada dokumen aktif)

### FR-09: Document Auto-Delete
- 24 jam setelah re-analysis selesai: file dihapus dari MinIO
- Encryption key dihapus dari PostgreSQL
- Job dijadwalkan via Redis queue saat upload
- Jika user minta hapus manual: eksekusi segera, batalkan scheduled job
- Audit log mencatat: `{ action: "delete", fileId, userId, reason, timestamp, ip }`

### FR-10: Order Expiry
- Unpaid orders expire after 24 hours
- Expired orders: user must submit form again

---

## 4. Non-Functional Requirements

### NFR-01: Performance
- API response untuk form submission: < 5 detik (AI call included)
- API response untuk document re-analysis: < 15 detik (document parsing + AI)
- Page load (LCP): < 2.5 detik on 3G connection
- Redis cache hit: < 100ms

### NFR-02: Security
- All API routes behind auth middleware
- DompetX webhook HMAC signature validated before any DB write
- Input sanitized and validated via Zod on every API route
- **Document security 6-layer:**
  1. Pre-upload: ClamAV malware scan
  2. Storage: AES-256 encryption per-user key, key stored separately from file
  3. Processing: decrypt in memory only, never write plaintext to disk
  4. Auto-delete: 24 hours post-analysis via Redis job queue
  5. Audit log: every file access logged
  6. User control: manual delete anytime from dashboard
- No KTP, NIK, passport biometric page — not collected, not stored
- Nomor paspor (dari halaman visa/cap) extracted for travel history only, not stored in DB

### NFR-03: Compliance
- UU PDP No. 27/2022: explicit consent, hak hapus, breach notification 3×24 jam
- GDPR: server Contabo Europe, audit trail, data minimization
- OpenAI DPA: wajib ditandatangani sebelum production
- Privacy Policy: menyebutkan server Eropa, OpenAI sebagai sub-processor, retensi 24 jam

### NFR-04: Reliability
- OpenAI failures: fallback ke rule-based score, user notified "hasil estimasi"
- Payment webhook: idempotent handler (same webhook processed once)
- Document processing failure: file tetap dihapus dalam 24 jam meski AI gagal proses

### NFR-05: Accessibility
- Form usable on mobile (min: 375px)
- Semua form fields ada label
- Error messages dalam Bahasa Indonesia

---

## 5. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-01 | Visitor | Register an account | I can use the predictor |
| US-02 | Logged-in user | Fill in my visa profile | I can get a prediction |
| US-03 | Logged-in user | See 1–2 paragraph preview for free | I can decide if it's worth paying |
| US-04 | Logged-in user | Pay $5.00 (in IDR) | I can see my full result immediately |
| US-05 | Paying user | See general summary + specific recommendations | I know exactly what to improve |
| US-06 | Paying user | Upload rekening koran within 24 hours | I can get a more accurate re-analysis |
| US-07 | Paying user | See countdown before my documents are deleted | I feel safe about my sensitive data |
| US-08 | Any user | Delete my documents immediately | I have full control over my data |
| US-09 | Paying user | Receive email with my full result | I have a record of it |
| US-10 | Returning user | View my past predictions | I can re-access results I've paid for |

---

## 6. Out of Scope (MVP)

- Free visa checker
- Dummy ticket booking
- Stripe payment integration
- Multi-language (Indonesian UI only for MVP)
- Admin panel
- Social / OAuth login
- Bulk predictions
- API access for third parties

---

## 7. Acceptance Criteria (Definition of Done)

**Core flow:**
- [ ] User can register, log in, log out
- [ ] Form submits and returns 1–2 paragraph teaser within 5 seconds
- [ ] Teaser visible; score, breakdown, recommendations hidden/blurred
- [ ] DompetX payment completes and immediately shows full result from form
- [ ] Full result includes: score, risk level, 3–5 factors, general summary, specific recommendations per factor
- [ ] Confirmation email sent after payment
- [ ] Full result accessible in dashboard indefinitely after payment

**Document upload (Opsi C):**
- [ ] Upload button appears only for paid users within 24-hour window
- [ ] Consent screen shown and all 4 checkboxes must be confirmed before upload
- [ ] ClamAV malware scan runs before file is stored
- [ ] Files encrypted AES-256 with per-user key
- [ ] Re-analysis completes within 15 seconds
- [ ] Re-analysis result shows updated score + "✓ Diverifikasi dengan dokumen" badge
- [ ] Countdown timer visible in dashboard
- [ ] Manual delete button works — file removed from MinIO + key removed from DB
- [ ] Auto-delete fires 24 hours after re-analysis completes
- [ ] Audit log records every file access event

**Compliance:**
- [ ] KTP and passport biometric page cannot be uploaded (file type / flow restriction)
- [ ] Privacy Policy mentions server location (Europe/GDPR) + OpenAI as sub-processor
- [ ] OpenAI DPA signed before production deployment

**General:**
- [ ] Expired unpaid orders show "session expired" message
- [ ] All API routes return appropriate error codes
- [ ] Mobile-responsive on 375px
