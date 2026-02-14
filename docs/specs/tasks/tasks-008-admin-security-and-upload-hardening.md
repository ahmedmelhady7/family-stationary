# Tasks-008: Admin Security and Upload Hardening

> Task breakdown for [Plan-008](file:///Users/hadi/.codex/worktrees/c06a/family-stationary/docs/specs/plans/plan-008-admin-security-and-upload-hardening.md) · [PRD-008](file:///Users/hadi/.codex/worktrees/c06a/family-stationary/docs/prds/PRD-008-admin-security-and-upload-hardening.md)

---

## Phase 1: Database Security Foundation

### Task 8.1: Add admin allowlist + audit schema migration

- **Files**: `supabase/migrations/*_admin_security_hardening.sql`
- **Work**: Create `admin_users`, `admin_audit_log`, and `public.is_admin()` helper function
- **Depends on**: None
- **Verify**: `npm run db:migrate` succeeds and `public.is_admin()` returns true only for allowlisted emails

### Task 8.2: Replace permissive admin RLS/storage policies

- **Files**: `supabase/migrations/*_admin_security_hardening.sql`
- **Work**: Remove broad `authenticated` write policies; enforce `public.is_admin()` on `products`, `categories`, and product image storage bucket writes
- **Depends on**: 8.1
- **Verify**: Allowlisted user can write; non-allowlisted authenticated user receives policy deny (`403`)

### Task 8.3: Seed/bootstrap approved admin accounts

- **Files**: `supabase/seed.sql`, `docs/runbook.md` (if bootstrap steps are documented there)
- **Work**: Seed founder/admin emails and document revocation/rotation process
- **Depends on**: 8.1
- **Verify**: Fresh environment has expected admin allowlist entries

---

## Phase 2: Admin Auth Enforcement in App

### Task 8.4: Harden admin auth guard

- **Files**: `src/scripts/services/auth.js`, `src/scripts/utils/auth-guard.js`, `src/scripts/pages/admin/*.js`
- **Work**: Gate admin routes/actions on session + `is_admin()` check; fail closed on unknown state
- **Depends on**: 8.2
- **Verify**: Non-admin session cannot access editable admin pages

### Task 8.5: Add explicit unauthorized handling for API/storage calls

- **Files**: `src/scripts/services/*.js` (admin data services)
- **Work**: Normalize `401/403` handling, clear session when needed, show deterministic unauthorized state
- **Depends on**: 8.4
- **Verify**: Unauthorized requests do not leave partial UI state and do not retry indefinitely

### Task 8.6: Add audit logging hooks for product mutations

- **Files**: `src/scripts/services/admin-products.js` (or equivalent), `supabase/functions/*` (if used)
- **Work**: Ensure product create/update/delete/image attach/remove write audit events with actor + target context
- **Depends on**: 8.1, 8.5
- **Verify**: Audit log rows created for each admin mutation path

---

## Phase 3: Upload Reliability Hardening

### Task 8.7: Build upload validator + normalizer utility

- **Files**: `src/scripts/utils/image-upload.js` (or equivalent)
- **Work**: Enforce allowed MIME/types, max size, and optional client-side resize/compression before upload
- **Depends on**: None
- **Verify**: Invalid files are rejected pre-upload with clear message

### Task 8.8: Implement retryable upload service

- **Files**: `src/scripts/services/image-upload.js`
- **Work**: Add bounded exponential retry, abort support, and structured error codes
- **Depends on**: 8.7
- **Verify**: Simulated transient network failures recover within max attempts

### Task 8.9: Make product image attach flow cleanup-safe

- **Files**: `src/scripts/services/image-upload.js`, `src/scripts/services/admin-products.js`
- **Work**: Update product image reference only after successful upload; delete uploaded object if DB patch fails
- **Depends on**: 8.8
- **Verify**: Forced DB patch failure leaves no dangling object and no broken product image reference

### Task 8.10: Improve admin image upload UX states

- **Files**: `src/pages/admin/product-edit.html`, `src/scripts/pages/admin/product-edit.js`, `src/styles/pages/admin/product-edit.css`
- **Work**: Progress UI, retry affordance, non-destructive failure messaging, keep form state intact
- **Depends on**: 8.8, 8.9
- **Verify**: Admin can retry failed uploads without re-entering form data

---

## Phase 4: Verification, Tests, and Release Safety

### Task 8.11: Add unit tests for auth/upload core logic

- **Files**: `tests/unit/**/*`
- **Work**: Cover auth guard, admin checker wrapper, upload validator, retry/backoff logic
- **Depends on**: 8.4, 8.8
- **Verify**: `npm run test` passes with required coverage thresholds

### Task 8.12: Add integration tests for policy and cleanup behavior

- **Files**: `tests/integration/**/*`
- **Work**: Validate allowlisted vs non-allowlisted access and cleanup on partial failure
- **Depends on**: 8.2, 8.9
- **Verify**: Non-admin writes denied; failure path leaves no orphaned references

### Task 8.13: Add e2e regression tests for admin security + upload

- **Files**: `tests/e2e/**/*`
- **Work**: Validate full admin happy path and unauthorized denial path through UI and API boundaries
- **Depends on**: 8.10, 8.12
- **Verify**: `npm run test:e2e` passes in CI

### Task 8.14: Execute rollout and rollback drill

- **Files**: `.github/workflows/*` (if needed), `docs/runbook.md`
- **Work**: Add deploy checklist, post-deploy monitoring checks, and rollback steps specific to this hardening scope
- **Depends on**: 8.13
- **Verify**: Team can complete drill in staging without data loss or policy bypass

---

## Checkpoint: Admin Security and Upload Hardening Complete

- [ ] Non-admin authenticated users cannot mutate products/categories/images
- [ ] Allowlisted admins can perform normal dashboard operations
- [ ] Upload failures are recoverable and do not corrupt product image data
- [ ] Audit trail exists for product mutation actions
- [ ] Migration, rollout, and rollback steps documented and validated
- [ ] Security and reliability regression tests run in CI

---

## Verification Commands

```bash
npm run dev:supabase
npm run db:migrate
npm run lint
npm run test
npm run test:e2e
```

---

## Explicit Test Coverage Expectations

- Touched admin auth/upload modules: >= 90% line coverage, >= 85% branch coverage
- Mandatory suites: unit + integration + e2e for security and upload reliability paths
- Required negative tests: unauthorized write attempts, invalid file type/size, forced upload/db failure cleanup
