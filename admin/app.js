import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from 'url';
import session from "express-session";
import { requireLogin } from "./src/middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

const PORT = process.env.PORT || 3001; 
const API_URL = process.env.API_URL || "http://localhost:3000";


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'chave-secreta-admin-muito-segura-e-longa', 
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 3600000
  } 
}));


// === Rotas Públicas e Protegidas ===

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// Rotas protegidas (só acessíveis com login)
app.get('/dashboard', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'dashboard.html'));
});

app.get('/cadastrar-cliente', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'cadastrar-cliente.html'));
});

app.get('/gerenciar-cartao', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'gerenciar-cartao-detalhe.html'));
});

app.get('/log-sistema', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'log-sistema.html'));
});

app.listen(PORT, () => {
  console.log(`Admin rodando em http://localhost:${PORT}`);
});
