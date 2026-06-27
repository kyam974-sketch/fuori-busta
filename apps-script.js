// Apps Script da incollare su script.google.com
// Sostituisce la versione precedente

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = data._sheet || "Ricevute Prestazioni Occasionali";
    let sheet = ss.getSheetByName(sheetName);

    // Crea il foglio se non esiste
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Intestazioni
      if (sheetName === "Clienti") {
        sheet.appendRow(["Nome", "CF", "Indirizzo", "Email", "Telefono", "Note"]);
      } else if (sheetName === "Prestazioni") {
        sheet.appendRow(["Descrizione", "Importo", "Categoria"]);
      }
    }

    // Scrivi i dati
    if (sheetName === "Clienti") {
      sheet.appendRow([data.nome, data.cf, data.indirizzo, data.email, data.telefono, data.note]);
    } else if (sheetName === "Prestazioni") {
      sheet.appendRow([data.descrizione, data.importo, data.categoria]);
    } else {
      // Ricevute
      sheet.appendRow([
        data.numero, data.data, data.annoFiscale,
        data.committente, data.cfCommittente, data.descrizione,
        data.lordo, data.ritenuta, data.netto,
        data.pagato, data.dataPagamento, data.note
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
