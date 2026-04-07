const API = process.env.REACT_APP_API_URL || "";

export const getVaccinations = (wallet) =>
  fetch(`${API}/vaccination/${wallet}`).then((r) => r.json());

export const issueVaccination = (token, body) =>
  fetch(`${API}/vaccination/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const verifyVaccination = (wallet, vaccine_name) =>
  fetch(`${API}/verify/${wallet}?vaccine_name=${encodeURIComponent(vaccine_name)}`).then(
    (r) => r.json()
  );
