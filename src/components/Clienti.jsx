import { useState, useEffect } from "react";
import Modal from "./Modal";

const SCRIPT_URL = "/api/sheets";
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Clienti";

const EMPTY = { nome: "", cf: "", via: "", civico: "", cap: "", citta: "", provincia: "", email: "", telefono: "", note: "" };

export default function Clienti() {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchClienti = async () => {
    setLoading(true);
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME + "!A2:J100")}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setClienti((data.values || []).map(r => ({
        nome: r[0]||"", cf: r[1]||"", via: r[2]||"", civico: r[3]||"",
        cap: r[4]||"", citta: r[5]||"", provincia: r[6]||"",
        email: r[7]||"", telefono: r[8]||"", note: r[9]||"",
      })));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchClienti(); }, []);

  const toRows = (list) => list.map(c => [
    c.nome, c.cf, c.via, c.civico, c.cap, c.citta, c.provincia, c.email, c.telefono, c.note
  ]);

  const handleSave = async () => {
    if (!form.nome) { setError("Il nome è obbligatorio"); return; }
    setSaving(true); setError("");
    try {
      if (editing !== null) {
        const updated = clienti.map((c, i) => i === editing.index ? form : c);
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ _sheet: SHEET_NAME, _action: "replace", _rows: toRows(updated) }),
        });
      } else {
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ _sheet: SHEET_NAME, ...form }),
        });
      }
      setForm(EMPTY); setShowForm(false); setEditing(null);
      fetchClienti();
    } catch(e) { setError("Errore durante il salvataggio."); }
    setSaving(false);
  };

  const handleDelete = async (index) => {
    const updated = clienti.filter((_, i) => i !== index);
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ _sheet: SHEET_NAME, _action: "replace", _rows: toRows(updated) }),
    });
    setConfirm(null);
    fetchClienti();
  };

  const startEdit = (c, index) => {
    setForm({ ...EMPTY, ...c });
    setEditing({ index });
    setShowForm(true);
  };

  const formatIndirizzo = (c) => {
    const parts = [];
    if (c.via) parts.push(c.via + (c.civico ? ` ${c.civico}` : ""));
    const cittaParts = [c.cap, c.citta, c.provincia ? `(${c.provincia})` : ""].filter(Boolean);
    if (cittaParts.length) parts.push(cittaParts.join(" "));
    return parts.join(" – ");
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Clienti</h2>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(s => !s); }}>
          {showForm ? "✕ Annulla" : "+ Nuovo cliente"}
        </button>
      </div>

      {showForm && (
        <div className="form-wrap mb">
          <h3 style={{marginBottom:16}}>{editing !== null ? "Modifica cliente" : "Nuovo cliente"}</h3>
          <div className="form-grid">
            <div className="field full"><label>Nome / Ragione sociale</label>
              <input value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div className="field"><label>Codice fiscale</label>
              <input value={form.cf} onChange={e => set("cf", e.target.value)} /></div>
            <div className="field"><label>Telefono</label>
              <input value={form.telefono} onChange={e => set("telefono", e.target.value)} /></div>

            <div className="field" style={{gridColumn:"span 2"}}><label>Via</label>
              <input value={form.via} onChange={e => set("via", e.target.value)} /></div>
            <div className="field"><label>N. civico</label>
              <input value={form.civico} onChange={e => set("civico", e.target.value)} /></div>

            <div className="field"><label>CAP</label>
              <input value={form.cap} onChange={e => set("cap", e.target.value)} /></div>
            <div className="field" style={{gridColumn:"span 2"}}><label>Città</label>
              <input value={form.citta} onChange={e => set("citta", e.target.value)} /></div>
            <div className="field"><label>Provincia</label>
              <input value={form.provincia} onChange={e => set("provincia", e.target.value)} maxLength={2} /></div>

            <div className="field full"><label>Email</label>
              <input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="field full"><label>Note</label>
              <input value={form.note} onChange={e => set("note", e.target.value)} /></div>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio…" : editing !== null ? "Aggiorna" : "Salva cliente"}
            </button>
          </div>
        </div>
      )}

      {loading ? <p className="loading">Caricamento…</p> : clienti.length === 0
        ? <div className="empty"><p>Nessun cliente ancora.</p></div>
        : <div className="list">
          {clienti.map((c, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <div className="card-committente">{c.nome}</div>
                <div className="card-actions">
                  <button className="btn-ghost small" onClick={() => startEdit(c, i)}>✏️</button>
                  <button className="btn-ghost small danger" onClick={() => setConfirm(i)}>🗑️</button>
                </div>
              </div>
              {c.cf && <div className="card-date">C.F. {c.cf}</div>}
              {formatIndirizzo(c) && <div className="card-desc">{formatIndirizzo(c)}</div>}
              <div className="card-importi">
                {c.email && <span>✉ {c.email}</span>}
                {c.telefono && <span>📞 {c.telefono}</span>}
              </div>
              {c.note && <div className="card-date" style={{marginTop:6}}>📝 {c.note}</div>}
            </div>
          ))}
        </div>
      }

      {confirm !== null && (
        <Modal title="Elimina cliente" onClose={() => setConfirm(null)}>
          <p style={{margin:"16px 0"}}>Eliminare <strong>{clienti[confirm]?.nome}</strong>?</p>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setConfirm(null)}>Annulla</button>
            <button className="btn-primary danger" onClick={() => handleDelete(confirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
