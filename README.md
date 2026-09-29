# VozSkin Scan AI

**Scan. Understand. Track.**

VozSkin Scan AI is a privacy-conscious, AI-assisted skin-screening and observation-tracking product by VozLook Studios. This repository contains a Next.js/TypeScript SaaS foundation, responsive public and workspace interfaces, Supabase authentication and authorization integration points, a private-storage/RLS schema, typed screening contracts, and explicit unavailable states.

> **Important:** No validated skin-screening model, clinical dataset, model weights, evaluation results, or clinical evidence are connected. This build intentionally does not generate a screening prediction. It must not be represented as a diagnostic or clinically validated product.

## What is implemented

- Premium responsive landing, about, how-it-works, privacy, and terms-placeholder pages.
- Email/password sign-up and login, Google OAuth initiation, email confirmation callback, forgot/reset password flow using Supabase Auth.
- Protected account routes and server-side admin/clinic checks; the UI is not the authorization boundary.
- Consent-first scan flow with JPEG/PNG/WEBP signature checks, file-size and decode/dimension checks, and clearly labeled basic local exposure/sharpness heuristics. It does **not** determine whether an image contains visible skin, obstruction, or clinically adequate content.
- Structured symptom questionnaire. In preview mode, consent, selected images, and answers stay in the current browser session and are not uploaded or saved.
- Zod input/output schemas, server-side screening API boundary, abstention on missing model, and model-version provenance fields. Invalid or untraceable model outputs are rejected.
- Account-owned history, report, result, tracking, profile, data-export, image-deletion, and account-deletion paths for a configured Supabase deployment. No sample records are shown.
- Report view with print / browser “Save as PDF” support. Private stored-report downloads use short-lived signed URLs.
- Safe assistant unavailable state and fixed medication refusal. Optional browser speech input/output controls are disclosed; there is no connected generative assistant.
- English, Tamil, Tanglish, Hindi, Telugu, Kannada, and Malayalam localization dictionaries and locale selection for shared product labels.
- Clinic workspace scoped to explicit `patient_access` grants; privacy-minimized admin overview and user-management API with server-side role checks.
- Supabase SQL migration with RLS, private storage bucket policies, clinic authorization helper, server-only aggregate analytics views, and role-protection triggers.
- ML workspace and patient-level split/evaluation requirements. No model or patient data is included.

## Current integration state

- Supabase auth/database/storage: **not configured until environment variables and migration are applied**.
- Screening model: **not connected**. The model registry deliberately returns no adapter.
- AI explanation provider: **not connected**. `AI_API_KEY` is server-only and is not used to make a diagnosis or prediction.
- Voice input/output: browser-native APIs only; support and processing behavior varies by browser.
- Clinic authorizations: no patient records are visible without an explicit `patient_access` row.
- Accuracy, clinical evaluation, inference performance, and drift: **not available**; no values are fabricated.

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app binds to `0.0.0.0` for hosted previews. With the empty `.env.local`, public pages and the scan preview work, while auth, persistent records, clinic/admin data, model results, and storage remain unavailable. The scan preview never sends the selected image to an API.

### Environment variables

| Variable | Used for | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser/server RLS client | Public; RLS is mandatory |
| `SUPABASE_SERVICE_ROLE_KEY` | Trusted server operations, admin views, account deletion, authorized signed URLs | **Server-only secret** |
| `ADMIN_EMAIL` | Server-verified initial admin account (default value in `.env.example`) | Server-only |
| `AI_API_KEY` | Reserved for a future server-side explanation/model integration | **Server-only; unused in this build** |
| `NEXT_PUBLIC_MAX_IMAGE_SIZE_MB` | Local upload limit; clamped to the 10 MB storage/schema maximum | Public configuration |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL for deployment documentation/configuration | Public configuration |
| `DEPLOYMENT_VERSION` | Optional deployment label in admin model monitoring | Server-only |

Never prefix service-role or AI secrets with `NEXT_PUBLIC_`. Do not commit `.env.local`.

## Supabase setup

1. Create separate Supabase projects for development, staging, and production.
2. Configure email/password auth and Google OAuth. Add the app origin and `/auth/callback` to Supabase redirect URLs. Configure a verified sender for confirmation and password-reset email.
3. Apply `supabase/migrations/202609290001_initial_schema.sql` to the chosen project.
4. Set the public Supabase URL/anon key and server-only service-role key in the local/deployment environment.
5. Set `ADMIN_EMAIL` to the verified initial admin email. The server checks this value; ordinary users cannot set their own role. Do not grant admin from user metadata.
6. Assign clinic roles and create `patient_access` grants only through a trusted administrative process. The clinic UI alone never grants access.
7. Verify the buckets are private (`skin-images`, `reports`, `avatars`) and test the included storage RLS policies with separate user accounts before adding real data.
8. Verify signup creates a `profiles` row with role `user`, and that a normal authenticated user cannot edit `role`, read another user’s rows, access private objects, or call admin APIs.

Use the SQL file as a starting point and have a Supabase/PostgreSQL security reviewer inspect RLS, storage policies, role assignment, retention, backups, and account-deletion behavior before production.

## Screening integration contract

- Runtime request contract: `lib/screening/schema.ts`.
- Runtime output contract: `ScreeningOutputSchema` in the same file.
- Model interface: `lib/ai/interface.ts`.
- Model registry: `lib/ai/registry.ts` (intentionally returns `null`).
- Server route: `app/api/screening/route.ts` (origin check, auth, rate limit, schema validation, and no-model response).
- ML scaffold and model-governance requirements: `ml/`.

A future adapter must accept a server-controlled private image reference, perform validated quality gating, produce traceable model output, validate its response, persist the complete session/image/questionnaire/model-version chain, and abstain on uncertainty. The current scan wizard does not upload raw bytes or create a database result. Do not enable production predictions by returning hard-coded values or by asking a language model to inspect an image.

## Data, privacy, and safety

- The scan preview’s file inspection runs in the browser; it is a basic technical heuristic, not clinical image validation.
- Preview consent and answers are ephemeral and are not audited or persisted. Do not use preview mode for real patient data.
- Persistent image processing is intentionally gated until the private upload pipeline and validated model adapter are connected.
- The report page always displays the required non-diagnosis disclaimer. A missing or malformed result is not rendered as a prediction.
- Result probability, model confidence, and clinical accuracy are distinct; no accuracy is currently available.
- Review `SECURITY.md` and `DEPLOYMENT.md` before connecting real accounts or records.

## Commands

```bash
npm run dev        # Local development server
npm run lint       # ESLint
npm run typecheck  # Strict TypeScript check
npm run test       # Vitest unit tests
npm run build      # Production build
npm run start      # Production server
```

The tests cover request/output schema validation and origin/rate-limit helpers. Supabase RLS, OAuth, private storage, clinic access, admin authorization, mobile behavior, and deletion flows still require integration testing against isolated Supabase projects.
