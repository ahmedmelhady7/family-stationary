# Plan-008: Admin Security and Upload Hardening

> Technical implementation plan for [PRD-008](file:///Users/hadi/.codex/worktrees/c06a/family-stationary/docs/prds/PRD-008-admin-security-and-upload-hardening.md)

---

## Architecture

### 1) Admin Authorization Hardening

**Source of truth**: database/storage policy, not UI checks.

```sql
-- admin allowlist
create table if not exists public.admin_users (
  email text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- immutable-ish audit table for admin mutations
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_email text not null,
  action text not null,
  target_table text not null,
  target_id text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and au.is_active = true
  );
$$;
```

### Policy Changes

- Replace permissive policy from PRD-003 (`auth.role() = 'authenticated'`)
- Enforce `public.is_admin()` on:
  - `public.products` (all write operations; read policy can stay business-defined)
  - `public.categories` (write operations)
  - `storage.objects` for `products` bucket (insert/update/delete)

Example:

```sql
create policy "products admin write"
on public.products
for all
using (public.is_admin())
with check (public.is_admin());
```

### UI/Auth Guard

- Keep Supabase magic link sign-in
- Add guard: `session exists` + `rpc('is_admin') === true` before enabling admin pages/actions
- Treat `403` from API/storage as hard authorization failure and redirect to admin login/error state

---

## Upload Reliability Design

### Upload Flow

```text
Select image
-> validate type/size/count
-> normalize/compress client-side (max 1600px)
-> uploadWithRetry (maxAttempts=3, exponential backoff)
-> on success, PATCH product image list
-> on PATCH failure, delete uploaded object
-> write admin_audit_log entry
```

### Reliability Controls

- Deterministic storage path: `product-images/{productId}/{timestamp}-{rand}.webp`
- Abortable uploads using `AbortController`
- Transient error retry only (`429`, `5xx`, network failure)
- Preserve form state and surface actionable retry messaging

### Cleanup Strategy

- Implement command/script to detect and remove orphaned image objects
- Define orphan as storage object under `product-images/` not referenced by any product row

---

## Threat and Risk Controls Mapping

| Risk ID | Threat                                         | Implementation Control |
| ------- | ---------------------------------------------- | ---------------------- |
| R1      | Non-admin user updates products                | `public.is_admin()` policies on DB/storage |
| R2      | Unsupported/malicious upload payloads          | Client/server validator + MIME/size checks |
| R3      | Partial write leaves broken product image refs | Cleanup-on-failure attach flow |
| R4      | Unattributed admin changes                     | `admin_audit_log` writes on mutations |

---

## Migration, Rollout, Rollback

### Migration Sequence

1. Add new tables/functions (`admin_users`, `admin_audit_log`, `public.is_admin()`)
2. Seed founder/admin emails
3. Replace RLS/storage policies with hardened versions
4. Deploy UI/service changes for auth guard + upload hardening

### Rollout

1. Staging verification with admin + non-admin accounts
2. Production rollout in low-traffic window
3. 24-hour monitoring for auth denials and upload error ratio

### Rollback

1. Revert uploader code path if needed while keeping hardened policies enabled
2. Forward-fix SQL policy issues; do not reintroduce broad authenticated write policy
3. Temporarily disable image editing if upload regressions persist

---

## Verification Commands

```bash
npm run dev:supabase
npm run db:migrate
npm run lint
npm run test
npm run test:e2e
```

Optional targeted checks:

```bash
npm run test:e2e -- --grep "admin"
npm run test:e2e -- --grep "upload"
```

---

## Test Coverage Expectations

- Unit tests for auth guard, admin check wrapper, upload validator, retry logic, and cleanup handler
- Integration tests for RLS and storage policy enforcement with allowlisted vs non-allowlisted users
- Integration tests for upload attach cleanup when DB patch fails
- E2E tests for:
  - allowlisted admin can edit and upload
  - non-allowlisted user is denied on UI and API paths
  - upload retry/failure surfaces clear recovery UX
- Coverage gates on touched admin auth/upload modules: >= 90% lines, >= 85% branches

---

## Dependencies

| Dependency                      | Source PRD |
| ------------------------------- | ---------- |
| Product management dashboard    | PRD-003    |
| Product image model conventions | PRD-001    |
| i18n/a11y admin UX baseline     | PRD-007    |
