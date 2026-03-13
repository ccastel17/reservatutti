-- Add manual frequent override for contacts (MVP)

alter table public.contacts
  add column if not exists is_frequent_override boolean not null default false;

create index if not exists contacts_school_id_is_frequent_override_idx
  on public.contacts (school_id, is_frequent_override);
