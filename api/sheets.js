import { GoogleAuth } from 'google-auth-library';

const SHEET_ID = process.env.VITE_SHEET_ID;

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  return new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const data = req.body;
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

    const auth = getAuth();
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}!A:A:append?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.token}`,
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(JSON.stringify(err));
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
