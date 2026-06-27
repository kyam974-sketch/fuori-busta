import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("rcv_auth");
    if (auth === "true") setAuthenticated(true);
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem("rcv_auth", "true");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("rcv_auth");
    setAuthenticated(false);
  };

  return authenticated
    ? <Dashboard onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />;
}
