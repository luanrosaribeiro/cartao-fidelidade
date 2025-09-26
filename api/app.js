
const express = require('express');
const session = require('express-session');
const path = require('path');
const clientesRouter = require('./src/routes/clientes');
const authRouter = require('./src/routes/auth');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Sessão
app.use(session({
  secret: 'sua-chave-secreta-muito-segura',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const requireLogin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.status(401).send('Acesso não autorizado.');
  }
};

app.use('/api/auth', authRouter);
app.use('/api/clientes', requireLogin, clientesRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
