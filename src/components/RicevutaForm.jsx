import { useState } from "react";
import { generatePDF } from "../utils/pdf";

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const SCRIPT_URL = import.meta.env.VITE_SHEETS_SCRIPT_URL;

const COMMITTENTI = [
  { nome: "Italo Paccoi", cf: "" },
];

const PRESTAZIONI = [
  "Intervento consulenziale professionale standard",
  "Revisione procedure burocratiche e amministrative",
  "Briefing consulenziale da remoto (max 60 min)",
  "Verifica completa configurazione piattaforme",
  "Dichiarazione annuale tassa di soggiorno - portale istituzionale con SPID committente",
  "Altra prestazione",
];

export default function RicevutaForm({ nextNumero, onSaved }) {
  const today = new Date().toLocaleDateString("it-IT");
  const [form, setForm] = useState({
    numero: nextNumero,
    data: today,
    annoFiscale: new Date().getFullYear().toString(),
    committente: "Italo Paccoi",
    cfCommittente: "",
    descrizione: PRESTAZIONI[4],
    lordo: 180,
    pagato: "NO",
    dataPagamento: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ritenuta = +(form.lordo * 0.2).toFixed(2);
  const netto = +(form.lordo - ritenuta).toFixed(2);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        numero: form.numero,
        data: form.data,
        annoFiscale: form.annoFiscale,
        committente: form.committente,
        cfCommittente: form.cfCommittente,
        descrizione: form.descrizione,
        lordo: form.lordo,
        ritenuta,
        netto,
        pagato: form.pagato,
        dataPagamento: form.dataPagamento,
        note: form.note,
      };
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Errore salvataggio");
      onSaved();
    } catch (e) {
      setError("Errore durante il salvataggio. Riprova.");
    }
    setSaving(false);
  };

  const handlePDF = () => {
    generatePDF({ ...form, ritenuta, netto });
  };

  return (
    <div className="form-wrap">
      <h2>Nuova ricevuta</h2>

      <div className="form-grid">
        <div className="field">
          <label>N. Ricevuta</label>
          <input type="number" value={form.numero} onChange={e => set("numero", e.target.value)} />
        </div>
        <div className="field">
          <label>Data</label>
          <input type="text" value={form.data} onChange={e => set("data", e.target.value)} />
        </div>
        <div className="field">
          <label>Anno fiscale</label>
          <input type="text" value={form.annoFiscale} onChange={e => set("annoFiscale", e.target.value)} />
        </div>
        <div className="field full">
          <label>Committente</label>
          <select value={form.committente} onChange={e => set("committente", e.target.value)}>
            {COMMITTENTI.map(c => <option key={c.nome}>{c.nome}</option>)}
          </select>
        </div>
        <div className="field full">
          <label>Descrizione prestazione</label>
          <select value={form.descrizione} onChange={e => set("descrizione", e.target.value)}>
            {PRESTAZIONI.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Importo lordo (€)</label>
          <input type="number" value={form.lordo} onChange={e => set("lordo", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="field">
          <label>Ritenuta 20%</label>
          <input type="text" value={`€ ${ritenuta.toFixed(2)}`} readOnly className="readonly" />
        </div>
        <div className="field">
          <label>Netto da ricevere</label>
          <input type="text" value={`€ ${netto.toFixed(2)}`} readOnly className="readonly" />
        </div>
        <div className="field">
          <label>Pagato</label>
          <select value={form.pagato} onChange={e => set("pagato", e.target.value)}>
            <option>NO</option>
            <option>SÌ</option>
          </select>
        </div>
        <div className="field">
          <label>Data pagamento</label>
          <input type="text" value={form.dataPagamento} onChange={e => set("dataPagamento", e.target.value)} placeholder="gg/mm/aaaa" />
        </div>
        <div className="field full">
          <label>Note</label>
          <input type="text" value={form.note} onChange={e => set("note", e.target.value)} />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button className="btn-ghost" onClick={handlePDF}>📄 Anteprima PDF</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvataggio…" : "Salva ricevuta"}
        </button>
      </div>
    </div>
  );
}


