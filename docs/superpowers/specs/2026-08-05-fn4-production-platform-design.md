# FN4 / FAD Manager — Piattaforma di produzione (design)

Data: 2026-08-05 · Stato: approvato in conversazione (innovazione@timevision.it)

## Obiettivo

Trasformare il mockup cliccabile ([index.html](../../../index.html)) nella piattaforma
di produzione online di Time Vision per il Fondo Nuove Competenze: tutte le
funzionalità del mockup diventano reali (database, auth, upload, email, job
schedulati, generazione AI), la piattaforma va online su Vercel, e — in una fase
finale separata e **subordinata a permesso esplicito** — vengono ingeriti i dati
reali delle aziende.

## Vincolo fondamentale: UI/UX invariata

**Il frontend NON cambia.** La piattaforma di produzione replica 1:1 l'interfaccia
del mockup: stesso layout, stessi componenti, stessa palette, stessi testi, stesse
interazioni e micro-animazioni. Il lavoro sul frontend è esclusivamente un **porting
tecnico** (da HTML monolitico a componenti Next.js) — nessun redesign, nessuna
"miglioria" visiva, nessun cambio di copy senza richiesta esplicita.

Riferimenti vincolanti:
- Palette: teal `#335C67` (interattivo), vaniglia `#FFF3B0` (highlight), brick
  `#9E2A2B` + maroon `#540B0E` (brand), crema `#F0EBD8` (card sezione), sfondo
  sempre bianco, tema unico (niente dark mode).
- Font: Plus Jakarta Sans (stile MercuryPro).
- Login wave-split senza card, sidebar con profile card e sfere in vetro acqua,
  hero a mezzo cerchio, sec-card in tinta acqua chiarissima, etichette AI Act su
  ogni contenuto generato.
- Ogni discrepanza visiva tra app di produzione e mockup è un bug.

Unica eccezione ammessa: quando una funzione reale richiede un'affordance che il
mockup non ha (es. bottone "Salva proposta", stato di avanzamento della build
video), si aggiunge il minimo indispensabile, nello stile esistente, e la si
segnala all'utente per approvazione — mai redesign di ciò che già esiste.

## Architettura

- **App**: nuova applicazione **Next.js (App Router, TypeScript)** nella cartella
  `app/` di questo repo. I file HTML del mockup restano intatti e deployati
  (fn4.vercel.app continua a servire il mockup per le demo).
- **Styling**: Tailwind CSS configurato con i design token del mockup; dove il
  porting è più fedele, CSS estratto dal mockup così com'è. Criterio: fedeltà
  visiva prima di purezza tecnica.
- **Backend**: progetto **Supabase dedicato "FN4"** (ref `ferkvngwtiaivqpqfjmy`,
  eu-west-1, creato dall'utente il 2026-08-05,
  https://ferkvngwtiaivqpqfjmy.supabase.co) — Postgres, Auth, Storage. RLS restrittiva dal primo giorno: accesso solo ad utenti
  autenticati (a differenza delle vecchie tabelle `fn4_*` aperte ad anon nel
  progetto `timevision_services_hub`, che NON viene riusato).
- **Deploy**: we reuse the existing Vercel project `fn4` (team
  `espeditos-projects-07141c0e`) — **no new Vercel project** (explicit user
  request, 2026-08-05). Root Directory → `app`; fn4.vercel.app will serve the
  platform, and the mockup stays reachable at fn4.vercel.app/mockup.html.
  Workflow unchanged: every push to the `preview` branch auto-deploys to the
  preview URL (fn4-git-preview-…vercel.app, behind Vercel SSO — open it while
  logged into Vercel); merging to `main` only after user approval deploys to
  production (fn4.vercel.app, public). Nothing reaches production until the
  merge is approved.
- **Job schedulati**: Vercel Cron per l'Upload Governo delle 09:00.
- **Lavori lunghi** (build video): funzione asincrona/background su Vercel
  (Fluid Compute), risultato salvato su Supabase Storage, avanzamento visibile
  in UI.
- **Email**: provider transazionale (raccomandato: Resend via Vercel
  Marketplace) per i solleciti documentali automatici — sostituisce il flusso
  manuale "Gmail + appunti".

## Utenti e autenticazione (v1)

- **Solo team interno Time Vision.** Supabase Auth email+password, con
  allowlist di email/domini autorizzati (tabella `allowed_users` o restrizione
  dominio `@timevision.it`).
- Tutte le route dell'app protette da middleware; senza sessione si vede solo
  la pagina di login (identica a quella del mockup).
- Ruoli aziende/consulenti esterni: fuori scope v1.

## Moduli funzionali

Tutto ciò che è nel mockup diventa funzionante. Per modulo:

### 1. Dashboard
Contatori e pipeline di fase alimentati da query reali (aziende, documenti
mancanti, proposte, domande, corsi attivi). Zero numeri finti.

### 2. Portale Aziende — Fase 1
- Anagrafica aziende (livello azienda, mai dati personali dei lavoratori).
- Checklist di 6 documenti per azienda; upload reale su Supabase Storage
  (bucket privato, URL firmati), stato per documento
  (mancante / caricato / verificato).
- Sollecito email automatico via provider transazionale, con il template
  grafico già definito nel mockup; log dei solleciti inviati.

### 3. Proposta Commerciale — Fase 2
Implementa esattamente la spec approvata
[2026-07-27-fase2-uniemens-upload-design.md](2026-07-27-fase2-uniemens-upload-design.md):
- Upload UNIEMENS XML (multi-azienda) e CSV storico FNC3; parsing client-side.
- Algoritmo FNC3: `beneficio = ore × (0,60 × quota oraria + contribuzione oraria)`;
  fee slider 8–30%; tabella dipendenti con ore editabili; modalità manuale legacy.
- **In più rispetto al mockup**: persistenza — la proposta calcolata si salva su
  DB (`proposte` + `proposte_dipendenti`) collegata all'azienda, ricaricabile e
  aggiornabile. Nel salvataggio dei dipendenti si persistono solo i campi
  necessari al calcolo (CF, ore, quote orarie) — niente anagrafica estesa.

### 4. Progettazione — Fase 3
- Flusso di generazione del documento di progetto (Atlante del Lavoro / ISTAT)
  come nel mockup, con salvataggio di `progetti` e `corsi` su DB.
- Il documento generato è scaricabile e resta associato all'azienda/proposta.

### 5. AI Contenuti (completo in v1)
Wizard a 4 passi identico al mockup; ogni output è reale e persistito:
- **Passo 1 — Contenuto didattico**: generazione testo lato server (Claude API),
  salvata su DB.
- **Passo 2 — Slide**: generazione reale via **Gamma API** lato server
  (serve API key Gamma; costo per generazione), con il picker "Tema grafico"
  incluso Tema TIMEVISION. Le deck generate restano collegate al corso.
- **Passo 3 — Immagini AI**: Pollinations lato server, immagini salvate su
  Storage (non più solo hot-link).
- **Passo 4 — Videolezione**: pipeline asincrona già validata localmente —
  export PNG slide → narrazione italiana TTS (edge-tts, voce it-IT) → concat
  ffmpeg — portata su job server-side; video risultante su Storage, player
  reale in UI con stato di avanzamento durante la build.
- **AI Act**: etichetta "contenuto generato con AI" su ogni artefatto (come già
  nel mockup) + passo di **revisione umana**: un artefatto è utilizzabile solo
  dopo approvazione esplicita di un operatore (campo `review_status`).

### 6. Formazione AI
La sezione AI literacy / regole d'uso (Art. 4 AI Act) del mockup come pagine di
contenuto reali dell'app (contenuto statico versionato nel repo, non CMS).

### 7. Upload Governo — Fase 4
- Coda delle domande con stato (in preparazione / pronta / caricata / esito).
- Job Vercel Cron ore 09:00 (Europe/Rome) che processa le domande "pronte".
- **Assunzione dichiarata**: il portale governativo non espone API pubbliche →
  in v1 il job **prepara e traccia** (pacchetto file pronto, checklist,
  notifica all'operatore), il caricamento materiale resta umano. Se emergerà
  un canale di invio automatico, si estende il job senza cambiare la UI.

### 8. Monitoraggio — Fase 5
Ore erogate, presenze, avanzamento corsi da tabelle reali (`presenze`,
avanzamento per corso), con le stesse viste del mockup.

## Modello dati (Postgres, schema `public`)

| Tabella | Contenuto chiave |
|---|---|
| `aziende` | ragione sociale, P.IVA/CF, matricola, contatti aziendali, fase corrente |
| `documenti` | azienda, tipo (6 tipi checklist), stato, path Storage, timestamp |
| `solleciti` | azienda, documento/i, destinatario, inviato_at, esito |
| `proposte` | azienda, fonte (uniemens/csv/manuale), fee %, beneficio totale, stato |
| `proposte_dipendenti` | proposta, CF, ore formazione, quota oraria, contribuzione oraria, beneficio |
| `progetti` | azienda/proposta, riferimenti Atlante/ISTAT, documento generato |
| `corsi` | progetto, titolo, ore previste, stato |
| `contenuti_ai` | corso, tipo (testo/slide/immagine/video), path Storage o id Gamma, prompt, `review_status`, etichetta AI |
| `domande_governo` | azienda/progetto, stato coda, scheduled_for, esito, log |
| `presenze` | corso, data, ore erogate, partecipanti (conteggio, non nominativo) |
| `allowed_users` | email autorizzate al login interno |

Regole trasversali:
- RLS su tutte le tabelle: `authenticated` only; nessun accesso anon.
- Storage: bucket privati (`documenti`, `contenuti-ai`), accesso via URL firmati.
- Dati personali dei lavoratori: si persiste il minimo necessario al calcolo
  (CF e valori economici in `proposte_dipendenti`); mai anagrafiche estese.

## Gestione errori (criteri generali)

- Ogni azione server (upload, salvataggio, generazione AI, invio email) ha
  stato di caricamento, toast di errore con messaggio comprensibile e nessuna
  perdita di input utente in caso di fallimento.
- Job asincroni (video, cron): stato persistito su DB (`pending / running /
  done / failed` + messaggio), visibile in UI; retry manuale dall'interfaccia.
- Parsing UNIEMENS/CSV: come da spec Fase 2 (toast su file malformato,
  esclusi conteggiati, encoding UTF-8 con fallback Windows-1252).

## Test e verifica

- Unit test sull'algoritmo FNC3 (valori di verifica noti: DIVA SRL ≈ €16.893;
  KOENIG & BAUER €91.711,20, fee 25% → €22.927,80) e sui parser UNIEMENS/CSV.
- Test di integrazione sulle route API (auth richiesta, RLS effettiva:
  una richiesta anon non legge nulla).
- Verifica visiva sistematica: confronto pagina-per-pagina app vs mockup
  (il mockup è la fonte di verità della UI).
- Smoke test end-to-end del flusso: login → azienda → documenti → proposta →
  progetto → contenuti AI → domanda governo → monitoraggio.

## Fase finale: ingestione dati reali (GATE — permesso esplicito)

- Al lancio il DB contiene solo lo schema + l'azienda di test
  "ALFA LOGISTICA SRL (TEST)" (P.IVA IT00000000001, email
  espedito.delgaudio@timevision.it per le prove email reali).
- Su permesso esplicito dell'utente (e solo allora): script one-shot di import
  del CSV FNC3 → `aziende` + righe checklist. **Solo dati a livello azienda,
  campi anagrafici sensibili esclusi** (regola aziendale). Lo script è
  idempotente e produce un report di import.
- Stesso gate prima di attivare solleciti email verso aziende reali.

## Fuori scope v1

- Login per aziende o consulenti esterni (solo team interno).
- Invio automatico effettivo al portale governativo (si prepara e traccia).
- CMS per la sezione Formazione AI (contenuto statico nel repo).
- Migrazione/riuso delle tabelle `fn4_*` del progetto Supabase
  `timevision_services_hub` (si riparte da schema pulito; il vecchio progetto
  resta com'è).
- Qualsiasi modifica visiva o di UX rispetto al mockup.

## Dipendenze / input richiesti all'utente

1. **API key Gamma** per la generazione slide (Passo 2 AI Contenuti).
2. Conferma dell'assunzione Upload Governo (prepara-e-traccia, niente invio
   automatico).
3. Scelta/attivazione del provider email (raccomandato Resend) quando si
   arriva al modulo solleciti.
4. Permesso esplicito per l'ingestione dei dati reali (fase finale).

## Fasi di consegna

1. **Fondamenta** — scaffold Next.js, porting design system, progetto Supabase
   + schema + RLS, auth, pipeline di deploy (URL preview online).
2. **Flusso core** — Dashboard, Portale Aziende (upload + solleciti),
   Proposta Commerciale con persistenza.
3. **Fasi 3-4-5** — Progettazione, Upload Governo (cron 09:00), Monitoraggio.
4. **Area AI** — testo, slide Gamma, immagini, pipeline video asincrona,
   etichette AI Act + revisione umana, Formazione AI.
5. **Hardening & go-live** — security review RLS, stati di errore/vuoto,
   confronto visivo completo col mockup, deploy in produzione.
6. **Ingestione dati** — import gated su permesso esplicito.
