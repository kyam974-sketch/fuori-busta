import { google } from 'googleapis';

const SHEET_ID = process.env.VITE_SHEET_ID;

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false });

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Body received:', JSON.stringify(data));
    const sheetName = data._sheet || "Ricevute Prestazioni Occasionali";

    let row;
    if (sheetName === "Clienti") {
      row = [data.nome, data.cf, data.indirizzo, data.email, data.telefono, data.note];
    } else if (sheetName === "Prestazioni") {
      row = [data.descrizione, data.importo, data.categoria];
    } else {
      row = [
        data.numero, data.data, data.annoFiscale,
        data.committente, data.cfCommittente, data.descrizione,
        data.lordo, data.ritenuta, data.netto,
        data.pagato, data.dataPagamento, data.note
      ];
    }

    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
