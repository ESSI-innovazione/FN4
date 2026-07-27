# Fase 2 — Upload UNIEMENS & Calcolo Beneficio (design)

Data: 2026-07-27 · Stato: approvato (conversazione con innovazione@timevision.it)

## Obiettivo

Sostituire il calcolatore manuale della Fase 2 "Proposta commerciale" del mockup FNC4
([index.html](../../../index.html), sezione `#view-commerciale`) con il flusso reale:
l'admin **carica il flusso UNIEMENS XML** dell'azienda, la piattaforma estrae i
lavoratori e **calcola da sola** il Beneficio Totale e la Fee Time Vision con
l'algoritmo FNC3.

Punto chiave (dal cliente): per le nuove aziende FNC4 **non** esistono le colonne
precalcolate del file storico FNC3 (60% quota, somma contribuzione, beneficio, fee).
La piattaforma deve quindi calcolare tutto dai dati grezzi. Il file FNC3 serve come
riferimento dell'algoritmo ed è accettato come secondo formato di upload.

## Formati di input

### 1. UNIEMENS XML (flusso principale — nuove aziende)
Denuncia mensile INPS. Struttura: `DenunceMensili > Azienda > PosContributiva >
DenunciaIndividuale`. Un file può contenere più aziende (il file di esempio ne ha 25).

Campi usati per lavoratore:
- `CFLavoratore`, `Nome`, `Cognome`, `Qualifica1..3`
- `DatiRetributivi/Imponibile` — retribuzione imponibile del mese (€)
- `DatiRetributivi/Contributo` — contribuzione INPS totale del mese (€)
- `DatiRetributivi/OreLavorabili` — ore lavorabili del mese, in centesimi (16800 = 168,00 h)

Derivazioni:
- **Quota di retribuzione oraria** = Imponibile / OreLavorabili
- **Somma costo contribuzione oraria** = Contributo / OreLavorabili
  (UNIEMENS espone la contribuzione totale; nell'algoritmo FNC3 serve proprio la
  somma datore + lavoratore, quindi il valore aggregato è sufficiente)

Campi azienda: `CFAzienda`, `RagSocAzienda`, `Matricola`, `AnnoMeseDenuncia`.

### 2. CSV storico FNC3 (formato secondario)
Export di "FNC 3 - 2023/2024 - FASE 1". Una riga per dipendente, colonne usate:
Partita IVA (0), Nome azienda (1), Cognome/Nome (14/13), CF lavoratore (12),
Numero ore formazione TV (29, fallback azienda 28), Quota di retribuzione oraria (30),
Contribuzione datore (31), Contribuzione lavoratore (32), Percent. Time Vision (37,
usata come default della fee se presente sul blocco azienda).
Le colonne precalcolate (33-36, 38-39) vengono **ignorate**: si ricalcola tutto.
Numeri in formato italiano (`€ 10,50`, `100,00`); righe senza dati retributivi scartate.

## Algoritmo (verificato sul file FNC3)

Per dipendente:
- `q60 = 0,60 × quota retribuzione oraria`
- `contrib = somma costo contribuzione oraria`
- `beneficio = ore formazione × (q60 + contrib)`

Per azienda:
- `BENEFICIO TOTALE = Σ beneficio dipendenti`
- `FEE TV = beneficio totale × percentuale Time Vision` (slider 8–30%, default 25%
  o valore dal file FNC3)
- `Beneficio netto azienda = beneficio totale − fee`

Verifica: DIVA SRL ≈ €16.893 · KOENIG & BAUER €91.711,20, 25% → fee €22.927,80.

Le **ore di formazione** non esistono nell'UNIEMENS: input globale "Ore di formazione
per dipendente" (default 100), applicato a tutti e modificabile per singola riga in
tabella. Per il CSV FNC3 le ore per riga arrivano precompilate dal file.

## UI (sezione Fase 2)

1. **Upload**: dropzone (stile `.dropzone` esistente) + input file `.xml,.csv`.
   Parsing 100% client-side (nessun backend: i dati non lasciano il browser — nota
   in UI). Link "Carica dati di esempio" con dataset anonimizzato incorporato, così
   la demo funziona anche senza file.
2. **Selezione azienda**: riepilogo import ("N aziende · M lavoratori") + campo di
   ricerca (nome o CF/P.IVA) + elenco selezionabile. Con una sola azienda,
   selezione automatica.
3. **Tabella dipendenti** (colonne del foglio FNC3): Dipendente (nome + CF),
   Ore formazione (editabile), Retribuzione oraria, Contribuzione oraria,
   **60% Quota**, **Beneficio** — le ultime calcolate live. Riga totali in fondo.
   Corpo scrollabile oltre ~8 righe.
4. **Pannello risultato** (result-box scura esistente): BENEFICIO TOTALE (numero
   grande), slider Percentuale Time Vision (8–30%), FEE TV, Beneficio netto azienda.
   La riga "Quota a carico azienda 10%" viene rimossa (non fa parte dell'algoritmo
   FNC3). Il bottone "Genera bozza contratto" resta.

## Gestione errori
- File non riconosciuto / XML malformato → toast di errore, stato invariato.
- Lavoratori senza dati retributivi (ore lavorabili = 0 o imponibile mancante) →
  esclusi dal calcolo, contatore "N esclusi" nel riepilogo.
- Encoding CSV: prova UTF-8, fallback Windows-1252.

## Fuori scope
- Persistenza (il mockup è una pagina statica), multi-file merge, quota a carico
  azienda, beneficio in lettere, esport della proposta.

## Privacy
- I dati demo incorporati sono fittizi (nomi e CF inventati). I file reali caricati
  restano nel browser dell'utente.
