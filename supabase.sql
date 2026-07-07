create table if not exists public.todos (
  id text primary key,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

create policy "Todos visibles para cualquiera"
on public.todos for select
using (true);

create policy "Cualquiera puede crear tareas"
on public.todos for insert
with check (true);

create policy "Cualquiera puede marcar tareas"
on public.todos for update
using (true)
with check (true);
