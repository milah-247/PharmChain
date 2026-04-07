const {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  StellarTomlResolver,
} = require("@stellar/stellar-sdk");
const jwt = require("jsonwebtoken");

// SEP-10: challenge → verify → JWT
exports.challenge = async (req, res) => {
  const { account } = req.body;
  if (!account) return res.status(400).json({ error: "account required" });

  const serverKeypair = Keypair.fromSecret(process.env.ISSUER_SECRET);
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Minimal SEP-10 challenge transaction (manage data op)
  const { Horizon } = require("@stellar/stellar-sdk");
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const serverAccount = await server.loadAccount(serverKeypair.publicKey());

  const tx = new TransactionBuilder(serverAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: "vaccichain auth",
        value: nonce,
        source: account,
      })
    )
    .setTimeout(300)
    .build();

  tx.sign(serverKeypair);
  res.json({ transaction: tx.toXDR() });
};

exports.verify = async (req, res) => {
  const { transaction } = req.body;
  if (!transaction) return res.status(400).json({ error: "transaction required" });

  try {
    const { Transaction, Networks } = require("@stellar/stellar-sdk");
    const tx = new Transaction(transaction, Networks.TESTNET);

    // Extract the source account (patient wallet) from the manage_data op
    const op = tx.operations.find((o) => o.type === "manageData");
    if (!op) return res.status(400).json({ error: "invalid challenge" });

    const wallet = op.source || tx.source;
    const token = jwt.sign({ wallet }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, wallet });
  } catch (e) {
    res.status(401).json({ error: "invalid transaction" });
  }
};
