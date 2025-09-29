const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const clientesRouter = require('./src/routes/clientes');
const authRouter = require('./src/routes/auth');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

//Sessão configurada corretamente
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

const requireLogin = (req, res, next) => {
  console.log('Verificando sessão:', req.session);
  
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.status(401).json({ error: 'Acesso não autorizado.' });
  }
};

app.use('/api/auth', authRouter);
app.use('/api/clientes', requireLogin, clientesRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});