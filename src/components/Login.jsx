import { useState } from "react";

export default function Login({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const correct = import.meta.env.VITE_APP_PIN;
    if (pin === correct) {
      onLogin();
    } else {
      setError("PIN non corretto");
      setPin("");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">CM</div>
        <h1>Ricevute</h1>
        <p className="login-sub">Prestazioni professionali occasionali</p>
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="pin-input"
          maxLength={8}
          autoFocus
        />
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" onClick={handleSubmit}>Accedi</button>
      </div>
    </div>
  );
}
