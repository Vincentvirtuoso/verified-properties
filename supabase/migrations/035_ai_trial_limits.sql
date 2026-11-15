
alter table public.ai_subscriptions
  add column if not exists trial_chat_used int not null default 0;

-- Called by the server before each assistant reply during a trial.
-- Returns false once the owner has used all 50 messages or the trial has ended.
create or replace function public.consume_trial_chat(p_owner_type text, p_owner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  update public.ai_subscriptions
  set trial_chat_used = trial_chat_used + 1,
      updated_at = now()
  where owner_type = p_owner_type
    and owner_id = p_owner_id
    and status = 'trialing'
    and trial_ends_at > now()
    and trial_chat_used < 50
  returning true into v_ok;

  return coalesce(v_ok, false);
end;
$$;

-- Server only. Buyers and owners cannot call this directly.
revoke execute on function public.consume_trial_chat(text, uuid) from public, anon, authenticated;