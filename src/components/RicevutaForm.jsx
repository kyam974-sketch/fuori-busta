import { useState, useEffect, useRef } from "react";
import { generatePDF } from "../utils/pdf";

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SCRIPT_URL = import.meta.env.VITE_SHEETS_SCRIPT_URL;

async function fetchSheet(name, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(name + "!" + range)}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.values || [];
}

export default function RicevutaForm({ nextNumero, onSaved }) {
  const today = new Date().toLocaleDateString("it-IT");
  const [clienti, setClienti] = useState([]);
  const [prestazioni, setPrestazioni] = useState([]);
  const prestazioniRef = useRef([]);
  const clientiRef = useRef([]);
  const [form, setForm] = useState({
    numero: nextNumero,
    data: today,
    annoFiscale: new Date().getFullYear().toString(),
    committente: "",
    cfCommittente: "",
    descrizione: "",
    lordo: 0,
    pagato: "NO",
    dataPagamento: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchSheet("Clienti", "A2:F100"),
      fetchSheet("Prestazioni", "A2:C100")
    ]).then(([clientiRows, prestazioniRows]) => {
      const c = clientiRows.map(r => ({
        nome: r[0] || "", cf: r[1] || "", via: r[2] || "", civico: r[3] || "",
        cap: r[4] || "", citta: r[5] || "", provincia: r[6] || "",
      }));
      const p = prestazioniRows.map(r => ({ descrizione: r[0] || "", importo: parseFloat(r[1]) || 0 }));
      clientiRef.current = c;
      prestazioniRef.current = p;
      setClienti(c);
      setPrestazioni(p);
      setForm(f => ({
        ...f,
        committente: c[0]?.nome || "",
        cfCommittente: c[0]?.cf || "",
        viaCommittente: c[0]?.via || "",
        civicoCommittente: c[0]?.civico || "",
        capCommittente: c[0]?.cap || "",
        cittaCommittente: c[0]?.citta || "",
        provinciaCommittente: c[0]?.provincia || "",
        descrizione: p[0]?.descrizione || "",
        lordo: p[0]?.importo || 0,
      }));
    });
  }, []);

  const ritenuta = +(form.lordo * 0.2).toFixed(2);
  const netto = +(form.lordo - ritenuta).toFixed(2);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleClienteChange = (nome) => {
    const c = clientiRef.current.find(c => c.nome === nome);
    setForm(f => ({
      ...f,
      committente: nome,
      cfCommittente: c?.cf || "",
      viaCommittente: c?.via || "",
      civicoCommittente: c?.civico || "",
      capCommittente: c?.cap || "",
      cittaCommittente: c?.citta || "",
      provinciaCommittente: c?.provincia || "",
    }));
  };

  const handlePrestazioneChange = (desc) => {
    const p = prestazioniRef.current.find(p => p.descrizione === desc);
    setForm(f => ({ ...f, descrizione: desc, lordo: p?.importo ?? f.lordo }));
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const payload = {
        _sheet: "Ricevute Prestazioni Occasionali",
        numero: form.numero, data: form.data, annoFiscale: form.annoFiscale,
        committente: form.committente, cfCommittente: form.cfCommittente,
        descrizione: form.descrizione, lordo: form.lordo,
        ritenuta, netto, pagato: form.pagato,
        dataPagamento: form.dataPagamento, note: form.note,
      };
      const res = await fetch("/api/sheets", { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onSaved();
    } catch (e) { setError("Errore durante il salvataggio. Riprova."); }
    setSaving(false);
  };

  const handlePDF = async () => generatePDF({ ...form, ritenuta, netto });

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
          <label>Cliente</label>
          <select value={form.committente} onChange={e => handleClienteChange(e.target.value)}>
            {clienti.length === 0 && <option value="">— Nessun cliente, aggiungine uno —</option>}
            {clienti.map(c => <option key={c.nome}>{c.nome}</option>)}
          </select>
        </div>
        <div className="field full">
          <label>Prestazione</label>
          <select value={form.descrizione} onChange={e => handlePrestazioneChange(e.target.value)}>
            {prestazioni.length === 0 && <option value="">— Nessuna prestazione, aggiungine una —</option>}
            {prestazioni.map(p => <option key={p.descrizione}>{p.descrizione}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Importo lordo (€)</label>
          <input type="number" value={form.lordo} onChange={e => set("lordo", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="field">
          <label>Ritenuta 20%</label>
          <input className="readonly" readOnly value={`€ ${ritenuta.toFixed(2)}`} />
        </div>
        <div className="field">
          <label>Netto da ricevere</label>
          <input className="readonly" readOnly value={`€ ${netto.toFixed(2)}`} />
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
      {form.lordo > 77.47 && (
        <div className="bollo-warning">
          ⚠️ Importo superiore a €77,47 — ricordati di applicare fisicamente la marca da bollo da €2,00 sulla tua copia della ricevuta.
        </div>
      )}
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
