import { useState, useEffect } from "react";

const SCRIPT_URL = "/api/sheets";
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Profilo";

const PAGAMENTO_OPTIONS = ["Bonifico bancario", "Contanti", "PayPal", "Assegno"];

const EMPTY = {
  nome: "", cf: "", indirizzo: "", cap: "", citta: "", provincia: "",
  iban: "", intestatario: "", banca: "",
  pagamento: ["Bonifico bancario"],
  altroPayment: "",
};

export default function Profilo({ onUpdate }) {
  const [profilo, setProfilo] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setProfilo(f => ({ ...f, [k]: v }));

  const togglePagamento = (opt) => {
    setProfilo(f => {
      const cur = f.pagamento || [];
      return {
        ...f,
        pagamento: cur.includes(opt)
          ? cur.filter(o => o !== opt)
          : [...cur, opt]
      };
    });
  };

  const fetchProfilo = async () => {
    setLoading(true);
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME + "!A2:B20")}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.values) {
        const obj = {};
        data.values.forEach(([k, v]) => { obj[k] = v; });
        setProfilo({
          ...EMPTY,
          ...obj,
          pagamento: obj.pagamento ? obj.pagamento.split(",") : ["Bonifico bancario"],
        });
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchProfilo(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const rows = Object.entries({
      ...profilo,
      pagamento: profilo.pagamento.join(","),
    }).map(([k, v]) => [k, v]);

    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ _sheet: SHEET_NAME, _action: "replace", _rows: rows }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onUpdate) onUpdate(profilo);
  };

  if (loading) return <p className="loading">Caricamento…</p>;

  return (
    <div className="section">
      <div className="section-header">
        <h2>Profilo</h2>
      </div>

      <div className="form-wrap">
        <h3 className="form-section-title">Dati personali</h3>
        <div className="form-grid">
          <div className="field full"><label>Nome e cognome</label>
            <input value={profilo.nome} onChange={e => set("nome", e.target.value)} /></div>
          <div className="field full"><label>Codice fiscale</label>
            <input value={profilo.cf} onChange={e => set("cf", e.target.value)} /></div>
          <div className="field full"><label>Indirizzo</label>
            <input value={profilo.indirizzo} onChange={e => set("indirizzo", e.target.value)} /></div>
          <div className="field"><label>CAP</label>
            <input value={profilo.cap} onChange={e => set("cap", e.target.value)} /></div>
          <div className="field"><label>Città</label>
            <input value={profilo.citta} onChange={e => set("citta", e.target.value)} /></div>
          <div className="field"><label>Provincia</label>
            <input value={profilo.provincia} onChange={e => set("provincia", e.target.value)} maxLength={2} /></div>
        </div>

        <h3 className="form-section-title">Coordinate bancarie</h3>
        <div className="form-grid">
          <div className="field full"><label>IBAN</label>
            <input value={profilo.iban} onChange={e => set("iban", e.target.value)} placeholder="IT00 X000 0000 0000 0000 0000 000" /></div>
          <div className="field full"><label>Intestatario</label>
            <input value={profilo.intestatario} onChange={e => set("intestatario", e.target.value)} /></div>
          <div className="field full"><label>Banca</label>
            <input value={profilo.banca} onChange={e => set("banca", e.target.value)} /></div>
        </div>

        <h3 className="form-section-title">Modalità di pagamento accettate</h3>
        <div className="pagamento-options">
          {PAGAMENTO_OPTIONS.map(opt => (
            <label key={opt} className="pagamento-opt">
              <input
                type="checkbox"
                checked={profilo.pagamento?.includes(opt) || false}
                onChange={() => togglePagamento(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
          <label className="pagamento-opt">
            <input
              type="checkbox"
              checked={profilo.pagamento?.includes("Altro") || false}
              onChange={() => togglePagamento("Altro")}
            />
            <span>Altro</span>
          </label>
          {profilo.pagamento?.includes("Altro") && (
            <div className="field full" style={{marginTop: 8}}>
              <input
                value={profilo.altroPayment}
                onChange={e => set("altroPayment", e.target.value)}
                placeholder="Specifica modalità..."
              />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saved ? "✓ Salvato!" : saving ? "Salvataggio…" : "Salva profilo"}
          </button>
        </div>
      </div>
    </div>
  );
}
