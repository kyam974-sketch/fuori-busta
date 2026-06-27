import { useState, useEffect } from "react";

const SCRIPT_URL = import.meta.env.VITE_SHEETS_SCRIPT_URL;
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Clienti";

export default function Clienti() {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", cf: "", indirizzo: "", email: "", telefono: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchClienti = async () => {
    setLoading(true);
    try {
      const range = `${SHEET_NAME}!A2:F100`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = (data.values || []).map(r => ({
        nome: r[0] || "", cf: r[1] || "", indirizzo: r[2] || "",
        email: r[3] || "", telefono: r[4] || "", note: r[5] || "",
      }));
      setClienti(rows);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchClienti(); }, []);

  const handleSave = async () => {
    if (!form.nome) { setError("Il nome è obbligatorio"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ _sheet: "Clienti", ...form }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setForm({ nome: "", cf: "", indirizzo: "", email: "", telefono: "", note: "" });
      setShowForm(false);
      fetchClienti();
    } catch (e) { setError("Errore durante il salvataggio."); }
    setSaving(false);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Clienti</h2>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? "✕ Annulla" : "+ Nuovo cliente"}
        </button>
      </div>

      {showForm && (
        <div className="form-wrap mb">
          <div className="form-grid">
            <div className="field full"><label>Nome / Ragione sociale</label>
              <input value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div className="field"><label>Codice fiscale</label>
              <input value={form.cf} onChange={e => set("cf", e.target.value)} /></div>
            <div className="field"><label>Telefono</label>
              <input value={form.telefono} onChange={e => set("telefono", e.target.value)} /></div>
            <div className="field full"><label>Indirizzo</label>
              <input value={form.indirizzo} onChange={e => set("indirizzo", e.target.value)} /></div>
            <div className="field full"><label>Email</label>
              <input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="field full"><label>Note</label>
              <input value={form.note} onChange={e => set("note", e.target.value)} /></div>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio…" : "Salva cliente"}
            </button>
          </div>
        </div>
      )}

      {loading ? <p className="loading">Caricamento…</p> : (
        clienti.length === 0
          ? <div className="empty"><p>Nessun cliente ancora.</p><p>Aggiungine uno con il pulsante in alto.</p></div>
          : <div className="list">
            {clienti.map((c, i) => (
              <div key={i} className="card">
                <div className="card-committente">{c.nome}</div>
                {c.cf && <div className="card-date">C.F. {c.cf}</div>}
                {c.indirizzo && <div className="card-desc">{c.indirizzo}</div>}
                <div className="card-importi">
                  {c.email && <span>✉ {c.email}</span>}
                  {c.telefono && <span>📞 {c.telefono}</span>}
                </div>
                {c.note && <div className="card-date" style={{marginTop:"6px"}}>📝 {c.note}</div>}
              </div>
            ))}
          </div>
      )}
    </div>
  );
}
