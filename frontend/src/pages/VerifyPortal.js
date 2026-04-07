import React, { useState } from "react";
import { verifyVaccination } from "../services/api";

const VACCINES = ["COVID-19", "Influenza", "Hepatitis B", "MMR", "Polio", "Tetanus"];

export default function VerifyPortal() {
  const [wallet, setWallet] = useState("");
  const [vaccine, setVaccine] = useState(VACCINES[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyVaccination(wallet, vaccine);
      setResult(res.error ? { verified: false, error: res.error } : res);
    } catch (e) {
      setResult({ verified: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Vaccination Verification Portal</h2>
        <p style={{ color: "#718096", fontSize: ".9rem", margin: ".5rem 0 1rem" }}>
          For governments, schools, and employers to verify vaccination status on-chain.
        </p>
        <form onSubmit={check}>
          <label>Patient Wallet Address</label>
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="G..."
            required
          />
          <label>Vaccine to Verify</label>
          <select value={vaccine} onChange={(e) => setVaccine(e.target.value)}>
            {VACCINES.map((v) => <option key={v}>{v}</option>)}
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Checking…" : "Verify On-Chain"}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: "1.5rem" }}>
            {result.verified ? (
              <div className="card" style={{ background: "#f0fff4" }}>
                <span className="badge badge-green">✓ VERIFIED</span>
                <p style={{ marginTop: ".5rem" }}>
                  Wallet <strong>{wallet.slice(0, 8)}…</strong> has a valid{" "}
                  <strong>{vaccine}</strong> vaccination record on-chain.
                </p>
              </div>
            ) : (
              <div className="card" style={{ background: "#fff5f5" }}>
                <span className="badge badge-red">✗ NOT VERIFIED</span>
                <p style={{ marginTop: ".5rem" }}>
                  {result.error || "No valid vaccination record found."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
