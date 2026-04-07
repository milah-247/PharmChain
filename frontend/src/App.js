import React, { createContext, useContext, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PatientDashboard from "./pages/PatientDashboard";
import IssuerDashboard from "./pages/IssuerDashboard";
import VerifyPortal from "./pages/VerifyPortal";
import { connectWallet } from "./services/wallet";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function App() {
  const [auth, setAuth] = useState(null); // { wallet, token }

  const login = async () => {
    try {
      const result = await connectWallet();
      setAuth(result);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <AuthCtx.Provider value={{ auth, login, logout: () => setAuth(null) }}>
      <BrowserRouter>
        <nav>
          <strong>💉 VacciChain</strong>
          <Link to="/">Patient</Link>
          <Link to="/issuer">Issuer</Link>
          <Link to="/verify">Verify</Link>
          <span style={{ marginLeft: "auto" }}>
            {auth ? (
              <>
                <span style={{ fontSize: ".8rem", marginRight: "1rem" }}>
                  {auth.wallet.slice(0, 6)}…{auth.wallet.slice(-4)}
                </span>
                <button onClick={() => setAuth(null)}>Logout</button>
              </>
            ) : (
              <button onClick={login}>Connect Wallet</button>
            )}
          </span>
        </nav>
        <Routes>
          <Route path="/" element={<PatientDashboard />} />
          <Route path="/issuer" element={<IssuerDashboard />} />
          <Route path="/verify" element={<VerifyPortal />} />
        </Routes>
      </BrowserRouter>
    </AuthCtx.Provider>
  );
}
