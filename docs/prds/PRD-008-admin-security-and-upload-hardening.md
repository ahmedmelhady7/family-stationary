# PRD-008: Admin Security and Upload Hardening

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Author**       | Family Stationary Team |
| **Status**       | Draft                  |
| **Priority**     | P0                     |
| **Created**      | 2026-02-13             |
| **Last Updated** | 2026-02-13             |

---

## 1. Overview

### 1.1 Problem Statement

Two production-critical issues are currently open in the admin dashboard:

1. Product image upload is unreliable (failed uploads, partial saves, unclear recovery path)
2. Admin authorization is insecure (`authenticated` users can edit products even if not approved admins)

These defects create direct business risk: catalog data can be modified by unauthorized users, and product updates are blocked or inconsistent when image uploads fail.

### 1.2 Goals

- Enforce strict admin-only access for all product/category write paths
- Make image upload reliable, observable, and recoverable without data corruption
- Keep admin UX simple (magic link remains acceptable) while hardening backend authorization

### 1.3 Non-Goals

- Full RBAC (editor/reviewer/owner) in this phase
- Replacing Supabase Auth provider
- Building a full digital asset management system

---

## 2. Functional Requirements

### 2.1 Admin Access Control

| Req ID | Requirement                                                                                                 | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------- | -------- |
| AS-01  | Only allowlisted and active admin emails can access admin write operations                                 | P0       |
| AS-02  | Authorization must be enforced at database/storage layer via `public.is_admin()` (deny by default)        | P0       |
| AS-03  | Non-admin authenticated users attempting admin writes receive `403` and no side effects                    | P0       |
| AS-04  | Admin UI must verify session + admin status before rendering editable actions                              | P0       |
| AS-05  | All admin product mutations (create/update/delete/image attach/remove) must write an audit log entry      | P1       |
| AS-06  | Admin access revocation (set inactive) must take effect immediately for new requests after token refresh   | P1       |

### 2.2 Product Image Upload Reliability

| Req ID | Requirement                                                                                  | Priority |
| ------ | -------------------------------------------------------------------------------------------- | -------- |
| UP-01  | Validate image MIME/type/size/count before upload (JPG, PNG, WebP; max 5MB each by default) | P0       |
| UP-02  | Normalize image dimensions client-side before upload (target max 1600px)                    | P1       |
| UP-03  | Upload flow must retry transient failures with bounded exponential backoff (max 3 attempts) | P0       |
| UP-04  | Product record updates only after object upload success; failed DB update must cleanup object | P0       |
| UP-05  | Uploaded objects must use deterministic product-scoped paths and metadata for traceability   | P0       |
| UP-06  | Admin gets actionable error messages and retry option without losing form state              | P0       |
| UP-07  | Orphaned object cleanup path (scheduled or command-based) must be documented and testable    | P1       |

---

## 3. Non-Functional and Security Requirements

| Req ID | Requirement                                                                                         | Target                     |
| ------ | --------------------------------------------------------------------------------------------------- | -------------------------- |
| NFS-01 | Unauthorized write attempts against admin tables/storage are blocked                                | 100% blocked               |
| NFS-02 | Upload success rate for valid images on stable network                                              | >= 99%                     |
| NFS-03 | Upload latency (5MB max input after normalization)                                                  | P95 <= 6s                  |
| NFS-04 | Observability for upload and auth failures (structured logs with request/user context)             | Required                   |
| NFS-05 | No inconsistent product image references after failed upload/write flows                            | 0 unresolved in tests      |
| NFS-06 | Security posture for admin writes remains enforced even if client UI checks are bypassed           | Required                   |

---

## 4. Threat and Risk Controls

| Control ID | Threat / Risk                                         | Control                                                                                                   | Verification |
| ---------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------ |
| TRC-01     | Any authenticated user can edit catalog               | Replace broad `authenticated` RLS with `public.is_admin()` checks on admin data paths                    | Integration tests for allowlisted vs non-allowlisted users |
| TRC-02     | Direct Storage API abuse by non-admin users           | Restrict `storage.objects` product bucket policies to `public.is_admin()` and allowed MIME/extensions    | Storage policy tests + manual API probes |
| TRC-03     | Malicious or unsupported file uploads                 | Client/server validation for type, size, and file signature; reject unsupported payloads                 | Unit tests for validator edge cases |
| TRC-04     | Partial writes (object uploaded, DB reference failed) | Transaction-like attach flow with explicit cleanup on failure                                             | Integration test forces DB failure and asserts object cleanup |
| TRC-05     | Unauthorized changes are not attributable             | Append-only admin audit log for mutation actions                                                         | Audit log assertions in integration/e2e tests |

---

## 5. Acceptance Criteria

- Non-allowlisted email login cannot perform admin writes through UI, REST, or storage APIs (`403`/policy deny).
- Allowlisted admin can perform normal product CRUD and category updates.
- Uploading a valid image persists both storage object and product reference, with no duplicate object on retry.
- Simulated transient upload failure recovers within retry budget or returns clear failure with no dangling DB reference.
- Admin audit records are created for product update and image attach/remove events.
- Regression tests confirm existing storefront product rendering still works with newly uploaded images.

---

## 6. Migration, Rollout, and Rollback

### 6.1 Migration

1. Add `admin_users` allowlist table, `admin_audit_log` table, and `public.is_admin()` helper.
2. Replace existing admin-related RLS/storage policies with deny-by-default + `public.is_admin()` checks.
3. Backfill active founder/admin emails before enabling enforcement in production.
4. Introduce upload hardening utilities and migration-safe metadata/path conventions.

### 6.2 Rollout

1. Deploy to staging with at least one allowlisted admin and one non-admin test user.
2. Run verification commands and manual security smoke tests.
3. Deploy production during low-traffic window.
4. Monitor auth deny events and upload failure rate for first 24 hours.

### 6.3 Rollback

1. If upload UX regresses, revert to previous uploader implementation while keeping hardened auth policies in place.
2. If migration fails, roll back application code and patch migration forward; do not restore broad `authenticated` write access.
3. If critical incident occurs, disable admin image edits temporarily and retain read-only admin access until fixed.

---

## 7. Verification Commands

```bash
npm run dev:supabase
npm run db:migrate
npm run lint
npm run test
npm run test:e2e
npm run test:a11y
```

Manual verification must include both allowlisted and non-allowlisted accounts and at least one forced upload failure scenario.

---

## 8. Test Coverage Expectations

- Unit: auth guard, admin check client wrapper, upload validator, retry/backoff utility, cleanup helper.
- Integration: RLS/storage policy enforcement, upload attach rollback cleanup, audit log writes.
- E2E: authorized admin happy path, unauthorized user denial path, upload retry/failure UX.
- Coverage threshold: changed admin auth/upload modules must maintain >= 90% line coverage and >= 85% branch coverage.
- Security regression tests for this PRD are mandatory in CI before merge.

---

## 9. Dependencies

| Dependency                             | Source PRD |
| -------------------------------------- | ---------- |
| Product dashboard and existing auth flow | PRD-003    |
| Product catalog image rendering         | PRD-001    |
| i18n/a11y foundations for admin UX      | PRD-007    |
