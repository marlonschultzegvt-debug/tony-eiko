-- Tony & Eiko Hair Studio App - base Supabase
-- Versao: 2026-07-16
-- Objetivo: login real, permissoes por perfil, servicos, equipe e agenda.

create extension if not exists "pgcrypto";

create table if not exists public.business_settings (
  id text primary key default 'main',
  business_name text not null default 'Tony & Eiko Hair Studio',
  whatsapp text,
  address text,
  instagram text,
  confirmation_note text,
  opening_time time not null default '09:00',
  closing_time time not null default '18:00',
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes in (15, 30, 45, 60)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_settings_singleton check (id = 'main')
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('client', 'staff', 'admin')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id text primary key,
  name text not null,
  category text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id text primary key,
  profile_id uuid unique references public.profiles(id) on delete set null,
  name text not null,
  role_description text,
  initials text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professional_services (
  professional_id text not null references public.professionals(id) on delete cascade,
  service_id text not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (professional_id, service_id)
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  professional_id text not null references public.professionals(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_valid_time check (ends_at > starts_at)
);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  professional_id text references public.professionals(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint blocked_slots_valid_time check (ends_at > starts_at)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_profile_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  professional_id text not null references public.professionals(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  value_cents integer not null check (value_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'completed', 'declined', 'cancelled')),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_time check (ends_at > starts_at)
);

create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id text not null references public.services(id) on delete restrict,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now(),
  primary key (appointment_id, service_id)
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists services_active_sort_idx on public.services (active, sort_order, name);
create index if not exists professionals_active_sort_idx on public.professionals (active, sort_order, name);
create index if not exists appointments_starts_at_idx on public.appointments (starts_at);
create index if not exists appointments_professional_starts_at_idx on public.appointments (professional_id, starts_at);
create index if not exists appointments_client_profile_idx on public.appointments (client_profile_id);
create index if not exists availability_professional_weekday_idx on public.availability_slots (professional_id, weekday);
create index if not exists blocked_slots_professional_time_idx on public.blocked_slots (professional_id, starts_at, ends_at);
create unique index if not exists appointments_no_double_booking_idx
on public.appointments (professional_id, starts_at)
where status in ('pending', 'accepted', 'completed');
create unique index if not exists availability_unique_slot_idx
on public.availability_slots (professional_id, weekday, starts_at, ends_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('staff', 'admin'), false)
$$;

create or replace function public.user_professional_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.professionals where profile_id = auth.uid() and active = true limit 1
$$;

drop trigger if exists business_settings_updated_at on public.business_settings;
create trigger business_settings_updated_at before update on public.business_settings
for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists professionals_updated_at on public.professionals;
create trigger professionals_updated_at before update on public.professionals
for each row execute function public.set_updated_at();

drop trigger if exists availability_slots_updated_at on public.availability_slots;
create trigger availability_slots_updated_at before update on public.availability_slots
for each row execute function public.set_updated_at();

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.business_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_services enable row level security;
alter table public.availability_slots enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;

drop policy if exists "settings public read" on public.business_settings;
create policy "settings public read" on public.business_settings
for select to anon, authenticated using (true);

drop policy if exists "settings admin write" on public.business_settings;
create policy "settings admin write" on public.business_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles self staff admin read" on public.profiles;
create policy "profiles self staff admin read" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_staff_or_admin());

drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "services public read" on public.services;
create policy "services public read" on public.services
for select to anon, authenticated using (active = true or public.is_staff_or_admin());

drop policy if exists "services admin write" on public.services;
create policy "services admin write" on public.services
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "professionals public read" on public.professionals;
create policy "professionals public read" on public.professionals
for select to anon, authenticated using (active = true or public.is_staff_or_admin());

drop policy if exists "professionals admin write" on public.professionals;
create policy "professionals admin write" on public.professionals
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "professional services public read" on public.professional_services;
create policy "professional services public read" on public.professional_services
for select to anon, authenticated using (true);

drop policy if exists "professional services admin write" on public.professional_services;
create policy "professional services admin write" on public.professional_services
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "availability public read" on public.availability_slots;
create policy "availability public read" on public.availability_slots
for select to anon, authenticated using (active = true or public.is_staff_or_admin());

drop policy if exists "availability admin write" on public.availability_slots;
create policy "availability admin write" on public.availability_slots
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "blocked slots staff admin read" on public.blocked_slots;
drop policy if exists "blocked slots visible for scheduling" on public.blocked_slots;
create policy "blocked slots visible for scheduling" on public.blocked_slots
for select to anon, authenticated using (true);

drop policy if exists "blocked slots staff admin write" on public.blocked_slots;
create policy "blocked slots staff admin write" on public.blocked_slots
for all to authenticated
using (public.is_admin() or professional_id = public.user_professional_id())
with check (public.is_admin() or professional_id = public.user_professional_id());

drop policy if exists "appointments role read" on public.appointments;
create policy "appointments role read" on public.appointments
for select to authenticated
using (
  public.is_admin()
  or client_profile_id = auth.uid()
  or professional_id = public.user_professional_id()
);

drop policy if exists "appointments client create" on public.appointments;
create policy "appointments client create" on public.appointments
for insert to authenticated
with check (
  client_profile_id = auth.uid()
  or public.is_staff_or_admin()
);

drop policy if exists "appointments staff admin update" on public.appointments;
create policy "appointments staff admin update" on public.appointments
for update to authenticated
using (public.is_admin() or professional_id = public.user_professional_id())
with check (public.is_admin() or professional_id = public.user_professional_id());

drop policy if exists "appointment services role read" on public.appointment_services;
create policy "appointment services role read" on public.appointment_services
for select to authenticated
using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and (
        public.is_admin()
        or a.client_profile_id = auth.uid()
        or a.professional_id = public.user_professional_id()
      )
  )
);

drop policy if exists "appointment services create with appointment" on public.appointment_services;
create policy "appointment services create with appointment" on public.appointment_services
for insert to authenticated
with check (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and (a.client_profile_id = auth.uid() or public.is_staff_or_admin())
  )
);

drop policy if exists "appointment services staff admin update" on public.appointment_services;
create policy "appointment services staff admin update" on public.appointment_services
for all to authenticated
using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and (public.is_admin() or a.professional_id = public.user_professional_id())
  )
)
with check (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and (public.is_admin() or a.professional_id = public.user_professional_id())
  )
);
