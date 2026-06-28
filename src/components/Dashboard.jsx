import { useState, useEffect } from "react";
import RicevutaForm from "./RicevutaForm";
import RicevutaList from "./RicevutaList";
import Clienti from "./Clienti";
import Prestazioni from "./Prestazioni";
import Profilo from "./Profilo";

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Ricevute Prestazioni Occasionali";

export default function Dashboard({ onLogout }) {
  const [ricevute, setRicevute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [section, setSection] = useState("ricevute");
  const [anno, setAnno] = useState(new Date().getFullYear().toString());

  const fetchRicevute = async () => {
    setLoading(true);
    try {
      const range = `${SHEET_NAME}!A2:L200`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = (data.values || []).map(r => ({
        numero: r[0] || "", data: r[1] || "", annoFiscale: r[2] || "",
        committente: r[3] || "", cfCommittente: r[4] || "", descrizione: r[5] || "",
        lordo: parseFloat(r[6]) || 0, ritenuta: parseFloat(r[7]) || 0, netto: parseFloat(r[8]) || 0,
        pagato: r[9] || "NO", dataPagamento: r[10] || "", note: r[11] || "",
      }));
      setRicevute(rows);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchRicevute(); }, []);

  const anni = [...new Set(ricevute.map(r => r.annoFiscale))].sort().reverse();
  const filtered = ricevute.filter(r => r.annoFiscale === anno);

  const totLordo = filtered.reduce((s, r) => s + r.lordo, 0);
  const totRitenuta = filtered.reduce((s, r) => s + r.ritenuta, 0);
  const totNetto = filtered.reduce((s, r) => s + r.netto, 0);
  const totIncassato = filtered.filter(r => r.pagato === "SÌ").reduce((s, r) => s + r.netto, 0);
  const totDaIncassare = filtered.filter(r => r.pagato !== "SÌ").reduce((s, r) => s + r.netto, 0);

  const sections = ["ricevute", "clienti", "prestazioni", "profilo"];

  return (
    <div className="dashboard">
      <header className="top-bar">
        <div className="brand">fuori busta</div>
        <nav className="nav-tabs">
          {sections.map(s => (
            <button
              key={s}
              className={`nav-tab ${section === s ? "active" : ""}`}
              onClick={() => { setSection(s); setView("list"); }}
            >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </nav>
        <button className="btn-ghost" onClick={onLogout}>Esci</button>
      </header>

      {section === "ricevute" && (
        <main className="main-content">
          {view === "list" && (
            <>
              <div className="section-header">
                <div className="filters">
                  <span className="label">Anno</span>
                  <div className="anno-tabs">
                    {anni.map(a => (
                      <button key={a} className={`anno-tab ${a === anno ? "active" : ""}`}
                        onClick={() => setAnno(a)}>{a}</button>
                    ))}
                  </div>
                </div>
                <button className="btn-primary" onClick={() => setView("new")}>+ Nuova ricevuta</button>
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
                  <span className="tot-label">Netto totale</span>
                  <span className="tot-val">€ {totNetto.toFixed(2)}</span>
                </div>
                <div className="tot-card green">
                  <span className="tot-label">✓ Incassato</span>
                  <span className="tot-val">€ {totIncassato.toFixed(2)}</span>
                </div>
                <div className="tot-card orange">
                  <span className="tot-label">⏳ Da incassare</span>
                  <span className="tot-val">€ {totDaIncassare.toFixed(2)}</span>
                </div>
              </div>

              {loading ? <p className="loading">Caricamento…</p>
                : <RicevutaList ricevute={filtered} onRefresh={fetchRicevute} />}
            </>
          )}

          {view === "new" && (
            <>
              <div className="section-header">
                <button className="btn-ghost" onClick={() => setView("list")}>← Lista</button>
              </div>
              <RicevutaForm
                nextNumero={ricevute.length ? Math.max(...ricevute.map(r => parseInt(r.numero) || 0)) + 1 : 1}
                onSaved={() => { fetchRicevute(); setView("list"); }}
              />
            </>
          )}
        </main>
      )}

      {section === "clienti" && <main className="main-content"><Clienti /></main>}
      {section === "prestazioni" && <main className="main-content"><Prestazioni /></main>}
      {section === "profilo" && <main className="main-content"><Profilo /></main>}
    </div>
  );
}
