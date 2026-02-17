# GetDocuFlight — AI Visa Predictor

Predict your visa approval chances with AI. Get personalized recommendations to strengthen your application.

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache / Queue | Redis 7 |
| Auth | Auth.js v5 (NextAuth) |
| AI | OpenAI GPT-4o |
| Payment | DompetX (Indonesian methods) |
| Email | Resend |
| File Storage | MinIO (AES-256 encrypted) |
| Malware Scan | ClamAV |
| Reverse Proxy | Nginx |

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone & install

```bash
git clone <repository-url>
cd getdocuflight
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start infrastructure services

```bash
docker compose up -d postgres redis minio clamav
```

This starts:
- **PostgreSQL 16** — main database
- **Redis 7** — caching + document deletion queue
- **MinIO** — encrypted document storage (console: http://localhost:9001)
- **ClamAV** — malware scanning (port 3310)

The MinIO init service will automatically create the `getdocuflight-documents` bucket.

### 4. Database setup

```bash
# For local dev, override DATABASE_URL to use localhost
DATABASE_URL="postgresql://getdocuflight:localdev123@localhost:5432/getdocuflight" npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 5. Run dev server

```bash
DATABASE_URL="postgresql://getdocuflight:localdev123@localhost:5432/getdocuflight" npm run dev
```

Open http://localhost:3000

### 6. Production (Docker)

```bash
docker compose up -d
```

All 6 services (app, postgres, redis, minio, clamav, nginx) start together with health checks.

## Project Structure

```
getdocuflight/
├── app/
│   ├── (auth)/          # Login, register pages
│   ├── (dashboard)/     # Dashboard + predictions
│   ├── (marketing)/     # Landing page + predictor form
│   └── api/             # API routes
├── components/          # Reusable UI components
├── lib/                 # Server utilities (auth, db, redis, etc.)
├── prisma/              # Schema + migrations
├── nginx/               # Nginx config
└── scripts/             # Setup scripts
```

## Database Schema

9 tables, 6 enums. See `prisma/schema.prisma` for details.

| Table | Purpose |
|---|---|
| User, Account, Session, VerificationToken | Auth.js |
| Prediction | AI visa predictions |
| Order | Payment records |
| Document | Uploaded files (encrypted) |
| EncryptionKey | Per-file AES-256 keys |
| AuditLog | Security audit trail |

## Environment Variables

See `.env.example` for all required variables with documentation.

## License

Private — All rights reserved.
