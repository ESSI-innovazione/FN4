# FN4 Fase 1 — Fondamenta: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the production Next.js app with a pixel-faithful port of the mockup's login + app shell, a fully migrated & RLS-locked Supabase backend, working internal auth, and a live Vercel preview URL.

**Architecture:** New Next.js (App Router, TypeScript) workspace in `app/` inside this repo; the mockup HTML files at repo root stay untouched. Backend is the dedicated Supabase project **FN4** (`ferkvngwtiaivqpqfjmy`, eu-west-1). UI is a 1:1 technical port: the mockup's CSS is extracted verbatim, not rewritten.

**Tech Stack:** Next.js ≥15 (App Router) · TypeScript · plain CSS extracted from mockup (Tailwind NOT used in phase 1 — fidelity first) · @supabase/ssr + @supabase/supabase-js · Vitest · Vercel.

## Global Constraints

- **UI/UX unchanged**: mockup `index.html` is the visual source of truth; any visual discrepancy is a bug. Copy CSS/markup verbatim; do not "improve" anything.
- Palette tokens exactly as in `index.html` lines 16–56 (`--sky: #335C67`, `--cream: #FFF3B0`, `--bad: #9E2A2B`, `--merlot-ink: #1E4742`, ground always `#FFFFFF`, single theme, no dark mode).
- Font: Plus Jakarta Sans (via `next/font/google`), fallback stack as in mockup `--sans`.
- Supabase project: **FN4** `ferkvngwtiaivqpqfjmy` (https://ferkvngwtiaivqpqfjmy.supabase.co). Never touch project `timevision_services_hub`.
- RLS on every table, `authenticated` + allowlist only; zero anon access. Storage buckets private.
- No real company data may be inserted — only test company "ALFA LOGISTICA SRL (TEST)" (P.IVA IT00000000001).
- Git: work on branch `preview`; never merge to `main` without user approval.
- All UI copy in Italian, exactly as in the mockup.
- The mockup files (`index.html`, variants, `media/`, `assets/`) must not be modified.

**Executor note on Supabase:** schema changes are applied with the Supabase MCP tools (`mcp__claude_ai_Supabase__apply_migration`, `..._execute_sql` — load schemas via ToolSearch `select:` first), always with `project_id: ferkvngwtiaivqpqfjmy`. Also save every migration as a file under `app/supabase/migrations/` so the schema is versioned in git.

---

### Task 1: Scaffold the Next.js workspace

**Files:**
- Create: `app/` (via create-next-app), `app/vitest.config.ts`, `app/.env.local`, `app/README.md`
- Modify: `.gitignore` (root)

**Interfaces:**
- Produces: workspace `app/` with scripts `dev`, `build`, `test` (vitest). Later tasks create files under `app/src/`.

- [ ] **Step 1: Scaffold**

```powershell
npx --yes create-next-app@latest app --ts --app --no-tailwind --eslint --src-dir --use-npm --import-alias "@/*" --no-turbopack
```

(If prompted for anything else, accept defaults. `--no-tailwind`: phase 1 ports mockup CSS verbatim.)

- [ ] **Step 2: Add Vitest**

```powershell
cd app; npm i -D vitest @vitest/coverage-v8 dotenv
```

Create `app/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

Add to `app/package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 3: Env scaffold**

Create `app/.env.local` (values filled in Task 3):

```
NEXT_PUBLIC_SUPABASE_URL=https://ferkvngwtiaivqpqfjmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Ensure root `.gitignore` covers `app/.env.local` and `app/node_modules` (create-next-app adds `app/.gitignore`; verify).

- [ ] **Step 4: Verify build and test run**

Run: `cd app; npm run build` → Expected: build succeeds.
Run: `cd app; npm run test` → Expected: "No test files found" exit 0 (or passes trivially).

- [ ] **Step 5: Commit**

```powershell
git add app .gitignore; git commit -m "feat(app): scaffold Next.js workspace for the production platform"
```

---

### Task 2: Design system port (tokens + global styles + font)

**Files:**
- Create: `app/src/styles/mockup.css`
- Modify: `app/src/app/layout.tsx`, `app/src/app/globals.css`

**Interfaces:**
- Produces: every CSS class of the mockup available globally (`.login-card`, `.sidebar`, `.nav-item`, `.sec-card`, `.pill`, `.toast`, …); font exposed as CSS var `--sans`.

- [ ] **Step 1: Extract the mockup stylesheet verbatim**

Copy the ENTIRE `<style>` block content of `index.html` (from line 8 `@font-face`/`:root` through the closing `</style>`, currently lines ~8–1050) into `app/src/styles/mockup.css` **unchanged**, with two exceptions only:
1. Remove `@font-face` rules for Plus Jakarta Sans (next/font handles it).
2. In the `--sans` token, keep the fallback list but the primary family will be provided by next/font's CSS variable: `--sans: var(--font-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;`

- [ ] **Step 2: Wire font + stylesheet in layout**

`app/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/mockup.css';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'FAD Manager — Time Vision',
  description: 'Piattaforma Fondo Nuove Competenze',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
```

Empty out `globals.css` except for anything create-next-app added that the mockup CSS already covers (delete default styling; mockup.css owns the look).

- [ ] **Step 3: Visual smoke check**

Run: `cd app; npm run dev` and open http://localhost:3000 — default page renders with white background and Plus Jakarta Sans (inspect computed `font-family`).

- [ ] **Step 4: Commit**

```powershell
git add app/src; git commit -m "feat(app): port mockup design system verbatim (tokens, styles, font)"
```

---

### Task 3: Supabase schema, RLS, storage, seed

**Files:**
- Create: `app/supabase/migrations/0001_schema.sql`, `app/supabase/migrations/0002_rls.sql`, `app/supabase/migrations/0003_storage_seed.sql`

**Interfaces:**
- Produces: tables `aziende`, `documenti`, `solleciti`, `proposte`, `proposte_dipendenti`, `progetti`, `corsi`, `contenuti_ai`, `domande_governo`, `presenze`, `allowed_users`; helper `public.is_allowed()`; buckets `documenti`, `contenuti-ai`; seeded test company + allowlisted email.

- [ ] **Step 1: Write and apply `0001_schema.sql`** (apply via MCP `apply_migration`, name `schema`, project `ferkvngwtiaivqpqfjmy`; save same SQL to the file):

```sql
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
```

- [ ] **Step 2: Write and apply `0002_rls.sql`** (MCP `apply_migration`, name `rls`):

```sql
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
```

- [ ] **Step 3: Write and apply `0003_storage_seed.sql`** (MCP `apply_migration`, name `storage_seed`):

```sql
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
```

- [ ] **Step 4: Verify**

Via MCP `execute_sql` (project `ferkvngwtiaivqpqfjmy`):
`select count(*) from public.aziende;` → 1.
`select count(*) from public.documenti;` → 6.
Then run MCP `get_advisors` (type `security`) → Expected: no RLS-disabled warnings on public tables.

- [ ] **Step 5: Fetch keys and fill `app/.env.local`**

Use MCP `get_publishable_keys` for the anon/publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The `SUPABASE_SERVICE_ROLE_KEY` cannot be read via MCP: leave blank and note it — the user pastes it from Supabase Dashboard → Settings → API keys (needed first in Task 7).

- [ ] **Step 6: Commit**

```powershell
git add app/supabase; git commit -m "feat(db): FN4 schema, allowlist RLS, private buckets, test seed"
```

---

### Task 4: Supabase client helpers

**Files:**
- Create: `app/src/lib/supabase/server.ts`, `app/src/lib/supabase/client.ts`, `app/src/lib/supabase/middleware.ts`

**Interfaces:**
- Produces: `createClient()` (server, async, cookie-bound), `createBrowserClient()` (browser), `updateSession(request: NextRequest): Promise<NextResponse>` for middleware. Consumed by Tasks 5, 6.

- [ ] **Step 1: Install**

```powershell
cd app; npm i @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Server client** — `app/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* called from a Server Component: middleware refreshes sessions */
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Browser client** — `app/src/lib/supabase/client.ts`:

```ts
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: Session refresher** — `app/src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');
  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return response;
}
```

- [ ] **Step 5: Build check + commit**

Run: `cd app; npm run build` → Expected: success.

```powershell
git add app/src/lib; git commit -m "feat(app): supabase server/browser clients and session middleware"
```

---

### Task 5: Login page — 1:1 port with real sign-in

**Files:**
- Create: `app/src/app/login/page.tsx`, `app/src/app/login/login-form.tsx`, `app/src/app/login/actions.ts`

**Interfaces:**
- Consumes: `createClient()` from Task 4.
- Produces: route `/login`; server action `login(formData: FormData): Promise<{ error?: string }>` performing `signInWithPassword` and redirecting to `/`.

- [ ] **Step 1: Port markup verbatim**

Copy the login markup from `index.html` lines 1063–1170 (`<div class="login" id="login">` … `</div><!-- /.login-card -->` plus its closing wrappers) into JSX in `app/src/app/login/page.tsx` + `login-form.tsx` (the form part is a client component). Conversion rules — these are mechanical, not visual:
- `class` → `className`; inline `style="…"` → `style={{ … }}`; `onclick` handlers removed.
- Keep every element, class, and Italian string identical, including the role tabs (Azienda/Consulente), the "Accedi" signin-pill, and the Google button.
- Logo: copy `assets/timevision-logo.svg` to `app/public/assets/timevision-logo.svg` and reference it with `<img src="/assets/timevision-logo.svg" …>` exactly as sized in the mockup.

Behavior wiring (minimal, per spec exception — FLAG to user in the task report):
- Email + password inputs are controlled; both "Accedi…" buttons and the signin-pill submit the same real sign-in.
- The Google button and "Contatta l'amministratore" link show the mockup's toast pattern with text "Funzione non disponibile — accesso riservato al team interno".
- On auth error, show the mockup's toast/error styling with "Credenziali non valide o utente non autorizzato".

- [ ] **Step 2: Server action** — `app/src/app/login/actions.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Inserisci email e password' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Credenziali non valide o utente non autorizzato' };
  redirect('/');
}
```

- [ ] **Step 3: Visual comparison**

Run `npm run dev`, open `/login` beside the mockup's login (open `index.html` in a browser). Screenshot both; they must be indistinguishable (layout, colors, spacing, copy). Fix any discrepancy — discrepancies are bugs.

- [ ] **Step 4: Commit**

```powershell
git add app/src/app/login app/public; git commit -m "feat(app): login page ported 1:1 from mockup with real Supabase sign-in"
```

---

### Task 6: Middleware + app shell + dashboard (zero-state, real counts)

**Files:**
- Create: `app/src/middleware.ts`, `app/src/app/(app)/layout.tsx`, `app/src/app/(app)/page.tsx`, `app/src/components/sidebar.tsx`, `app/src/app/(app)/logout/route.ts`
- Modify: delete create-next-app default `app/src/app/page.tsx`

**Interfaces:**
- Consumes: `updateSession` (Task 4), `createClient` (Task 4).
- Produces: protected `(app)` route group; sidebar shell used by all future pages; `GET /logout` signs out and redirects to `/login`.

- [ ] **Step 1: Middleware** — `app/src/middleware.ts`:

```ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mp4)$).*)'],
};
```

- [ ] **Step 2: Port the sidebar verbatim**

Copy the sidebar markup from `index.html` (the `<aside class="sidebar">` block, lines ~1180–1318: profile card, workflow nav with `data-view` items, badges, support fab) into `app/src/components/sidebar.tsx` (client component). Conversion: `data-view` navigation becomes Next.js `<Link>`s mapped as: dashboard→`/`, consulente→`/aziende`, commerciale→`/proposta`, progettazione→`/progettazione`, ai-contenuti→`/ai`, governo→`/governo`, monitoraggio→`/monitoraggio`, formazione-ai→`/formazione-ai`. Active state from `usePathname()`, same `.active` class as mockup. All labels/badges identical. The "Esci"/logout affordance (if present in mockup profile card) links to `/logout`; if the mockup has none, do not add one visually — logout stays reachable by URL (FLAG in report).

- [ ] **Step 3: App shell layout** — `app/src/app/(app)/layout.tsx`:

```tsx
import Sidebar from '@/components/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
```

(Match the mockup's actual wrapper classes — `.app` grid and main container — copying them exactly from `index.html` structure around line 1180.)

- [ ] **Step 4: Dashboard page with real counts**

Copy the `#view-dashboard` section markup (from `index.html` line 1319 up to `id="view-consulente"` at 1433) into `app/src/app/(app)/page.tsx` as a server component. Replace ONLY the numeric demo values with real queries:

```ts
const supabase = await createClient();
const [{ count: nAziende }, { count: docMancanti }, { count: nProposte }, { count: nDomande }] =
  await Promise.all([
    supabase.from('aziende').select('*', { count: 'exact', head: true }),
    supabase.from('documenti').select('*', { count: 'exact', head: true }).eq('stato', 'mancante'),
    supabase.from('proposte').select('*', { count: 'exact', head: true }),
    supabase.from('domande_governo').select('*', { count: 'exact', head: true }),
  ]);
```

Demo-only content with no table yet (e.g. the companies table rows) renders from the same queries (will show only ALFA LOGISTICA); static structure, headers, hero, cards stay byte-identical.

- [ ] **Step 5: Logout route** — `app/src/app/(app)/logout/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url));
}
```

- [ ] **Step 6: Verify flow**

`npm run dev`: unauthenticated `/` → redirected to `/login`. (Full login flow testable after Task 7 creates the user.) Build passes: `npm run build`.

- [ ] **Step 7: Commit**

```powershell
git add app/src; git commit -m "feat(app): protected shell, sidebar and dashboard ported 1:1 with live counts"
```

---

### Task 7: Internal user creation script

**Files:**
- Create: `app/scripts/create-user.mjs`

**Interfaces:**
- Consumes: `SUPABASE_SERVICE_ROLE_KEY` in `app/.env.local` (user must paste it from Supabase Dashboard → Settings → API before this task runs).
- Produces: auth user for `innovazione@timevision.it`; signups remain disabled to the public.

- [ ] **Step 1: Script** — `app/scripts/create-user.mjs`:

```js
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: new URL('../.env.local', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') });

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Uso: node scripts/create-user.mjs <email> <password>');
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data, error } = await admin.auth.admin.createUser({
  email, password, email_confirm: true,
});
if (error) { console.error('Errore:', error.message); process.exit(1); }
console.log('Utente creato:', data.user.id, data.user.email);
```

- [ ] **Step 2: Ask the user for the service role key** (blocker if missing), then run:

```powershell
cd app; node scripts/create-user.mjs innovazione@timevision.it <password scelta dall'utente>
```

Expected: "Utente creato: …". The password is chosen by the user — never invent or log one in git.

- [ ] **Step 3: End-to-end login check**

`npm run dev` → `/login` → sign in with the created credentials → lands on dashboard with real counts (1 azienda, 6 documenti mancanti). Wrong password → Italian error toast.

- [ ] **Step 4: Commit**

```powershell
git add app/scripts; git commit -m "feat(app): admin script to create internal auth users"
```

---

### Task 8: RLS verification test

**Files:**
- Create: `app/src/lib/supabase/rls.test.ts`

**Interfaces:**
- Consumes: env vars from `app/.env.local`.

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('RLS', () => {
  it('anon client reads zero rows from every table', async () => {
    const anon = createClient(url, anonKey);
    for (const table of ['aziende', 'documenti', 'proposte', 'allowed_users']) {
      const { data, error } = await anon.from(table).select('*');
      expect(error ?? undefined).toBeUndefined();
      expect(data).toEqual([]);
    }
  });

  it('service role sees the seeded test company', async () => {
    const admin = createClient(url, serviceKey);
    const { data } = await admin.from('aziende').select('ragione_sociale');
    expect(data?.map((r) => r.ragione_sociale)).toContain('ALFA LOGISTICA SRL (TEST)');
  });
});
```

- [ ] **Step 2: Run**

Run: `cd app; npm run test` → Expected: 2 passed. If the anon test returns rows, STOP — RLS is broken; fix policies before anything else.

- [ ] **Step 3: Commit**

```powershell
git add app/src/lib/supabase/rls.test.ts; git commit -m "test(db): verify RLS blocks anon and seed is present"
```

---

### Task 9: Deploy on the EXISTING Vercel project `fn4`

**Files:**
- Create: `app/public/mockup.html` (copy of root `index.html`, so the mockup stays demo-able)

**Interfaces:**
- Consumes: working build from Tasks 1–6; env values from Task 3.
- Produces: existing Vercel project `fn4` (team `espeditos-projects-07141c0e`) serving the platform at fn4.vercel.app, mockup at fn4.vercel.app/mockup.html. **Do NOT create any new Vercel project** (explicit user instruction, 2026-08-05).

- [ ] **Step 1: Keep the mockup reachable**

Copy `index.html` (repo root, unmodified) to `app/public/mockup.html`. Commit.

- [ ] **Step 2: Push branch**

```powershell
git push origin preview
```

- [ ] **Step 3: Reconfigure the existing `fn4` project**

Update the existing Vercel project `fn4` (team `espeditos-projects-07141c0e`): Root Directory = `app`, Framework Preset = Next.js. Use the Vercel MCP project tools if they support the update; otherwise walk the user through Dashboard → fn4 → Settings → Build & Deployment (a 1-minute change) and wait for their confirmation. Never create a new project.

- [ ] **Step 4: Set env vars on Vercel**

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for Production + Preview environments (via MCP/dashboard). Redeploy.

- [ ] **Step 5: Verify online**

Open the preview deployment URL for branch `preview`: `/` redirects to `/login`; login with the internal account works; dashboard shows live counts; `/mockup.html` serves the mockup. Note: preview-branch URLs may sit behind Vercel SSO deployment protection (known team setting) — if so, verify while logged into Vercel and tell the user how to open it. fn4.vercel.app (production) keeps serving the old mockup until the user approves a merge to `main`.

- [ ] **Step 6: Commit any config + report**

```powershell
git add -A; git commit -m "chore(app): vercel deployment configuration" --allow-empty
git push origin preview
```

Report the live URL to the user. **Phase 1 exit criterion met when:** the user can open the URL, see the exact mockup login, sign in, and land on the dashboard.
