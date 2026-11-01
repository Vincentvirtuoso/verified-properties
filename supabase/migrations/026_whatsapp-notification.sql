
create or replace function public.is_company_pro(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from company_subscriptions s
    where s.company_id = p_company_id
      and (
        (s.status = 'trialing' and s.trial_ends_at > now())
        or (s.status in ('active', 'canceled') and s.current_period_end > now())
        or (s.status = 'past_due' and s.grace_until > now())
      )
  );
$$;

revoke all on function public.is_company_pro(uuid) from public;

create or replace function public.set_whatsapp_notifications(
  p_company_id uuid,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text;
begin
  if not exists (
    select 1 from company_members
    where company_id = p_company_id
      and user_id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only the company owner can change this.' using errcode = '42501';
  end if;

  if not public.is_company_pro(p_company_id) then
    raise exception 'WhatsApp notifications are available on Pro.' using errcode = '42501';
  end if;

  select whatsapp_number into v_number
  from companies
  where id = p_company_id;

  if p_enabled and coalesce(v_number, '') = '' then
    raise exception 'Add a WhatsApp number first.' using errcode = '22023';
  end if;

  update companies
  set features = coalesce(features, '{}'::jsonb)
    || jsonb_build_object('whatsappNotifications', p_enabled)
  where id = p_company_id;
end;
$$;

revoke all on function public.set_whatsapp_notifications(uuid, boolean) from public;
grant execute on function public.set_whatsapp_notifications(uuid, boolean) to authenticated;