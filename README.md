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
Neon initialization created the project link and `neon.ts`. Browser CLI authorization could not finish because the cloud-browser callback timed out. The connected Neon integration was used to verify the existing PostgreSQL service and apply the committed migration instead. `neon deploy` did not complete through the CLI; no additional Neon services were needed.

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
- Production build, TypeScript checks and 22 validation/authorization tests pass.
- Dependency audit: zero vulnerabilities at verification time.
- No configured secrets were found in the compiled build; private env files and `.neon` are ignored by Git.
- Public home, fleet information, login and registration pages return HTTP 200. Signed-out dashboard, admin and partner pages redirect to login.
- The production PostgreSQL service is reachable through the authenticated Neon integration. The exact committed initial migration was tested on an isolated branch, then applied transactionally to production with its SHA-256 checksum recorded in `_prisma_migrations`.
- Isolated real-database checks passed: customer/partner/admin roles, pending defaults, fleet/listing approvals, rental insertion, overlapping-date detection, acceptance and persisted totals. Test records exist only on `ev-access-verification-20261023`, expiring October 24, 2026 at 19:30 UTC. Production has no test users or listings.
- Netlify production variables are configured as secrets: pooled `DATABASE_URL` (Builds/Functions), direct `DATABASE_URL_UNPOOLED` (Builds only), and `SESSION_SECRET` (Builds/Functions).
- Application traffic uses `ev_access_runtime`, with SELECT/INSERT/UPDATE privileges on the four application tables, no schema creation, and no migration-table access. Migrations use the separate owner connection.
- Prisma retains its existing models and uses the matching Neon driver adapter over encrypted WebSockets on Netlify. The Prisma 5 adapter requires the `driverAdapters` preview flag; local non-Neon PostgreSQL retains native connections.
- Full application-to-Neon end-to-end verification remains pending: this workspace cannot resolve/reach the database endpoint directly, including through the WebSocket driver. Database persistence tests ran through the connected Neon integration; application workflow tests use mocks.
- An unused API-created role, `ev_access_app`, received Neon's default elevated membership. Attempts to remove those permissions were denied. Its credentials are not used by the application. Delete this unused role after explicit approval; the live app secret uses the restricted SQL-created role instead.

## Remaining production requirements
Provision the owner's administrator account privately, remove the unused role after approval, and verify the deployed application from an environment with database network access: customer registration/login, fleet onboarding, admin approvals, listing submission and rental decisions. Perform simultaneous rental-request tests against PostgreSQL (serializable conflicts currently require a retry). Netlify has not been published; source uploads use `[skip netlify] [skip ci]`.

The runtime database role intentionally cannot create tables or delete rows. Future application features that need additional privileges must receive a narrowly scoped grant. Do not replace its connection with an owner credential.

Before accepting real rentals: verified insurance/business/TLC/driver checks, rental agreements and cancellation policy, secure document/photo storage, password reset and email verification, persistent login throttling, admin MFA, audit logs, monitoring/backups and privacy/support procedures. Payment collection and fleet payouts are not implemented. Supporting verification documents must not be submitted through the public listing fields.
