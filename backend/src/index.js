require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const vaccinationRoutes = require("./routes/vaccination");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/vaccination", vaccinationRoutes);
app.get("/verify/:wallet", require("./controllers/vaccination").verify);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VacciChain backend running on :${PORT}`));
