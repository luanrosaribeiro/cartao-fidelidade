const express = require('express');
const pool = require('../../db');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');

//Rota para cadastro de usuário
router.post('/', requireLogin, async (req, res) => {
  var { nome, cpf, telefone, email, tipo, idRestaurante} = req.body;
  if (!nome || !cpf || !telefone || !email) {
    return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios.' });
  }
  var client = await pool.connect();
  try {
    var usuario = await client.query(
      `
        INSERT INTO usuario (nome, cpf, telefone, email, senha, tipo_usuario)
        VALUES ($1, $2, $3, $4, '123456', $5)
        RETURNING id
      `, [nome, cpf, telefone, email, tipo]);
    var id_usuario = usuario.rows[0].id;
    if(tipo == 'CAIXA'){
    await client.query(
        `
        INSERT INTO caixa (id_usuario, id_restaurante)
        VALUES ($1, $2)
        `, [id_usuario, idRestaurante]);
        res.json({ success: true });
    } else if(tipo == 'CAIXAMOVEL'){
        await client.query(
        `
            INSERT INTO CAIXAMOVEL (id_usuario, id_restaurante)
            VALUES ($1, $2)
        `, [id_usuario, idRestaurante]);
        res.json({ success: true });
    } else if (tipo == 'ADMIN'){
        await client.query(
        `
            INSERT INTO administrador (id_usuario)
            VALUES ($1)
        `, [id_usuario]);
        res.json({ success: true });
    } else {
        res.json({success: false, error: 'Tipo de client incorreto.'});
    }
  } catch (err) {
    console.error(err);
    let msg = 'Erro interno do servidor.';
    if (err.code === '23505') { // Unique violation
      msg = 'CPF ou email já cadastrado.';
    }
    res.status(500).json({ success: false, error: msg });
  } finally {
    client.release();
  }
});

//Rota para cadastro de Restaurante
router.post('/restaurante', requireLogin, async (req, res) => {
  var { nome, endereco, cnpj, telefone} = req.body;
  if (!nome || !endereco || !telefone || !cnpj) {
    return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios.' });
  }
  var client = await pool.connect();
  try {
    var restaurante = await client.query(
      `
        INSERT INTO restaurante (nome, endereco, cnpj, telefone)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [nome, endereco, cnpj, telefone]); 
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    let msg = 'Erro interno do servidor.';
    if (err.code === '23505') { // Unique violation
      msg = 'CNPJ já cadastrado.';
    }
    res.status(500).json({ success: false, error: msg });
  } finally {
    client.release();
  }
});

router.get('/restaurante', requireLogin, async (req, res) => {
  var client = await pool.connect();
  try {
    var result = await client.query(`SELECT * FROM restaurante ORDER BY id`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
});

router.put('/restaurante/:id', requireLogin, async (req, res) => {
  var { nome, endereco, cnpj, telefone } = req.body;
  var { id } = req.params;

  if (!nome || !endereco || !telefone || !cnpj) {
    return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios.' });
  }

  var client = await pool.connect();
  try {
    var result = await client.query(
      `
        UPDATE restaurante
        SET nome = $1, endereco = $2, cnpj = $3, telefone = $4
        WHERE id = $5
        RETURNING id
      `,
      [nome, endereco, cnpj, telefone, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Restaurante não encontrado.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    let msg = 'Erro interno do servidor.';
    if (err.code === '23505') { // Unique violation (CNPJ duplicado)
      msg = 'CNPJ já cadastrado.';
    }
    res.status(500).json({ success: false, error: msg });
  } finally {
    client.release();
  }
});

router.delete('/restaurante/:id', requireLogin, async (req, res) => {
  var { id } = req.params;
  var client = await pool.connect();
  try {
    var result = await client.query(`DELETE FROM restaurante WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Restaurante não encontrado.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
});

//Rota para cadastro de promoção
router.post('/promocao', requireLogin, async (req, res) => {
  var {idRestaurante, dt_inicio, dt_final} = req.body;
  if (!idRestaurante || !dt_inicio || !dt_final) {
    return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios.' });
  }
  var client = await pool.connect();
  try {
    var promocao = await client.query(
      `
        INSERT INTO promocao (id_restaurante, dt_inicio, dt_final)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [idRestaurante, dt_inicio, dt_final]); 
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    let msg = 'Erro interno do servidor.';
    res.status(500).json({ success: false, error: msg });
  } finally {
    client.release();
  }
});

router.get('/promocao', requireLogin, async (req, res) => {
  var client = await pool.connect();
  try {
    var result = await client.query(`
      SELECT * FROM promocao ORDER BY id
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
});

router.put('/promocao/:id', requireLogin, async (req, res) => {
  var { idRestaurante, dt_inicio, dt_final } = req.body;
  var { id } = req.params;

  if (!idRestaurante || !dt_inicio || !dt_final) {
    return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios.' });
  }

  var client = await pool.connect();
  try {
    var result = await client.query(
      `
        UPDATE promocao
        SET id_restaurante = $1, dt_inicio = $2, dt_final = $3
        WHERE id = $4
        RETURNING id
      `,
      [idRestaurante, dt_inicio, dt_final, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Promoção não encontrada.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
});

router.delete('/promocao/:id', requireLogin, async (req, res) => {
  var { id } = req.params;
  var client = await pool.connect();

  try {
    var result = await client.query(`DELETE FROM promocao WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Promoção não encontrada.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
});

module.exports = router;