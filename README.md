# Family Stationary

Arabic-first Islamic e-commerce storefront for stationery products, with WhatsApp-driven product ingestion and order operations.

## Stack
- Vanilla HTML/CSS/JavaScript (ES modules)
- Supabase SQL migrations + Edge Functions contracts
- RTL-first design system and i18n structure
- PWA with offline support and install prompt

## Commands
- `npm run dev` - start local development server on port 3000
- `npm run dev:supabase` - validate Supabase local prerequisites
- `npm run dev:all` - run app + Supabase preflight
- `npm run lint` - JS/CSS/RTL/i18n policy checks
- `npm run test` - unit tests
- `npm run test:e2e` - end-to-end route and flow checks
- `npm run test:a11y` - accessibility checks
- `npm run build` - production build to `dist/`
- `npm run preview` - preview built app on port 4173
- `npm run db:migrate` - migration sanity pass
- `npm run db:seed` - seed sanity pass
- `npm run db:reset` - reset guidance and validation

## Project Structure
- `src/pages` - all storefront and admin HTML pages
- `src/styles` - design tokens, base styles, components, page styles
- `src/scripts` - modules, services, page controllers, utilities
- `src/locales/ar` - translation namespaces
- `src/workers/sw.js` - service worker
- `supabase/migrations` - SQL migrations
- `supabase/functions` - Edge Functions and shared modules
- `tests` - unit, e2e, a11y tests

## Environment
Create `.env` with:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WA_TOKEN`
- `WA_PHONE_ID`
- `WA_VERIFY_TOKEN`
- `WA_AUTHORIZED_NUMBERS`
- `WA_GROUP_ID`

## Security Notes
- No secrets in source control.
- WhatsApp webhook validates signature/verify token and authorized senders.
- Input validation enforced in Edge Function contracts and DB RPC design.

## Deployment
- Staging: Netlify (`npm run deploy:staging`)
- Production: Hetzner + Docker Compose (`npm run deploy:prod`)

## Rollback
For detailed operational steps, see `docs/runbook.md`.
- Roll back frontend by redeploying prior build artifact.
- Roll back database by applying reverse migration script generated in CI release process.
