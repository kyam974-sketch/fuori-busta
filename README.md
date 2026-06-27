# Ricevute CM

Web app personale per la gestione delle ricevute di prestazione occasionale.

## Stack
- React + Vite
- Google Sheets come database
- jsPDF per generazione PDF
- Deploy su Vercel

## Variabili d'ambiente (Vercel)
- `VITE_APP_PIN` — PIN di accesso
- `VITE_SHEET_ID` — ID del foglio Google Sheets
- `VITE_SHEETS_API_KEY` — API Key Google per lettura
- `VITE_SHEETS_TOKEN_URL` — Endpoint per token OAuth scrittura

## Note
Il foglio Sheets è già creato su Drive: Ricevute Prestazioni Occasionali
