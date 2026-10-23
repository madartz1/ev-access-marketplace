# EV Access Marketplace

Electric vehicle rental requests and B2B fleet onboarding, built with Next.js, React, Prisma and PostgreSQL. Development MVP: no payments or confirmed reservations.

## Application
- Customer registration/login, vehicle catalog/detail pages, rental requests and dashboard.
- Fleet application, approved-partner vehicle submissions and incoming booking decisions.
- Administrator partner/listing review and marketplace counts.
- EV Access branding and responsive layouts.

## Setup
Use Node 22 or later and `npm ci`. Copy `.env.example` into a private `.env` file and replace placeholders locally. Never commit credentials. For Netlify, set secrets in project environment variables with Builds and Functions scopes.

`DATABASE_URL`: pooled Neon URL with TLS (`sslmode=require`), appropriate connection limit.
`DATABASE_URL_UNPOOLED`: direct Neon URL for migrations, same database with TLS.
`SESSION_SECRET`: cryptographically random secret of at least 32 characters.
`ADMIN_EMAIL` and `ADMIN_PASSWORD`: one-time provisioning only; password must have 12+ characters. Keep these out of browser bundles and the repository.

Existing Neon target: organization `org-frosty-hall-91761929`, project `summer-math-67084158`, branch `production`, service `postgres`. These identifiers are not credentials.

After Neon authentication, run the requested initialization and deployment:
```
npx neon@latest init -y --org-id org-frosty-hall-91761929 --project-id summer-math-67084158 --branch production --services postgres
npx neon@latest deploy
```
Neon initialization has created the local link and configuration. Google sign-in succeeded, but the CLI's account-wide OAuth consent is pending explicit approval. PostgreSQL access has not yet been verified.

Prisma CLI reads `.env`, while Next.js also reads `.env.local`. Supply both database variables privately to migration commands if Neon writes `.env.local`. Do not print credentials in command history or logs.

Test the initial migration against an isolated database before applying it to the production branch. If an existing database already has these tables, inspect and baseline its schema rather than running the initial migration blindly.

```
npm run db:migrate
npm run db:seed
npm run db:check
npm test
npm run build
npm start
```

## Netlify preparation
`netlify.toml` uses `npm run build` and `.next`; Netlify automatically provides its current Next.js runtime. Do not add a static SPA fallback. Migrations are intentionally separate from the build. No deployment was requested. Commit messages include `[skip netlify]` to prevent automatic deployment from this upload.

## Verification on October 23, 2026
- Production build, TypeScript checks and 22 tests pass.
- Dependency audit: zero vulnerabilities at verification time.
- Public home, fleet information, login and registration pages return HTTP 200.
- Signed-out dashboard, admin and partner pages redirect to login.
- Workflow tests use a mocked database: they verify authorization, validation, pricing, expired documents, overlap rejection and partner decisions, not live PostgreSQL persistence.
- Live Neon connectivity and schema verification have NOT passed; connection variables are unavailable while CLI authorization is pending.

## Remaining production requirements
Complete Neon authentication/provisioning and Netlify database secrets, test migrations, provision the administrator privately, and verify real persistence for customer registration/login, fleet onboarding, admin approvals, listing submission and rental decisions. Perform concurrent-request tests against PostgreSQL (serializable transactions can reject conflicts and currently require the customer to retry).

Before accepting real rentals: verified insurance/business/TLC/driver checks, rental agreements and cancellation policy, secure document/photo storage, password reset and email verification, persistent login throttling, admin MFA, audit logs, monitoring/backups and privacy/support procedures. Payment collection and fleet payouts are not implemented. Supporting verification documents must not be submitted through the public listing fields.
