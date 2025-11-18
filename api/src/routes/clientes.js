  const express = require('express');
  const pool = require('../../db');
  const router = express.Router();
  const { requireLogin } = require('../middleware/auth'); 

  //Rota para cadastro de cliente
  router.post('/', requireLogin, async (req, res) => {
    var { nome, cpf, telefone, email} = req.body;
    if (!nome || !cpf || !telefone || !email) {
      return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios.' });
    }
    var client = await pool.connect();
    try {
      var usuario = await client.query(
        `
          INSERT INTO usuario (nome, cpf, telefone, email, senha, tipo_usuario)
          VALUES ($1, $2, $3, $4, '123456', 'CLIENTE')
          RETURNING id
        `, [nome, cpf, telefone, email]);
        var id_usuario = usuario.rows[0].id;
        await client.query(
          `
            INSERT INTO cliente (id_usuario)
            VALUES ($1)
          `, [id_usuario]); 
          res.json({ success: true });
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

  // Listar todos clientes
  router.get('/', requireLogin, async (req, res) => {
    var client = await pool.connect();
    try {
      var result = await client.query(`
        SELECT u.id, u.nome, u.cpf, u.telefone, u.email
        FROM usuario u
        JOIN cliente c ON c.id_usuario = u.id
        ORDER BY u.nome ASC
      `);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });

   router.get('/minhas-refeicoes', requireLogin, async (req, res) => {
    const userId = req.session.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT r.id, r.data, r.cortesia
        FROM refeicao r
        JOIN cliente c ON c.id = r.id_cliente
        WHERE c.id_usuario = $1
        ORDER BY r.data DESC
      `, [userId]);

      return res.json({ success: true, data: result.rows });

    } catch (err) {
      console.error('Erro ao buscar refeições do usuário:', err);
      return res.status(500).json({
        success: false,
        error: "Erro ao buscar refeições do usuário."
      });
    } finally {
      client.release();
    }
  });

  //Buscar por nome
  router.get('/buscar-nome/:nome', requireLogin, async (req, res) => {
    var { nome } = req.params;
    var client = await pool.connect();

    try {
      var result = await client.query(`
        SELECT u.id, u.nome, u.cpf, u.telefone, u.email
        FROM usuario u
        JOIN cliente c ON c.id_usuario = u.id
        WHERE LOWER(u.nome) LIKE LOWER($1)
        ORDER BY u.nome ASC
      `, [`%${nome}%`]);

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });

  // Buscar cliente por ID
  router.get('/:id', requireLogin, async (req, res) => {
    var { id } = req.params;
    var client = await pool.connect();

    try {
      var result = await client.query(`
        SELECT u.id, u.nome, u.cpf, u.telefone, u.email
        FROM usuario u
        JOIN cliente c ON c.id_usuario = u.id
        WHERE u.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });

  // Atualizar cliente
  router.put('/:id', requireLogin, async (req, res) => {
    var { id } = req.params;
    var { nome, telefone, email } = req.body;

    var client = await pool.connect();

    try {
      // Atualiza usuário
      var result = await client.query(`
        UPDATE usuario
        SET nome = $1, telefone = $2, email = $3
        WHERE id = $4 AND tipo_usuario = 'CLIENTE'
        RETURNING id
      `, [nome, telefone, email, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      let msg = 'Erro interno do servidor.';
      if (err.code === '23505') {
        msg = 'Email já cadastrado.';
      }
      res.status(500).json({ success: false, error: msg });
    } finally {
      client.release();
    }
  });

  // Deletar cliente
  router.delete('/:id', requireLogin, async (req, res) => {
    var { id } = req.params;
    var client = await pool.connect();

    try {
      // Deleta usuário (cascata apagará o cliente)
      var result = await client.query(`
        DELETE FROM usuario
        WHERE id = $1 AND tipo_usuario = 'CLIENTE'
      `, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });

  // Registrar Refeição
  router.post('/:id/registrar', async (req, res) => {
    var { id } = req.params;
    var client = await pool.connect();

    try {
      var clienteRes = await client.query('SELECT id FROM cliente WHERE id_usuario = $1', [id]);
      if (clienteRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
      }
      var id = clienteRes.rows[0].id;
      await client.query(`
        INSERT INTO refeicao (id_cliente, id_caixa, cortesia)
        VALUES ($1, 2, FALSE)
      `, [id]);

      return res.json({ success: true });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });

  // Resgatar cortesia
  router.post('/:id/resgatar', requireLogin, async (req, res) => {
    var { id } = req.params;
    var client = await pool.connect();

    try {
      var countRes = await client.query(`
        SELECT COUNT(*) AS almocos_acumulados
        FROM refeicao
        WHERE id_cliente = $1
          AND cortesia = FALSE
          AND data >= CURRENT_DATE - INTERVAL '30 days'
      `, [id]);

      var almocos_acumulados = parseInt(countRes.rows[0].almocos_acumulados);

      if (almocos_acumulados >= 10) {
        await client.query(`
          INSERT INTO refeicao (id_cliente, id_caixa, cortesia)
          VALUES ($1, 1, TRUE)
        `, [id]);

        return res.json({ success: true });
      } else {
        return res.status(400).json({ success: false, error: 'Cliente ainda não tem direito à cortesia.' });
      }

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });

  module.exports = router;
