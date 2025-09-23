import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432
});

app.get("/", (req, res) => res.send("API Cartão Fidelidade rodando 🚀"));

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});