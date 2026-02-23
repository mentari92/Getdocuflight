# START HERE — GetDocuFlight AI Visa Predictor
## Panduan Memulai di Antigravity + BMAD Method
## Version 3.0 — 4 Products (AI Predictor $5, Flight $10, Bundle $20, Smart Navigator FREE)

---

## Langkah 1: Setup Folder Project

Struktur folder yang sudah ada / yang perlu dibuat di Antigravity:

```
getdocuflight/
├── Brain/
│   ├── bmad-01-project-brief.md       ← v2.0 (upload dari zip ini)
│   ├── bmad-02-prd.md                 ← v2.0 (upload dari zip ini)
│   ├── bmad-03-architecture.md        ← v2.0 (upload dari zip ini)
│   └── bmad-04-epics-and-stories.md   ← v2.0 (upload dari zip ini)
├── .env.example                       ← template (upload dari zip ini)
├── .env                               ← buat sendiri dari .env.example, isi nilainya
└── (kode dibuat oleh agent)
```

**Cara upload ke Antigravity:**
1. Extract zip ini
2. Upload semua file ke Antigravity — timpa file lama di folder `Brain/`
3. Taruh `.env.example` di root project
4. Buat file `.env` baru dari template, isi nilainya (lihat Langkah 5)

---

## Langkah 2: Status Story & Urutan Build

### Epic 1: Foundation ← MULAI DI SINI jika fresh
- [ ] **Story 1.1** — Docker + Prisma + Redis + MinIO + ClamAV setup
- [ ] **Story 1.2** — Database schema & migration (semua tabel termasuk documents, encryption_keys, audit_logs)
- [ ] **Story 1.3** — Email/password auth dengan Auth.js

### Epic 2: Predictor Form & Scoring
- [ ] **Story 2.1** — Form UI (10 fields, react-hook-form + Zod)
- [ ] **Story 2.2** — Scoring engine (rule-based + OpenAI GPT-4o)
- [ ] **Story 2.3** — Free preview (1-2 paragraph teaser — bukan risk level saja)

### Epic 3: Payment & Full Result
- [ ] **Story 3.1** — DompetX payment + dynamic IDR conversion
- [ ] **Story 3.2** — DompetX webhook handler + result unlock
- [ ] **Story 3.3** — Full result display (score + factors + saran perbaikan dua format)

### Epic 4: Document Upload & Re-Analysis ← FITUR UTAMA BARU
- [ ] **Story 4.1** — Document upload infrastructure (ClamAV + AES-256 + MinIO + audit log)
- [ ] **Story 4.2** — Consent screen (4 checkbox wajib sebelum upload)
- [ ] **Story 4.3** — Document upload UI (rekening koran, surat kerja, slip gaji, visa stamps)
- [ ] **Story 4.4** — Re-analysis result (updated score + saran spesifik dari dokumen)

### Epic 5: Live Chat & Dummy Flight/Bundle
- [ ] **Story 5.1** — Live Chat widget + Admin panel
- [ ] **Story 5.2** — Order Form + Payment for Dummy Flight ($10) & Bundle Flight+Hotel ($20)
- [x] **Story 5.5** — Smart Navigator (AI Visa Checker + Itinerary) Lead Magnet

---

## Langkah 3: Prompt Pertama ke Antigravity

Jika **fresh start (belum ada kode):**
```
Read all docs in the /Brain folder, especially 
bmad-03-architecture.md and bmad-04-epics-and-stories.md.

Implement Story 1.1 – Project Setup & Infrastructure:
- Docker Compose dengan: Next.js, PostgreSQL 16, Redis, MinIO, ClamAV, Nginx
- lib/db.ts (Prisma singleton)
- lib/redis.ts (ioredis singleton)
- lib/storage.ts (MinIO client)
- .env.example dengan semua variabel
- Nginx proxies ke Next.js port 3000
- Semua services di internal Docker network

Tech stack LOCKED — jangan ubah. Referensi architecture.md untuk semua keputusan.
```

Jika **sudah selesai Story 1.2** (seperti screenshot):
```
Read all updated docs in /Brain folder — docs telah diupdate ke v2.0.

Key changes dari v1.0 ke v2.0:
- AI model: GPT-4o-mini → GPT-4o (butuh vision untuk baca dokumen)
- Free tier: risk level only → 1-2 paragraph teaser
- Paid tier: tambah document upload dalam 24 jam (Opsi C)
- 3 tabel DB baru akan dibutuhkan di Epic 4: documents, encryption_keys, audit_logs
- Docker services baru di Epic 4: MinIO (aktif), ClamAV
- Server: Contabo Europe (GDPR compliance)

Untuk sekarang, lanjut dengan Story 1.3 (Auth) — belum ada perubahan yang perlu dilakukan.
Docs v2.0 paling penting saat kita masuk Epic 4.

Implement Story 1.3 – Email/Password Authentication:
- /register page dengan email + password form
- /login page
- Auth.js v5 dengan Credentials provider
- Password di-hash dengan bcrypt (min 12 rounds)
- JWT strategy
- middleware.ts protects semua /dashboard/* routes
- Redirect ke /dashboard setelah login
```

---

## Langkah 4: Prompt Template per Story

Untuk setiap story, gunakan format ini:

```
Read Brain/bmad-03-architecture.md dan Brain/bmad-04-epics-and-stories.md.

Implement [NOMOR STORY] – [NAMA STORY]:

[paste acceptance criteria dari epics-and-stories.md]

Rules:
- Ikuti folder structure di architecture.md Section 2
- TypeScript strict mode
- Semua DB operations lewat lib/db.ts
- Semua Redis operations lewat lib/redis.ts
- Semua file storage operations lewat lib/storage.ts
- Validasi semua API input dengan Zod
- Error messages dalam Bahasa Indonesia
```

---

## Langkah 5: Environment Variables

Buat file `.env` di root project, isi berdasarkan `.env.example`.

**Wajib sebelum Story 1.1:**
```
DATABASE_URL="postgresql://getdocuflight:password@postgres:5432/getdocuflight_db"
NEXTAUTH_SECRET="hasil: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

**Wajib sebelum Story 2.2:**
```
OPENAI_API_KEY="sk-..."
# PENTING: Pakai GPT-4o, bukan GPT-4o-mini (butuh vision untuk Epic 4)
```

**Wajib sebelum Story 3.1:**
```
DOMPETX_API_KEY=""
DOMPETX_SECRET_KEY=""
DOMPETX_WEBHOOK_SECRET=""
DOMPETX_BASE_URL="https://sandbox.dompetx.com"
FREECURRENCY_API_KEY=""
```

**Wajib sebelum Story 3.2:**
```
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@getdocuflight.com"
```

**Wajib sebelum Story 4.1:**
```
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin123"
MINIO_BUCKET_NAME="getdocuflight-documents"
MINIO_USE_SSL="false"
DOCUMENT_ENCRYPTION_MASTER_KEY="hasil: openssl rand -base64 32"
```

---

## Langkah 6: Perubahan Penting Saat Masuk Epic 4

Sebelum mulai Story 4.1, kasih tahu agent:

```
Kita akan mulai Epic 4 — Document Upload & Re-Analysis.

Sebelum coding, buat Prisma migration baru untuk 3 tabel baru:
1. documents (fileType, storagePath, encryptionKeyId, status, scheduledDeleteAt)
2. encryption_keys (userId, documentId, encryptedKey)
3. audit_logs (action, fileId, userId, purpose, ipAddress, timestamp)

Lihat bmad-03-architecture.md Section 3 untuk schema lengkapnya.

Setelah migration berhasil, baru implement Story 4.1.
```

---

## Referensi Cepat

| Dokumen | Isi |
|---------|-----|
| `bmad-01-project-brief.md` | Problem, target user, MVP scope, 4 products (AI $5, Flight $10, Bundle $20, Smart Navigator FREE), compliance |
| `bmad-02-prd.md` | All FR & NFR, user stories, live chat, dummy ticket/hotel, acceptance criteria |
| `bmad-03-architecture.md` | Folder structure, DB schema, API design, security layers, ADRs |
| `bmad-04-epics-and-stories.md` | 5 epics, 13 stories, build order checklist |

---

## Tips Antigravity

- **Plan mode** untuk story kompleks: Story 2.2, 3.1, 3.2, 4.1, 4.4
- **Fast mode** untuk story straightforward: Story 1.1, 1.3, 2.1, 4.2, 4.3
- Setelah tiap story selesai → review acceptance criteria sebelum lanjut
- Jika agent buat keputusan teknis yang tidak sesuai → tunjuk ke ADR yang relevan di architecture.md
- **Epic 4 butuh MinIO + ClamAV running** — pastikan Docker services sudah up sebelum test

---

## Hal Penting yang TIDAK Boleh Diupload User

Ini sudah dikunci di arsitektur — agent tidak boleh buat fitur upload untuk:
- ❌ KTP / NIK
- ❌ Paspor halaman biodata (foto + nomor paspor)

Yang boleh diupload hanya:
- ✅ Rekening koran (3 bulan)
- ✅ Surat keterangan kerja
- ✅ Slip gaji
- ✅ Halaman visa & cap paspor (bukan halaman biodata)
