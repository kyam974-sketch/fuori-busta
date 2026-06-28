import { useState, useEffect } from "react";
import Modal from "./Modal";

const SCRIPT_URL = "/api/sheets";
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Prestazioni";
const CATEGORIE = ["Consulenza", "Traduzione", "Lezioni private", "Gestione burocratica", "Altro"];
const EMPTY = { descrizione: "", importo: "", categoria: "Consulenza" };

export default function Prestazioni() {
  const [prestazioni, setPrestazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchPrestazioni = async () => {
    setLoading(true);
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME + "!A2:C100")}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setPrestazioni((data.values || []).map(r => ({
        descrizione: r[0]||"", importo: r[1]||"", categoria: r[2]||"",
      })));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchPrestazioni(); }, []);

  const handleSave = async () => {
    if (!form.descrizione) { setError("La descrizione è obbligatoria"); return; }
    setSaving(true); setError("");
    try {
      if (editing !== null) {
        const updated = prestazioni.map((p, i) => i === editing.index ? form : p);
        const rows = updated.map(p => [p.descrizione, p.importo, p.categoria]);
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ _sheet: SHEET_NAME, _action: "replace", _rows: rows }),
        });
      } else {
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ _sheet: SHEET_NAME, ...form }),
        });
      }
      setForm(EMPTY); setShowForm(false); setEditing(null);
      fetchPrestazioni();
    } catch(e) { setError("Errore durante il salvataggio."); }
    setSaving(false);
  };

  const handleDelete = async (index) => {
    const updated = prestazioni.filter((_, i) => i !== index);
    const rows = updated.map(p => [p.descrizione, p.importo, p.categoria]);
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ _sheet: SHEET_NAME, _action: "replace", _rows: rows }),
    });
    setConfirm(null);
    fetchPrestazioni();
  };

  const startEdit = (p, index) => {
    setForm({ ...p });
    setEditing({ index });
    setShowForm(true);
  };

  const categorie = [...new Set(prestazioni.map(p => p.categoria))];

  return (
    <div className="section">
      <div className="section-header">
        <h2>Prestazioni</h2>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(s => !s); }}>
          {showForm ? "✕ Annulla" : "+ Nuova prestazione"}
        </button>
      </div>

      {showForm && (
        <div className="form-wrap mb">
          <h3 style={{marginBottom:16}}>{editing !== null ? "Modifica prestazione" : "Nuova prestazione"}</h3>
          <div className="form-grid">
            <div className="field full"><label>Descrizione</label>
              <input value={form.descrizione} onChange={e => set("descrizione", e.target.value)} /></div>
            <div className="field"><label>Importo predefinito (€)</label>
              <input type="number" value={form.importo} onChange={e => set("importo", e.target.value)} /></div>
            <div className="field"><label>Categoria</label>
              <select value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                {CATEGORIE.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio…" : editing !== null ? "Aggiorna" : "Salva prestazione"}
            </button>
          </div>
        </div>
      )}

      {loading ? <p className="loading">Caricamento…</p> : prestazioni.length === 0
        ? <div className="empty"><p>Nessuna prestazione ancora.</p></div>
        : <div>
          {(categorie.length ? categorie : ["Altro"]).map(cat => {
            const items = prestazioni.map((p, i) => ({...p, _i: i})).filter(p => p.categoria === cat);
            if (!items.length) return null;
            return (
              <div key={cat} className="cat-group">
                <div className="cat-label">{cat}</div>
                <div className="list">
                  {items.map((p) => (
                    <div key={p._i} className="card">
                      <div className="card-header">
                        <div className="card-committente">{p.descrizione}</div>
                        <div className="card-actions">
                          <button className="btn-ghost small" onClick={() => startEdit(p, p._i)}>✏️</button>
                          <button className="btn-ghost small danger" onClick={() => setConfirm(p._i)}>🗑️</button>
                        </div>
                      </div>
                      {p.importo && (
                        <div className="card-importi" style={{marginTop:6}}>
                          <span>Importo predefinito <strong>€ {parseFloat(p.importo).toFixed(2)}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      }

      {confirm !== null && (
        <Modal title="Elimina prestazione" onClose={() => setConfirm(null)}>
          <p style={{margin:"16px 0"}}>Eliminare <strong>{prestazioni[confirm]?.descrizione}</strong>?</p>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setConfirm(null)}>Annulla</button>
            <button className="btn-primary danger" onClick={() => handleDelete(confirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
