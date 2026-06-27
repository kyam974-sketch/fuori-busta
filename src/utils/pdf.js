import jsPDF from "jspdf";

export function generatePDF(r) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  let y = margin;

  // Header
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, 210, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RICEVUTA DI PRESTAZIONE OCCASIONALE", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`N. ${r.numero}  |  ${r.data}`, 210 - margin, 12, { align: "right" });

  y = 30;
  doc.setTextColor(30, 30, 30);

  // Prestatore
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("PRESTATORE", margin, y);
  y += 5;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Chiara Marchese", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("C.F. MRCCHR74P44G716W", margin, y);
  y += 4;
  doc.text("Via Senese 56/a – 58100 Grosseto (GR)", margin, y);

  // Committente
  y += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("COMMITTENTE", margin, y);
  y += 5;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(r.committente, margin, y);
  if (r.cfCommittente) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`C.F. ${r.cfCommittente}`, margin, y);
  }

  // Divider
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, 210 - margin, y);

  // Descrizione
  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("DESCRIZIONE PRESTAZIONE", margin, y);
  y += 5;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(r.descrizione, 170);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 5;

  // Importi
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, 210 - margin, y);
  y += 8;

  const importiX = 210 - margin;
  const labelX = 210 - 70;

  const addRow = (label, val, bold = false) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, labelX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(val, importiX, y, { align: "right" });
    y += 6;
  };

  addRow("Importo lordo", `€ ${parseFloat(r.lordo).toFixed(2)}`);
  addRow("Ritenuta d'acconto 20%", `- € ${parseFloat(r.ritenuta).toFixed(2)}`);
  y += 2;
  doc.setDrawColor(30, 30, 30);
  doc.line(labelX, y, importiX, y);
  y += 4;
  addRow("Importo netto da corrispondere", `€ ${parseFloat(r.netto).toFixed(2)}`, true);

  // Note legali
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, 210 - margin, y);
  y += 6;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const legal = [
    "Il/la sottoscritto/a dichiara che il compenso percepito non è soggetto ad IVA ai sensi dell'art. 1, c. 54-89 della L. 190/2014 (regime forfettario) ovvero",
    "in quanto prestazione occasionale ai sensi dell'art. 2222 c.c. Il committente è tenuto ad operare la ritenuta d'acconto del 20% ai sensi dell'art. 25 DPR 600/73.",
  ];
  legal.forEach(l => { doc.text(l, margin, y); y += 4; });

  // Note aggiuntive
  if (r.note) {
    y += 4;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.text(`Note: ${r.note}`, margin, y);
  }

  // Firma
  y += 16;
  doc.setDrawColor(30, 30, 30);
  doc.line(margin, y, margin + 60, y);
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Firma del prestatore", margin, y);

  doc.save(`Ricevuta_${r.numero}_${r.data?.replace(/\//g, "-")}.pdf`);
}
