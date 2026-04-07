const { Contract, Networks, rpc, TransactionBuilder, BASE_FEE, Keypair, nativeToScVal, Address } = require("@stellar/stellar-sdk");

const getRpcServer = () => new rpc.Server(process.env.STELLAR_RPC_URL);

const buildAndSend = async (operation) => {
  const server = getRpcServer();
  const issuerKeypair = Keypair.fromSecret(process.env.ISSUER_SECRET);
  const sourceAccount = await server.getAccount(issuerKeypair.publicKey());

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(issuerKeypair);
  return server.sendTransaction(prepared);
};

// POST /vaccination/issue
exports.issue = async (req, res) => {
  const { patient, vaccine_name, date } = req.body;
  if (!patient || !vaccine_name || !date)
    return res.status(400).json({ error: "patient, vaccine_name, date required" });

  const contract = new Contract(process.env.CONTRACT_ID);
  const issuerKeypair = Keypair.fromSecret(process.env.ISSUER_SECRET);

  const op = contract.call(
    "mint",
    new Address(issuerKeypair.publicKey()).toScVal(),
    new Address(patient).toScVal(),
    nativeToScVal(vaccine_name, { type: "string" }),
    nativeToScVal(BigInt(date), { type: "u64" })
  );

  const result = await buildAndSend(op);
  res.json({ success: true, hash: result.hash });
};

// GET /vaccination/:wallet
exports.getRecords = async (req, res) => {
  const { wallet } = req.params;
  const server = getRpcServer();
  const contract = new Contract(process.env.CONTRACT_ID);
  const issuerKeypair = Keypair.fromSecret(process.env.ISSUER_SECRET);
  const sourceAccount = await server.getAccount(issuerKeypair.publicKey());

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call("get_patient_tokens", new Address(wallet).toScVal())
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const sim = await server.simulateTransaction(prepared);

  if (rpc.Api.isSimulationError(sim)) {
    return res.status(400).json({ error: sim.error });
  }

  const tokenIds = sim.result?.retval;
  res.json({ wallet, tokens: tokenIds });
};

// GET /verify/:wallet  (also used as standalone route)
exports.verify = async (req, res) => {
  const { wallet } = req.params;
  const { vaccine_name } = req.query;
  if (!vaccine_name) return res.status(400).json({ error: "vaccine_name query param required" });

  const server = getRpcServer();
  const contract = new Contract(process.env.CONTRACT_ID);
  const issuerKeypair = Keypair.fromSecret(process.env.ISSUER_SECRET);
  const sourceAccount = await server.getAccount(issuerKeypair.publicKey());

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "verify",
        new Address(wallet).toScVal(),
        nativeToScVal(vaccine_name, { type: "string" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const sim = await server.simulateTransaction(prepared);

  if (rpc.Api.isSimulationError(sim)) {
    return res.status(400).json({ error: sim.error });
  }

  res.json({ wallet, vaccine_name, verified: true });
};
