-- Round 82: fairer plans (applied via MCP as migration r82_plans)
-- Free: + statements, credit_limits, late_payers, scorecard (purchase history). Pro: + spending_caps, watchdog.
-- Seats: Free 3, Pro 10, Business 30, plus subscriptions.extra_seats (₱99 each a month). Business ₱2,490 / ₱24,900.
-- See the migration body in the Supabase migration history (r82_plans): plan_features, plan_seat_limit, plan_price,
-- nifti_extra_seats, guard_team_seats (limit + extra seats), my_plan (extra_seats, extra_branches), admin_set_extras.
alter table public.subscriptions add column if not exists extra_seats int not null default 0;
alter table public.subscriptions add column if not exists extra_branches int not null default 0;
