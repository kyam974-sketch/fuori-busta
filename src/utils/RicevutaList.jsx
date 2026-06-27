import { generatePDF } from "../utils/pdf";

export default function RicevutaList({ ricevute }) {
  if (!ricevute.length) return (
    <div className="empty">
      <p>Nessuna ricevuta per questo anno.</p>
      <p>Clicca <strong>+ Nuova ricevuta</strong> per iniziare.</p>
    </div>
  );

  return (
    <div className="list">
      {ricevute.map((r, i) => (
        <div key={i} className="card">
          <div className="card-header">
            <div className="card-num">N. {r.numero}</div>
            <div className={`badge ${r.pagato === "SÌ" ? "paid" : "unpaid"}`}>
              {r.pagato === "SÌ" ? "Pagato" : "In attesa"}
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
  );
}
