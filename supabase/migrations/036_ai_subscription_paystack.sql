alter table public.ai_subscriptions
add column if not exists paystack_customer_code text,
add column if not exists paystack_subscription_code text,
add column if not exists paystack_email_token text,
add column if not exists paystack_authorization_code text;

create unique index if not exists ai_subscriptions_paystack_code on public.ai_subscriptions (paystack_subscription_code)
where
  paystack_subscription_code is not null;