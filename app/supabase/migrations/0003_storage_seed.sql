insert into storage.buckets (id, name, public) values
  ('documenti', 'documenti', false),
  ('contenuti-ai', 'contenuti-ai', false)
on conflict (id) do nothing;

create policy team_storage_all on storage.objects for all to authenticated
  using (bucket_id in ('documenti','contenuti-ai') and public.is_allowed())
  with check (bucket_id in ('documenti','contenuti-ai') and public.is_allowed());

insert into public.allowed_users (email, note) values
  ('innovazione@timevision.it', 'admin interno'),
  ('espedito.delgaudio@timevision.it', 'test email')
on conflict (email) do nothing;

with az as (
  insert into public.aziende (ragione_sociale, piva, email, is_test)
  values ('ALFA LOGISTICA SRL (TEST)', 'IT00000000001', 'espedito.delgaudio@timevision.it', true)
  on conflict (piva) do update set updated_at = now()
  returning id
)
insert into public.documenti (azienda_id, tipo)
select az.id, t from az cross join unnest(array[
  'Visura camerale',
  'Documento identità legale rappresentante',
  'Elenco dipendenti + mansioni',
  'Ultimo bilancio depositato',
  'Accordo sindacale firmato',
  'Piano orario formativo'
]) as t
on conflict do nothing;
