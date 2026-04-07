import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { getVaccinations } from "../services/api";

export default function PatientDashboard() {
  const { auth, login } = useAuth();
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) return;
    getVaccinations(auth.wallet)
      .then((d) => setRecords(d.tokens ?? []))
      .catch((e) => setError(e.message));
  }, [auth]);

  if (!auth)
    return (
      <div className="page">
        <div className="card">
          <h2>Patient Dashboard</h2>
          <p style={{ margin: "1rem 0" }}>Connect your wallet to view your vaccination records.</p>
          <button onClick={login}>Connect Wallet</button>
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="card">
        <h2>My Vaccination Records</h2>
        <p style={{ fontSize: ".85rem", color: "#718096", marginBottom: "1rem" }}>
          Wallet: {auth.wallet}
        </p>
        {error && <p className="error">{error}</p>}
        {records === null ? (
          <p>Loading…</p>
        ) : records.length === 0 ? (
          <p>No vaccination records found.</p>
        ) : (
          records.map((tid) => (
            <div key={tid} className="card" style={{ background: "#ebf8ff" }}>
              <span className="badge badge-green">✓ Verified</span>
              <p style={{ marginTop: ".5rem" }}>Token ID: {String(tid)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
