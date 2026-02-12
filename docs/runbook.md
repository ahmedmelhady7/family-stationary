# Family Stationary Runbook

## 1. Local Development
1. Copy `.env.example` to `.env` and set real Supabase/WhatsApp values.
2. Run `npm run dev:supabase` for preflight checks.
3. Run `npm run dev` and open `http://localhost:3000`.

## 2. Quality Gates
Run in order:
1. `npm run lint`
2. `npm run test`
3. `npm run test:e2e`
4. `npm run test:a11y`
5. `npm run db:validate`
6. `npm run build`

## 3. Database
- Migrations: `supabase/migrations/*.sql` (ordered).
- Seed: `supabase/seed.sql`.
- Use `npm run db:migrate` and `npm run db:seed` sanity commands before deploying.

## 4. WhatsApp Setup (External)
1. Create Meta Business app and WhatsApp product.
2. Generate system user token and configure:
   - `WA_TOKEN`
   - `WA_PHONE_ID`
   - `WA_VERIFY_TOKEN`
   - `WA_AUTHORIZED_NUMBERS`
   - `WA_GROUP_ID`
   - `WA_ORDER_CONFIRM_TEMPLATE` (`order_confirmation_ar` or approved fallback, e.g. `order_confirmation_ar_v1`)
3. Configure webhook endpoint `/functions/v1/whatsapp-webhook`.
4. Submit and approve template `order_confirmation_ar` (or approved fallback used by `WA_ORDER_CONFIRM_TEMPLATE`).

## 5. Staging Deploy (Netlify)
1. Run `npm run build`.
2. Run `npm run deploy:staging` (contract check).
3. Upload `dist/` to Netlify or run your Netlify CI deployment step.

## 6. Production Deploy (Hetzner + Docker)
1. Run `npm run build`.
2. Run `npm run deploy:prod` (contract check).
3. Deploy `dist/` and Docker stack with `docker/docker-compose.yml`.

## 7. Rollback
- Frontend rollback: redeploy prior `dist/` artifact.
- Database rollback: apply reverse SQL for the last migration in a maintenance window.
- WhatsApp rollback: disable webhook endpoint and restore previous function deployment if malformed events occur.

## 8. Incident Notes
- If WhatsApp API is down, webhook returns controlled failure and retries should happen via queue/retry pipeline.
- If order trigger fails, replay `order-confirm` and `order-alert-group` by posting `{ "order_id": "..." }` to each function.
