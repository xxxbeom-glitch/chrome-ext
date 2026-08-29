-- Message-level Vault schema
-- Keeps legacy vault_conversations/bookmarks intact for rollback; new runtime writes vault_items.

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_conversation_id text not null,
  source_url text,
  source_conversation_title text not null,
  source_message_id text,
  source_message_key text not null,
  role text not null check (role in ('user', 'assistant', 'system', 'tool', 'unknown')),
  message_ordinal integer not null,
  content jsonb not null,
  captured_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_conversation_id, source_message_key)
);

create index if not exists vault_items_user_updated_idx
  on public.vault_items (user_id, updated_at desc);

create index if not exists vault_items_source_message_idx
  on public.vault_items (user_id, source_conversation_id, source_message_key);

alter table public.vault_items enable row level security;

create policy vault_items_select_own
  on public.vault_items for select
  using (auth.uid() = user_id);

create policy vault_items_insert_own
  on public.vault_items for insert
  with check (auth.uid() = user_id);

create policy vault_items_update_own
  on public.vault_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy vault_items_delete_own
  on public.vault_items for delete
  using (auth.uid() = user_id);
