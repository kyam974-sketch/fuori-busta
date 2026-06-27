import { useState, useEffect } from "react";

const SCRIPT_URL = import.meta.env.VITE_SHEETS_SCRIPT_URL;
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Prestazioni";

const CATEGORIE = ["Consulenza", "Traduzione", "Lezioni private", "Gestione burocratica", "Altro"];

export default function Prestazioni() {
  const [prestazioni, setPrestazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ descrizione: "", importo: "", categoria: "Consulenza" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchPrestazioni = async () => {
    setLoading(true);
    try {
      const range = `${SHEET_NAME}!A2:C100`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = (data.values || []).map(r => ({
        descrizione: r[0] || "", importo: r[1] || "", categoria: r[2] || "",
      }));
      setPrestazioni(rows);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchPrestazioni(); }, []);

  const handleSave = async () => {
    if (!form.descrizione) { setError("La descrizione è obbligatoria"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ _sheet: "Prestazioni", ...form }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setForm({ descrizione: "", importo: "", categoria: "Consulenza" });
      setShowForm(false);
      fetchPrestazioni();
    } catch (e) { setError("Errore durante il salvataggio."); }
    setSaving(false);
  };

  const categorie = [...new Set(prestazioni.map(p => p.categoria))];

  return (
    <div className="section">
      <div className="section-header">
        <h2>Prestazioni</h2>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? "✕ Annulla" : "+ Nuova prestazione"}
        </button>
      </div>

      {showForm && (
        <div className="form-wrap mb">
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
              {saving ? "Salvataggio…" : "Salva prestazione"}
            </button>
          </div>
        </div>
      )}

      {loading ? <p className="loading">Caricamento…</p> : (
        prestazioni.length === 0
          ? <div className="empty"><p>Nessuna prestazione ancora.</p><p>Aggiungine una con il pulsante in alto.</p></div>
          : <div>
            {(categorie.length ? categorie : ["Altro"]).map(cat => {
              const items = prestazioni.filter(p => p.categoria === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="cat-group">
                  <div className="cat-label">{cat}</div>
                  <div className="list">
                    {items.map((p, i) => (
                      <div key={i} className="card">
                        <div className="card-committente">{p.descrizione}</div>
                        {p.importo && (
                          <div className="card-importi" style={{marginTop:"6px"}}>
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
      )}
    </div>
  );
}
