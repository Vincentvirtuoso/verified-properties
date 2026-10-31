create table if not exists ai_faqs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 200),
  answer text not null check (char_length(answer) between 1 and 1000),
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_faqs_company_position
  on ai_faqs (company_id, position);

alter table ai_faqs enable row level security;

-- Members can read the company's FAQs
create policy "members read faqs"
  on ai_faqs for select
  using (
    exists (
      select 1 from company_members m
      where m.company_id = ai_faqs.company_id
        and m.user_id = auth.uid()
    )
  );

-- Only admins change FAQs
create policy "admins write faqs"
  on ai_faqs for all
  using (
    exists (
      select 1 from company_members m
      where m.company_id = ai_faqs.company_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from company_members m
      where m.company_id = ai_faqs.company_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

  -- Anyone can read FAQs that are switched on
create policy "public read enabled faqs"
  on ai_faqs for select
  to anon, authenticated
  using (enabled = true);

-- An enabled FAQ must have an answer
alter table ai_faqs
  add constraint ai_faqs_enabled_has_answer
  check (not enabled or char_length(trim(answer)) > 0);