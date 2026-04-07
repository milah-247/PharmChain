import React, { useState } from "react";
import { useAuth } from "../App";
import { issueVaccination } from "../services/api";

const VACCINES = ["COVID-19", "Influenza", "Hepatitis B", "MMR", "Polio", "Tetanus"];

export default function IssuerDashboard() {
  const { auth, login } = useAuth();
  const [form, setForm] = useState({ patient: "", vaccine_name: VACCINES[0], date: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await issueVaccination(auth.token, {
        ...form,
        date: Math.floor(new Date(form.date).getTime() / 1000),
      });
      if (res.error) throw new Error(res.error);
      setStatus({ ok: true, msg: `Issued! Tx: ${res.hash}` });
      setForm((f) => ({ ...f, patient: "", date: "" }));
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!auth)
    return (
      <div className="page">
        <div className="card">
          <h2>Issuer Dashboard</h2>
          <p style={{ margin: "1rem 0" }}>Connect your authorized issuer wallet to mint NFTs.</p>
          <button onClick={login}>Connect Wallet</button>
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="card">
        <h2>Issue Vaccination Certificate</h2>
        <form onSubmit={submit} style={{ marginTop: "1rem" }}>
          <label>Patient Wallet Address</label>
          <input
            value={form.patient}
            onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))}
            placeholder="G..."
            required
          />
          <label>Vaccine</label>
          <select
            value={form.vaccine_name}
            onChange={(e) => setForm((f) => ({ ...f, vaccine_name: e.target.value }))}
          >
            {VACCINES.map((v) => <option key={v}>{v}</option>)}
          </select>
          <label>Date Administered</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Issuing…" : "Issue Certificate"}
          </button>
        </form>
        {status && (
          <p className={status.ok ? "success" : "error"}>{status.msg}</p>
        )}
      </div>
    </div>
  );
}
