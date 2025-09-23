import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || "http://localhost:3000";

app.get("/", async (req, res) => {
  try {
    const { data } = await axios.get(`${API_URL}/`);
    res.send(`<h1>Painel Admin</h1><p>API respondeu: ${data}</p>`);
  } catch (err) {
    res.status(500).send("Erro ao conectar API");
  }
});

app.listen(PORT, () => {
  console.log(`Admin rodando em http://localhost:${PORT}`);
});