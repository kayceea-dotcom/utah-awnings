-- Installer profiles: a new "installer" role, jobs assigned to an installer, and
-- the finished-job checklist + photos they fill in.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

-- 1) Allow "installer" as a profile role. Handles whichever way profiles.role
--    was defined (a plain text column with a CHECK constraint, or an enum).
do $$
declare
  c record;
  col_udt text;
begin
  select udt_name into col_udt
    from information_schema.columns
   where table_schema = 'public' and table_name = 'profiles' and column_name = 'role';

  if col_udt in ('text', 'varchar', 'bpchar') then
    for c in
      select conname from pg_constraint
       where conrelid = 'public.profiles'::regclass
         and contype = 'c'
         and pg_get_constraintdef(oid) ilike '%role%'
    loop
      execute format('alter table public.profiles drop constraint %I', c.conname);
    end loop;
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin', 'manager', 'sales_rep', 'installer'));
  else
    execute format('alter type public.%I add value if not exists %L', col_udt, 'installer');
  end if;
end $$;

-- 2) Per-job installer assignment and progress. Stored on the quote itself.
alter table public.quotes add column if not exists installer_id uuid references public.profiles(id);
alter table public.quotes add column if not exists install_checklist jsonb not null default '{}'::jsonb;
alter table public.quotes add column if not exists install_photos jsonb not null default '[]'::jsonb;
alter table public.quotes add column if not exists install_completed_at timestamptz;

create index if not exists quotes_installer_id_idx on public.quotes (installer_id);

-- 3) Installers save their progress through these two functions rather than a
--    general UPDATE on quotes, so they can only ever touch the checklist and
--    photos of a job that is assigned to them (and not once it's finished).
create or replace function public.installer_save_progress(
  p_quote_id uuid, p_checklist jsonb, p_photos jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.quotes
     set install_checklist = coalesce(p_checklist, '{}'::jsonb),
         install_photos = coalesce(p_photos, '[]'::jsonb)
   where id = p_quote_id
     and installer_id = auth.uid()
     and install_completed_at is null;
  if not found then
    raise exception 'This job is not assigned to you, or it is already finished';
  end if;
end $$;

create or replace function public.installer_finish_job(
  p_quote_id uuid, p_checklist jsonb, p_photos jsonb
) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  done_at timestamptz := now();
begin
  if p_checklist is null
     or exists (select 1 from jsonb_each(p_checklist) where value <> 'true'::jsonb) then
    raise exception 'Every checklist item must be checked';
  end if;
  if p_photos is null or jsonb_array_length(p_photos) < 1 then
    raise exception 'Add at least one photo of the finished job';
  end if;
  update public.quotes
     set install_checklist = p_checklist,
         install_photos = p_photos,
         install_completed_at = done_at
   where id = p_quote_id
     and installer_id = auth.uid()
     and install_completed_at is null;
  if not found then
    raise exception 'This job is not assigned to you, or it is already finished';
  end if;
  return done_at;
end $$;

revoke all on function public.installer_save_progress(uuid, jsonb, jsonb) from public;
revoke all on function public.installer_finish_job(uuid, jsonb, jsonb) from public;
grant execute on function public.installer_save_progress(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.installer_finish_job(uuid, jsonb, jsonb) to authenticated;
