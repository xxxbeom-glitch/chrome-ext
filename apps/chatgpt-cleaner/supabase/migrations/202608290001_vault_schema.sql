-- ChatGPT Cleaner Conversation Vault schema (Phase 5)
-- Apply to a dedicated Supabase project. No service-role usage from the extension.

create extension if not exists pgcrypto;

create table if not exists public.vault_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_conversation_id text not null,
  source_url text,
  title text not null,
  snapshot_schema_version integer not null default 1,
  snapshot jsonb not null,
  message_count integer not null,
  completeness text not null check (completeness in ('complete', 'partial')),
  captured_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_conversation_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vault_conversation_id uuid not null references public.vault_conversations (id) on delete cascade,
  source_message_id text,
  message_ordinal integer not null,
  excerpt text,
  anchor_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, vault_conversation_id, anchor_key)
);

create index if not exists vault_conversations_user_updated_idx
  on public.vault_conversations (user_id, updated_at desc);

create index if not exists bookmarks_user_vault_idx
  on public.bookmarks (user_id, vault_conversation_id);

alter table public.vault_conversations enable row level security;
alter table public.bookmarks enable row level security;

create policy vault_conversations_select_own
  on public.vault_conversations for select
  using (auth.uid() = user_id);

create policy vault_conversations_insert_own
  on public.vault_conversations for insert
  with check (auth.uid() = user_id);

create policy vault_conversations_update_own
  on public.vault_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy vault_conversations_delete_own
  on public.vault_conversations for delete
  using (auth.uid() = user_id);

create policy bookmarks_select_own
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy bookmarks_insert_own
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy bookmarks_update_own
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy bookmarks_delete_own
  on public.bookmarks for delete
  using (auth.uid() = user_id);
