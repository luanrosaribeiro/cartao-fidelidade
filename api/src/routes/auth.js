const express = require('express');
const pool = require('../../db');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, tipo_usuario FROM usuario WHERE cpf = $1 AND senha = $2',
      [usuario, senha]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      req.session.isLoggedIn = true;
      req.session.userId = user.id;
      req.session.userType = user.tipo_usuario;
      res.json({ 
        success: true,
        user: { 
          id: user.id, 
          tipo_usuario: user.tipo_usuario 
        } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao encerrar sessão.' });
    }
    res.clearCookie('connect.sid'); 
    res.json({ success: true, message: 'Logout realizado com sucesso.' });
  });
});

module.exports = router;