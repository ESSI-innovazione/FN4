create or replace function public.is_allowed()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'aziende','documenti','solleciti','proposte','proposte_dipendenti',
    'progetti','corsi','contenuti_ai','domande_governo','presenze','allowed_users'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy team_all on public.%I for all to authenticated using (public.is_allowed()) with check (public.is_allowed())', t);
  end loop;
end $$;
