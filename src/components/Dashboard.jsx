import { useState, useEffect } from "react";
import RicevutaForm from "./RicevutaForm";
import RicevutaList from "./RicevutaList";

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Ricevute Prestazioni Occasionali";

export default function Dashboard({ onLogout }) {
  const [ricevute, setRicevute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | new
  const [anno, setAnno] = useState(new Date().getFullYear().toString());

  const fetchRicevute = async () => {
    setLoading(true);
    try {
      const range = `${SHEET_NAME}!A2:L200`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = (data.values || []).map(r => ({
        numero: r[0] || "",
        data: r[1] || "",
        annoFiscale: r[2] || "",
        committente: r[3] || "",
        cfCommittente: r[4] || "",
        descrizione: r[5] || "",
        lordo: parseFloat(r[6]) || 0,
        ritenuta: parseFloat(r[7]) || 0,
        netto: parseFloat(r[8]) || 0,
        pagato: r[9] || "NO",
        dataPagamento: r[10] || "",
        note: r[11] || "",
      }));
      setRicevute(rows);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRicevute(); }, []);

  const anni = [...new Set(ricevute.map(r => r.annoFiscale))].sort().reverse();
  const filtered = ricevute.filter(r => r.annoFiscale === anno);
  const totLordo = filtered.reduce((s, r) => s + r.lordo, 0);
  const totRitenuta = filtered.reduce((s, r) => s + r.ritenuta, 0);
  const totNetto = filtered.reduce((s, r) => s + r.netto, 0);

  return (
    <div className="dashboard">
      <header className="top-bar">
        <div className="brand">CM · Ricevute</div>
        <div className="top-actions">
          {view === "list"
            ? <button className="btn-primary" onClick={() => setView("new")}>+ Nuova ricevuta</button>
            : <button className="btn-ghost" onClick={() => setView("list")}>← Lista</button>
          }
          <button className="btn-ghost" onClick={onLogout}>Esci</button>
        </div>
      </header>

      {view === "list" && (
        <main className="main-content">
          <div className="filters">
            <span className="label">Anno fiscale</span>
            <div className="anno-tabs">
              {anni.map(a => (
                <button
                  key={a}
                  className={`anno-tab ${a === anno ? "active" : ""}`}
                  onClick={() => setAnno(a)}
                >{a}</button>
              ))}
            </div>
          </div>

          <div className="totali">
            <div className="tot-card">
              <span className="tot-label">Lordo</span>
              <span className="tot-val">€ {totLordo.toFixed(2)}</span>
            </div>
            <div className="tot-card accent">
              <span className="tot-label">Ritenuta</span>
              <span className="tot-val">€ {totRitenuta.toFixed(2)}</span>
            </div>
            <div className="tot-card">
              <span className="tot-label">Netto incassato</span>
              <span className="tot-val">€ {totNetto.toFixed(2)}</span>
            </div>
          </div>

          {loading
            ? <p className="loading">Caricamento…</p>
            : <RicevutaList ricevute={filtered} onRefresh={fetchRicevute} />
          }
        </main>
      )}

      {view === "new" && (
        <main className="main-content">
          <RicevutaForm
            nextNumero={ricevute.length + 1}
            onSaved={() => { fetchRicevute(); setView("list"); }}
          />
        </main>
      )}
    </div>
  );
}
