import express from "express";
import axios from "axios";
import path from "path";
import cors from "cors";
import { fileURLToPath } from 'url';
import session from "express-session";
import { requireLogin } from "./src/middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3001; 
const API_URL = process.env.API_URL || "http://localhost:3000";

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:3001",
  credentials: true
}));

app.use(session({
  secret: '11ad3ccffde67811affe77134e2712d65d637c23ef8d51b2703a347259721b3a490a42b84fd03b1fe3085435a49b05ea93227bbf134e88ca875550b289edbf88', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 3600000
  } 
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

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

//Rotas de Login
app.post('/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, req.body, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const apiCookies = response.headers['set-cookie'];
    
    if (apiCookies) {
      const sessionCookie = apiCookies.find(cookie => cookie.startsWith('connect.sid'));
      
      if (sessionCookie) {
        req.session.apiSessionCookie = sessionCookie.split(';')[0]; // Salvar na sessão do admin
      }
    }

    req.session.user = {
      id: response.data.user?.id,
      nome: response.data.user?.nome,
      usuario: response.data.user?.usuario,
      tipo_usuario: response.data.user?.tipo_usuario
    };
    req.session.isLoggedIn = true;

    req.session.save((err) => {
      if (err) {
        console.error('Erro ao salvar sessão:', err);
        return res.status(500).json({ message: 'Erro ao criar sessão' });
      }
      
      res.json({
        success: true,
        redirectUrl: "/dashboard"
      });
    });
  } catch (err) {
    console.error("Erro no proxy de login:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      message: err.response?.data?.message || "Erro ao autenticar"
    });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao encerrar sessão.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logout realizado com sucesso.' });
  });
});

//Rotas de Cliente

//Cadastrar
app.post('/clientes', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({
        message: "Sessão expirada. Faça login novamente."
      });
    }

    console.log('Enviando requisição para API com cookie:', req.session.apiSessionCookie);

    const response = await axios.post(`${API_URL}/api/clientes`, req.body, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Erro no proxy de cadastro:", err.response?.data || err.message);

    if (err.response?.status === 401) {
      req.session.destroy();
      return res.status(401).json({
        message: "Sessão expirada. Faça login novamente."
      });
    }
    
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao cadastrar cliente"
    });
  }
});

app.get('/clientes', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const response = await axios.get(`${API_URL}/api/clientes`, {
      withCredentials: true,
      headers: {
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao listar clientes:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao buscar clientes"
    });
  }
});

//Buscar por id
app.get('/clientes/:id', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const response = await axios.get(`${API_URL}/api/clientes/${req.params.id}`, {
      withCredentials: true,
      headers: {
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao buscar cliente:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao buscar cliente"
    });
  }
});

//Buscar por nome
app.get('/clientes/buscar-nome/:nome', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const response = await axios.get(`${API_URL}/api/clientes/buscar-nome/${req.params.nome}`, {
      withCredentials: true,
      headers: {
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao buscar por nome:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao buscar cliente"
    });
  }
});

//Update Cliente
app.put('/clientes/:id', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const response = await axios.put(`${API_URL}/api/clientes/${req.params.id}`, req.body, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao atualizar cliente:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao atualizar cliente"
    });
  }
});

//Deletar Cliente
app.delete('/clientes/:id', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const response = await axios.delete(`${API_URL}/api/clientes/${req.params.id}`, {
      withCredentials: true,
      headers: {
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao deletar cliente:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao deletar cliente"
    });
  }
});

//Registrar Refeição
app.post('/clientes/:id/registrar', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const response = await axios.post(`${API_URL}/api/clientes/${req.params.id}/registrar`, {}, {
      withCredentials: true,
      headers: {
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao registrar refeição:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao registrar refeição"
    });
  }
});

//Resgatar premio
app.post('/clientes/:id/resgatar', requireLogin, async (req, res) => {
  try {
    if (!req.session.apiSessionCookie) {
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    const response = await axios.post(`${API_URL}/api/clientes/${req.params.id}/resgatar`, {}, {
      withCredentials: true,
      headers: {
        'Cookie': req.session.apiSessionCookie
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Erro ao resgatar cortesia:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error || "Erro ao resgatar cortesia"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Admin rodando em http://localhost:${PORT}`);
});