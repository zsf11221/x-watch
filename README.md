# X Watch

X Watch monitors public X accounts with the official X API, stores indexed post IDs in Supabase, and reports new and unavailable posts.

## Setup

1. Deploy the Next.js app.
2. Run `supabase/schema.sql` in your Supabase SQL editor.
3. Add server-only environment variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `X_BEARER_TOKEN`, and `CRON_SECRET`. Never expose them using NEXT_PUBLIC_.
4. Set `MAX_ACCOUNTS` (default 20).
5. Schedule an authenticated GET request to `/api/cron` using the header `Authorization: Bearer <CRON_SECRET>`. Keep scheduling frequency within your X API and hosting plan limits.

### Status semantics
- **New:** first seen by the monitor, not necessarily just published.
- **Suspected unavailable:** lookup failed for this ID once.
- **Unavailable:** the exact ID could not be resolved in two independent rechecks. This is NOT proof of deliberate deletion.
- Errors, rate limits and API outages do not change post status.

The app initially loads without credentials but cannot monitor until configured. Public addition has a database-backed per-IP rate limit; use WAF and CAPTCHA if usage grows. The app intentionally does not redistribute previously captured text once a post becomes unavailable. Review X Developer Policy before public launch and set spend limits.

This repository contains an implementation, not proof that API/data access has been verified.
