CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  new_business_id uuid;
  meta jsonb := new.raw_user_meta_data;
  invite_id uuid;
  biz_invite record;
  new_biz_type text;
  claim_biz businesses;
  inviter_type text;
begin
  select id into invite_id from team_members
    where lower(email) = lower(new.email) and status = 'invited' and auth_user_id is null
    order by created_at asc limit 1;
  if invite_id is not null then
    update team_members set auth_user_id = new.id, status = 'active' where id = invite_id;
    return new;
  end if;

  if coalesce(meta->>'claim_code', '') <> '' then
    select * into claim_biz from businesses where claim_code = meta->>'claim_code' and is_outside limit 1;
    if claim_biz.id is not null then
      update businesses set is_outside = false, claim_code = null,
        name = coalesce(nullif(btrim(meta->>'business_name'), ''), name)
        where id = claim_biz.id;
      insert into team_members (business_id, name, email, roles, auth_user_id, status)
        values (claim_biz.id, coalesce(meta->>'full_name', split_part(new.email,'@',1)), new.email, array['Owner'], new.id, 'active');
      insert into business_settings (business_id) select claim_biz.id where not exists (select 1 from business_settings where business_id = claim_biz.id);
      insert into notification_settings (business_id) select claim_biz.id where not exists (select 1 from notification_settings where business_id = claim_biz.id);
      insert into tax_profiles (business_id, business_name) select claim_biz.id, coalesce(nullif(btrim(meta->>'business_name'), ''), claim_biz.name) where not exists (select 1 from tax_profiles where business_id = claim_biz.id);
      insert into subscriptions (business_id) select claim_biz.id where not exists (select 1 from subscriptions where business_id = claim_biz.id);
      insert into referrals (business_id) select claim_biz.id where not exists (select 1 from referrals where business_id = claim_biz.id);
      if claim_biz.created_by_business is not null then
        if claim_biz.type = 'buyer' then
          insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.id, claim_biz.created_by_business) on conflict do nothing;
        else
          insert into conversations (buyer_business_id, supplier_business_id) values (claim_biz.created_by_business, claim_biz.id) on conflict do nothing;
        end if;
      end if;
      return new;
    end if;
  end if;

  new_biz_type := coalesce(meta->>'business_type', 'buyer');
  insert into businesses (name, type) values (coalesce(meta->>'business_name', 'New Business'), new_biz_type) returning id into new_business_id;
  insert into team_members (business_id, name, email, roles, auth_user_id, status)
  values (new_business_id, coalesce(meta->>'full_name', split_part(new.email,'@',1)), new.email, array['Owner'], new.id, 'active');
  insert into business_settings (business_id) values (new_business_id);
  insert into notification_settings (business_id) values (new_business_id);
  insert into tax_profiles (business_id, business_name) values (new_business_id, meta->>'business_name');
  insert into subscriptions (business_id) values (new_business_id);
  insert into referrals (business_id) values (new_business_id);

  select * into biz_invite from business_invites
    where lower(invited_email) = lower(new.email) and status = 'pending'
    order by created_at asc limit 1;
  if biz_invite.id is not null then
    update business_invites set status = 'accepted', accepted_at = now() where id = biz_invite.id;
    select type into inviter_type from businesses where id = biz_invite.inviting_business_id;
    if new_biz_type = 'supplier' and inviter_type = 'buyer' then
      insert into business_relationships (buyer_business_id, supplier_business_id) values (biz_invite.inviting_business_id, new_business_id) on conflict do nothing;
      insert into conversations (buyer_business_id, supplier_business_id) values (biz_invite.inviting_business_id, new_business_id) on conflict do nothing;
    elsif new_biz_type = 'buyer' and inviter_type = 'supplier' then
      insert into business_relationships (buyer_business_id, supplier_business_id) values (new_business_id, biz_invite.inviting_business_id) on conflict do nothing;
      insert into conversations (buyer_business_id, supplier_business_id) values (new_business_id, biz_invite.inviting_business_id) on conflict do nothing;
    end if;
  end if;
  return new;
end;
$function$


