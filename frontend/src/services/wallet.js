import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";

const API = process.env.REACT_APP_API_URL || "";

export async function connectWallet() {
  const connected = await isConnected();
  if (!connected) throw new Error("Freighter wallet not found. Please install it.");

  const wallet = await getPublicKey();

  // SEP-10 challenge
  const chalRes = await fetch(`${API}/auth/sep10`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account: wallet }),
  });
  const { transaction } = await chalRes.json();

  // Sign with Freighter
  const signed = await signTransaction(transaction, { network: "TESTNET" });

  // Verify
  const verRes = await fetch(`${API}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: signed }),
  });
  const { token } = await verRes.json();
  return { wallet, token };
}
