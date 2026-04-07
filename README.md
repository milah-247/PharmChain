# PharmChain

PharmChain is a decentralized drug supply chain tracking system built on the Stellar blockchain. It enables end-to-end verification of pharmaceutical products by tokenizing drug batches and tracking their movement across the supply chain.

Each drug batch is represented as a unique on-chain asset and transferred between participants (manufacturer, distributor, pharmacy, patient). Any break in the chain of custody is detected and flagged as potential counterfeit activity.

---

## Problem Statement

Counterfeit drugs are a major issue in emerging markets, leading to health risks and loss of trust in healthcare systems. Traditional tracking systems are fragmented and prone to manipulation.

PharmChain provides a transparent and tamper-proof solution for verifying drug authenticity.

---

## Features

### Blockchain / Smart Contract
- Tokenization of drug batches as unique assets
- On-chain tracking of ownership transfers
- Chain-of-custody validation
- Counterfeit detection when transfer sequence is broken
- Asset clawback for compromised batches
- Role-based access control

### Backend
- Node.js and Express API
- SEP-10 wallet authentication
- Integration with Stellar SDK
- Batch creation, transfer, and verification endpoints

### Frontend
- React application
- Wallet integration (Freighter or Albedo)
- Role-based dashboards:
  - Manufacturer
  - Distributor
  - Pharmacy
- Public verification interface

### Python Service
- FastAPI analytics service
- Counterfeit detection monitoring
- Supply chain insights and reporting

### DevOps
- Dockerized services
- Docker Compose orchestration

---
```
## Project Structure
/pharm-chain
│
├── contracts/ # Soroban smart contracts (Rust)
├── backend/ # Node.js / Express API
│ ├── controllers/
│ ├── services/
│ └── index.js
│
├── frontend/ # React application
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ └── App.js
│ └── package.json
│
├── python-service/ # FastAPI analytics service
│ └── main.py
│
├── docker/ # Dockerfiles
├── docker-compose.yml
└── README.md
```


---

## How It Works

1. Manufacturer creates a drug batch and tokenizes it on-chain
2. The batch is transferred through:
   - Distributor
   - Pharmacy
   - Patient
3. Each transfer is recorded and validated
4. Any invalid transfer or missing step flags the batch as counterfeit
5. Authorities can verify authenticity at any stage

---

## API Endpoints

### Authentication
- POST /auth/sep10
- POST /auth/verify

### Drug Batch
- POST /batch/create
- POST /batch/transfer
- GET /batch/:id
- GET /batch/:id/history

### Verification
- GET /verify/:id

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/pharm-chain.git
cd pharm-chain
2. Backend Setup
cd backend
npm install
cp .env.example .env

Configure:

Stellar RPC / Soroban endpoint
SEP-10 authentication settings
Issuer keys (development only)
3. Frontend Setup
cd frontend
npm install
4. Run with Docker
docker-compose up --build
Security Considerations
Enforce role-based permissions (manufacturer, distributor, pharmacy)
Validate trustlines before asset transfers
Prevent duplicate batch creation
Protect against SEP-10 replay attacks
Ensure integrity of chain-of-custody data
Log all transactions for auditability
Restrict clawback functionality to authorized entities
Use Cases
Pharmaceutical supply chain tracking
Government drug verification systems
Pharmacy-level authenticity checks
Anti-counterfeit enforcement
Future Improvements
Integration with IoT devices for real-time tracking
Mobile application for field verification
Decentralized identity (DID) integration
Cross-border supply chain support
```
License

MIT License
