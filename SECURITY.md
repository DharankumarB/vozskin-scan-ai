# Security and privacy notes

VozSkin handles a health-adjacent workflow. Treat images, questionnaire answers, screening results, and reports as sensitive personal information. This repository is a technical foundation, not a compliance certification or clinical release.

## Current limitations

- No validated model or AI explanation provider is connected.
- The scan preview does not persist consent, upload images, or save questionnaire answers.
- The browser-side image check is a crude technical heuristic. It cannot assess skin visibility, obstruction, image suitability for a clinical model, or medical risk.
- The in-memory rate limiter is best-effort per process and is not sufficient for a horizontally scaled production deployment.
- The included migration and access controls require independent Supabase/PostgreSQL security review and integration testing.
- Terms and privacy pages are product copy / placeholders, not legal advice or final agreements.

Do not process real patient data in preview mode or market this build as a validated clinical screening service.

## Secrets

- Keep `SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY`, and provider credentials server-only.
- The service-role key bypasses RLS. Never import `lib/supabase/admin.ts` into a client component, return a key in an API response, or log it.
- Use separate project credentials for development, staging, and production. Rotate exposed credentials immediately.
- `.env*` local files are ignored by Git; keep the sanitized `.env.example` current.

## Authentication and authorization

- Browser and server sessions use Supabase SSR cookies. Protected routes require a verified Supabase user when auth is configured.
- `/admin` is independently checked in the Next.js proxy and again in server components/API handlers. Access is granted only to the configured `ADMIN_EMAIL`, a server-managed `profiles.role`, or Supabase `app_metadata.role` set by a trusted server process. Never trust editable `user_metadata` or frontend-only role checks.
- The default profile trigger assigns `user`; the role-protection trigger blocks authenticated self-promotion.
- `/clinic` requires a clinic/admin server-verified role, and patient rows are additionally gated by explicit, unexpired `patient_access` grants and RLS.
- Admin APIs use the service-role key only after re-verifying the authenticated user and admin entitlement.
- Test account takeover, recovery email configuration, session expiration, and role changes before deployment.

## Database and storage

- Apply and review `supabase/migrations/202609290001_initial_schema.sql` in a non-production project first.
- Keep RLS enabled on every health-related table. Never rely on UI filtering.
- The `skin-images`, `reports`, and `avatars` buckets are private. Avoid public URLs; use short-lived signed URLs only after an owner/clinic RLS check.
- Storage paths must be generated server-side and start with the owning user ID. Never accept an arbitrary object path from the browser for signing or deletion.
- Model output tables intentionally have no authenticated client `INSERT` policy. Trusted server inference is responsible for result writes.
- Admin analytics views contain aggregate data only and are granted to `service_role`, not `anon` or `authenticated`.
- Deletion removes relevant private storage objects before deleting the database record. Verify cascade and partial-failure behavior in a test project and reconcile orphaned objects operationally.

## API protections

- Mutation handlers validate same-origin `Origin` or `Referer`, authenticate from Supabase cookies, validate input, return generic error codes, and set `Cache-Control: no-store` where appropriate.
- Screening inputs/outputs are validated with Zod. The current screening endpoint returns `AI_MODEL_NOT_CONNECTED`; it does not generate or persist a result.
- Rate limiting currently uses an in-memory map. Replace it with a shared, atomic store such as managed Redis or a gateway-level limiter before production.
- Configure request/body limits, upload scanning, signed-URL expiry, and upstream model timeouts at the deployment boundary.
- Review CSRF, XSS, dependency vulnerabilities, CSP, SSRF, logging, and security headers in the actual Vercel/Supabase configuration. Never log passwords, API keys, raw images, or unnecessary health details.

## Health-AI safety

- No diagnosis, treatment, medication, dosage, or emergency response is generated.
- A future result must always say it is AI-assisted screening information, not a diagnosis, and should be reviewed with a qualified healthcare professional.
- Do not conflate probability, model confidence, and accuracy. No clinical accuracy claim may be displayed without appropriate validation evidence.
- No heatmap should appear unless generated and validated by the exact deployed vision model.
- If the image quality gate fails, model output is malformed, input is out of distribution, or uncertainty is unsafe, abstain and do not force a prediction.
- Keep result explanations grounded in validated structured model output; the language model must never create the underlying medical prediction.

## Incident response

Before production, define a monitored security contact, incident triage owner, credential rotation plan, backup/restore test, breach response process, access review cadence, retention schedule, and deletion verification procedure. Ensure operational logs are access-controlled and exclude raw image data and unnecessary health content.
