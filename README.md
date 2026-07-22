# FNC Hub — Mockup UI

Prototipo cliccabile (non funzionante) della piattaforma unica per il **Fondo Nuove Competenze** di Time Vision.

> ⚠️ Mockup a scopo dimostrativo: dati fittizi, nessun backend, nessun salvataggio.

## Pagine

| File | Descrizione |
|---|---|
| `index.html` | Mockup principale (login + dashboard + 5 fasi) |
| `fnchub-variante-a.html` | Variante di design A — Editoriale |
| `fnchub-variante-b.html` | Variante di design B — Bento |

## Il flusso coperto

1. **Portale Consulente** — raccolta documentale con checklist e notifiche automatiche
2. **Proposta Commerciale** — calcolo CMO, quota azienda e fee
3. **Progettazione** — generazione automatica del documento di progetto (Atlante del Lavoro / ISTAT)
4. **Upload Governo** — caricamento programmato ore 09:00 e stato domande
5. **Monitoraggio** — ore erogate, presenze, avanzamento corsi

## Deploy

Sito statico, zero configurazione: ogni file HTML è autonomo (CSS/JS/font inclusi inline).
Su Vercel: importa il repo → framework preset **Other** → deploy.
