create table public.aziende (
  id uuid primary key default gen_random_uuid(),
  ragione_sociale text not null,
  piva text unique,
  codice_fiscale text,
  matricola_inps text,
  email text,
  telefono text,
  fase_corrente int not null default 1 check (fase_corrente between 1 and 5),
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documenti (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid not null references public.aziende(id) on delete cascade,
  tipo text not null check (tipo in (
    'Visura camerale',
    'Documento identità legale rappresentante',
    'Elenco dipendenti + mansioni',
    'Ultimo bilancio depositato',
    'Accordo sindacale firmato',
    'Piano orario formativo'
  )),
  stato text not null default 'mancante' check (stato in ('mancante','caricato','verificato')),
  storage_path text,
  caricato_at timestamptz,
  unique (azienda_id, tipo)
);

create table public.solleciti (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid not null references public.aziende(id) on delete cascade,
  documenti_mancanti text[] not null default '{}',
  destinatario text not null,
  inviato_at timestamptz not null default now(),
  esito text not null default 'inviato'
);

create table public.proposte (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid not null references public.aziende(id) on delete cascade,
  fonte text not null check (fonte in ('uniemens','csv','manuale')),
  fee_percent numeric not null default 25 check (fee_percent between 8 and 30),
  beneficio_totale numeric not null default 0,
  stato text not null default 'bozza' check (stato in ('bozza','inviata','accettata','rifiutata')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proposte_dipendenti (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.proposte(id) on delete cascade,
  cf text not null,
  ore_formazione numeric not null default 100,
  quota_oraria numeric not null default 0,
  contribuzione_oraria numeric not null default 0,
  beneficio numeric not null default 0
);

create table public.progetti (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid not null references public.aziende(id) on delete cascade,
  proposta_id uuid references public.proposte(id) on delete set null,
  riferimenti jsonb not null default '{}',
  documento_path text,
  created_at timestamptz not null default now()
);

create table public.corsi (
  id uuid primary key default gen_random_uuid(),
  progetto_id uuid not null references public.progetti(id) on delete cascade,
  titolo text not null,
  ore_previste numeric not null default 0,
  stato text not null default 'pianificato' check (stato in ('pianificato','in_corso','completato'))
);

create table public.contenuti_ai (
  id uuid primary key default gen_random_uuid(),
  corso_id uuid not null references public.corsi(id) on delete cascade,
  tipo text not null check (tipo in ('testo','slide','immagine','video')),
  storage_path text,
  gamma_id text,
  prompt text,
  review_status text not null default 'da_revisionare'
    check (review_status in ('da_revisionare','approvato','rifiutato')),
  job_status text not null default 'done'
    check (job_status in ('pending','running','done','failed')),
  job_error text,
  created_at timestamptz not null default now()
);

create table public.domande_governo (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid not null references public.aziende(id) on delete cascade,
  progetto_id uuid references public.progetti(id) on delete set null,
  stato text not null default 'preparazione'
    check (stato in ('preparazione','pronta','caricata','esito_ok','esito_ko')),
  scheduled_for date,
  esito text,
  log jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.presenze (
  id uuid primary key default gen_random_uuid(),
  corso_id uuid not null references public.corsi(id) on delete cascade,
  data date not null,
  ore_erogate numeric not null default 0,
  partecipanti int not null default 0
);

create table public.allowed_users (
  email text primary key,
  note text
);
