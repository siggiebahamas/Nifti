-- Round 28 (NOT yet applied: the database connection was down when this was written).
-- Optional: one call for the founder dashboard numbers. The app already works without it,
-- by counting from admin_businesses(). Apply when convenient.
create or replace function public.admin_growth() returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare out jsonb;
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can do this.'; end if;
  select jsonb_build_object(
    'total', (select count(*) from businesses b where not b.is_outside),
    'free', (select count(*) from businesses b where not b.is_outside and public.business_plan(b.id) = 'free'),
    'pro', (select count(*) from businesses b where not b.is_outside and public.business_plan(b.id) = 'pro'),
    'business', (select count(*) from businesses b where not b.is_outside and public.business_plan(b.id) = 'business'),
    'pending_payments', (select count(*) from upgrade_requests where status = 'pending'),
    'help_unread', (select count(*) from support_messages where not from_admin and read_at is null)) into out;
  return out;
end $$;
revoke all on function public.admin_growth() from public, anon;
grant execute on function public.admin_growth() to authenticated;
