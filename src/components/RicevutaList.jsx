import { useState } from "react";
import { generatePDF } from "../utils/pdf";
import Modal from "./Modal";

const SCRIPT_URL = "/api/sheets";
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const SHEET_NAME = "Ricevute Prestazioni Occasionali";

export default function RicevutaList({ ricevute, onRefresh }) {
  const [confirm, setConfirm] = useState(null);
  const [editModal, setEditModal] = useState(null); // { index, data }
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const ritenuta = form ? +(parseFloat(form.lordo) * 0.2).toFixed(2) : 0;
  const netto = form ? +(parseFloat(form.lordo) - ritenuta).toFixed(2) : 0;

  const startEdit = (r, index) => {
    setForm({ ...r });
    setEditModal({ index });
  };

  const handleUpdate = async () => {
    setSaving(true);
    const updated = ricevute.map((r, i) =>
      i === editModal.index ? { ...form, ritenuta, netto } : r
    );
    const rows = updated.map(r => [
      r.numero, r.data, r.annoFiscale, r.committente, r.cfCommittente,
      r.descrizione, r.lordo, r.ritenuta, r.netto, r.pagato, r.dataPagamento, r.note
    ]);
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ _sheet: SHEET_NAME, _action: "replace", _rows: rows }),
    });
    setSaving(false);
    setEditModal(null);
    setForm(null);
    onRefresh();
  };

  const handleDelete = async (index) => {
    const updated = ricevute.filter((_, i) => i !== index);
    const rows = updated.map(r => [
      r.numero, r.data, r.annoFiscale, r.committente, r.cfCommittente,
      r.descrizione, r.lordo, r.ritenuta, r.netto, r.pagato, r.dataPagamento, r.note
    ]);
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ _sheet: SHEET_NAME, _action: "replace", _rows: rows }),
    });
    setConfirm(null);
    onRefresh();
  };

  if (!ricevute.length) return (
    <div className="empty">
      <p>Nessuna ricevuta per questo anno.</p>
      <p>Clicca <strong>+ Nuova ricevuta</strong> per iniziare.</p>
    </div>
  );

  return (
    <>
      <div className="list">
        {ricevute.map((r, i) => (
          <div key={i} className="card">
            <div className="card-header">
              <div className="card-num">N. {r.numero}</div>
              <div style={{display:"flex", gap:6, alignItems:"center"}}>
                <div className={`badge ${r.pagato === "SÌ" ? "paid" : "unpaid"}`}>
                  {r.pagato === "SÌ" ? "Pagato" : "In attesa"}
                </div>
                <button className="btn-ghost small" onClick={() => startEdit(r, i)}>✏️</button>
                <button className="btn-ghost small danger" onClick={() => setConfirm(i)}>🗑️</button>
              </div>
            </div>
            <div className="card-date">{r.data}</div>
            <div className="card-committente">{r.committente}</div>
            <div className="card-desc">{r.descrizione}</div>
            <div className="card-importi">
              <span>Lordo <strong>€ {r.lordo.toFixed(2)}</strong></span>
              <span>Ritenuta <strong>€ {r.ritenuta.toFixed(2)}</strong></span>
              <span>Netto <strong>€ {r.netto.toFixed(2)}</strong></span>
            </div>
            {r.dataPagamento && <div className="card-pagamento">Pagato il {r.dataPagamento}</div>}
            <button className="btn-ghost small" onClick={() => generatePDF(r)}>📄 PDF</button>
          </div>
        ))}
      </div>

      {confirm !== null && (
        <Modal title="Elimina ricevuta" onClose={() => setConfirm(null)}>
          <p style={{margin:"16px 0"}}>Eliminare la ricevuta N. <strong>{ricevute[confirm]?.numero}</strong>?</p>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setConfirm(null)}>Annulla</button>
            <button className="btn-primary danger" onClick={() => handleDelete(confirm)}>Elimina</button>
          </div>
        </Modal>
      )}

      {editModal !== null && form && (
        <Modal title={`Modifica ricevuta N. ${form.numero}`} onClose={() => { setEditModal(null); setForm(null); }}>
          <div className="form-grid" style={{marginTop:16}}>
            <div className="field"><label>Data</label>
              <input value={form.data} onChange={e => set("data", e.target.value)} /></div>
            <div className="field"><label>Importo lordo (€)</label>
              <input type="number" value={form.lordo} onChange={e => set("lordo", parseFloat(e.target.value)||0)} /></div>
            <div className="field"><label>Ritenuta 20%</label>
              <input className="readonly" readOnly value={`€ ${ritenuta.toFixed(2)}`} /></div>
            <div className="field"><label>Netto</label>
              <input className="readonly" readOnly value={`€ ${netto.toFixed(2)}`} /></div>
            <div className="field"><label>Pagato</label>
              <select value={form.pagato} onChange={e => set("pagato", e.target.value)}>
                <option>NO</option><option>SÌ</option>
              </select>
            </div>
            <div className="field"><label>Data pagamento</label>
              <input value={form.dataPagamento} onChange={e => set("dataPagamento", e.target.value)} placeholder="gg/mm/aaaa" /></div>
            <div className="field full"><label>Note</label>
              <input value={form.note} onChange={e => set("note", e.target.value)} /></div>
          </div>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => { setEditModal(null); setForm(null); }}>Annulla</button>
            <button className="btn-primary" onClick={handleUpdate} disabled={saving}>
              {saving ? "Salvataggio…" : "Aggiorna"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
