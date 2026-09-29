# Deployment guide

The target frontend is Vercel with Supabase PostgreSQL, Auth, and private Storage. Use separate projects/environments for **development**, **staging**, and **production**; never copy production patient data into local or preview environments.

## Vercel setup

1. Import the Git repository into Vercel and use the existing Next.js defaults.
2. Set Node.js 20 or newer.
3. Add the sanitized values from `.env.example` in the correct Vercel environment. Add secrets only to the server environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `ADMIN_EMAIL`
   - `AI_API_KEY` (server only; unused until a provider adapter exists)
   - optional `NEXT_PUBLIC_MAX_IMAGE_SIZE_MB` (maximum 10 MB)
   - optional `NEXT_PUBLIC_APP_URL` and `DEPLOYMENT_VERSION`
4. Add the production origin and `/auth/callback` to Supabase Auth’s redirect allowlist. Add staging and local origins only to their respective Supabase projects.
5. Configure a verified email sender, password recovery redirect, and Google OAuth provider in Supabase Auth. Use the Vercel URL/domain for the provider callback as required by Supabase.
6. Apply the SQL migration to the staging project, review every RLS/storage policy, then apply the reviewed migration to production through a controlled migration process.
7. Confirm the app builds and the CI checks pass. Deploy staging first and run the verification checklist below.

## Required pre-launch integration work

This repository is **not a clinical production release** while the following are incomplete:

- A validated screening model and server-only model adapter are connected and clinically/governance reviewed. `lib/ai/registry.ts` currently returns `null` by design.
- A private upload pipeline validates image bytes and writes under server-generated user-scoped storage paths. The current scan flow does not upload or persist its selected image.
- Consent, sessions, images, assessments, model outputs, and reports are persisted in one traceable, RLS-protected flow.
- Shared/distributed rate limiting, model timeouts, request limits, error telemetry, inference timing, evaluation metrics, and alerting are operational.
- Terms, privacy disclosures, retention policy, legal basis, clinical intended-use language, and any regional regulatory obligations have been reviewed by qualified professionals.
- Independent accessibility, mobile/tablet/desktop, security, privacy, and clinical workflow testing is complete.

Do not add production medical data until these gates are addressed.

## Supabase checks

- Enable email/password auth and Google OAuth only if configured; set secure redirect allowlists.
- Run the migration and verify the buckets remain private.
- Verify the signup trigger creates a `user` profile. Assign `clinic` and `admin` roles through a trusted server/administrative procedure only.
- Set `ADMIN_EMAIL` on the server to the verified initial admin account. The app independently checks it server-side; do not create an admin toggle in client profile settings.
- Create patient grants only after explicit authorization and check expiration handling.
- Test with at least two ordinary accounts, one clinic account, and one admin account. Confirm cross-user SELECT/UPDATE/DELETE and storage access fail at the database/storage layer.
- Test deletion against a non-production project, including partial object deletion and account deletion. Confirm backups/retention behavior matches the published policy.

## Build and runtime

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

Vercel runs the Next.js production build automatically. Keep the service-role and AI keys out of browser bundles, build logs, analytics, and source maps. Use the Vercel preview environment only with staging Supabase credentials and synthetic non-medical test fixtures.

## Post-deploy verification

1. Open `/` and public legal/privacy pages on desktop and mobile widths.
2. Confirm `/dashboard`, `/scan`, `/history`, `/tracking`, `/assistant`, `/reports`, and `/profile` redirect unauthenticated users to `/login` when Supabase is configured.
3. Test signup, confirmation callback, password login, Google OAuth, forgot password, reset password, and logout.
4. Confirm an unprivileged user receives HTTP `403` for `/admin`, `/admin/model`, `/admin/users`, and `/clinic` as applicable.
5. Verify owner-only rows and private storage with two independent accounts; test clinic authorization boundaries and expiry.
6. Check the scan consent gate, invalid/corrupt/oversized image rejection, image preview clearing, and mobile camera picker. Confirm the image is not uploaded while the model/upload pipeline is unavailable.
7. Confirm the screening endpoint returns an explicit unavailable response until a real adapter is connected. Confirm malformed model outputs are rejected and no fake session/result is inserted.
8. Test history deletion, JSON data export, image deletion, and account deletion in a staging project.
9. Confirm admin charts show only actual aggregates, and all unconnected clinical metrics read “Not available”.
10. Review Vercel/Supabase logs for sensitive-data leakage, monitor dependency advisories, and verify backups, alerts, and incident contacts.
