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
  // Registrar refeição com resgate automático ao atingir 10
  router.post('/:id/registrar', requireLogin, async (req, res) => {
    var { id } = req.params;
    var client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Buscar cliente
      var clienteRes = await client.query(
        'SELECT id FROM cliente WHERE id_usuario = $1',
        [id]
      );

      if (clienteRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
      }

      var clienteId = clienteRes.rows[0].id;

      // Usuário logado
      var usuarioLogadoId = req.session.userId;

      // Buscar o caixa correspondente ao usuário logado
      var caixaRes = await client.query(`
        SELECT id, id_restaurante
        FROM caixa
        WHERE id_usuario = $1
      `, [usuarioLogadoId]);

      if (caixaRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, error: 'Usuário logado não é um caixa.' });
      }

      var idCaixa = caixaRes.rows[0].id;
      var restauranteId = caixaRes.rows[0].id_restaurante;

      // Inserir refeição normal
      await client.query(`
        INSERT INTO refeicao (id_cliente, id_caixa, cortesia)
        VALUES ($1, $2, FALSE)
      `, [clienteId, idCaixa]);

      // Buscar promoção vigente
      var promoRes = await client.query(`
        SELECT id, dt_inicio, dt_final
        FROM promocao
        WHERE id_restaurante = $1
          AND CURRENT_DATE BETWEEN dt_inicio AND dt_final
        LIMIT 1
      `, [restauranteId]);

      if (promoRes.rows.length === 0) {
        await client.query("COMMIT");
        return res.json({
          success: true,
          message: "Refeição registrada. Nenhuma promoção vigente."
        });
      }

      var promo = promoRes.rows[0];

      // Contar refeições válidas na promoção
      var countRes = await client.query(`
        SELECT COUNT(*) AS total
        FROM refeicao
        WHERE id_cliente = $1
          AND cortesia = FALSE
          AND data BETWEEN $2 AND $3
      `, [clienteId, promo.dt_inicio, promo.dt_final]);

      var total = parseInt(countRes.rows[0].total);

      // Se chegou a 10, resgata automaticamente
      if (total > 10) {

        // Remover as 10 refeições não cortesia mais antigas dentro da promoção
        await client.query(`
          DELETE FROM refeicao
          WHERE id IN (
            SELECT id FROM refeicao
            WHERE id_cliente = $1
              AND cortesia = FALSE
              AND data BETWEEN $2 AND $3
            ORDER BY data ASC, id ASC
            LIMIT 10
          )
        `, [clienteId, promo.dt_inicio, promo.dt_final]);

        // Inserir cortesia automática
        await client.query(`
          INSERT INTO refeicao (id_cliente, id_caixa, cortesia)
          VALUES ($1, $2, TRUE)
        `, [clienteId, idCaixa]);

        await client.query("COMMIT");

        return res.json({
          success: true,
          message: "Refeição registrada e cortesia resgatada automaticamente!"
        });
      }

      // Se não chegou a 10, apenas registra
      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Refeição registrada com sucesso."
      });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });


  // Buscar refeições de um cliente específico
  router.get('/:id/refeicoes', requireLogin, async (req, res) => {
    var { id } = req.params;
    var client = await pool.connect();

    try {
      // Busca o id do cliente na tabela cliente
      var clienteRes = await client.query('SELECT id FROM cliente WHERE id_usuario = $1', [id]);
      
      if (clienteRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
      }
      
      var clienteId = clienteRes.rows[0].id;
      
      // Conta as refeições não cortesia dos últimos 30 dias
      var countRes = await client.query(`
        SELECT COUNT(*) AS total
        FROM refeicao
        WHERE id_cliente = $1
          AND cortesia = FALSE
          AND data >= CURRENT_DATE - INTERVAL '30 days'
      `, [clienteId]);

      res.json({ 
        success: true, 
        total: parseInt(countRes.rows[0].total) 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    } finally {
      client.release();
    }
  });

  // Resgatar cortesia baseado na promoção vigente
// Resgatar cortesia baseado na promoção vigente (com reset do contador)
router.post('/:id/resgatar', requireLogin, async (req, res) => {
  var { id } = req.params;
  var client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Buscar cliente
    var clienteRes = await client.query(
      'SELECT id FROM cliente WHERE id_usuario = $1',
      [id]
    );

    if (clienteRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
    }

    var clienteId = clienteRes.rows[0].id;

    // Usuário logado
    var usuarioLogadoId = req.session.userId;

    // Buscar registro do caixa baseado no id_usuario
    var caixaRes = await client.query(`
      SELECT id, id_restaurante
      FROM caixa
      WHERE id_usuario = $1
    `, [usuarioLogadoId]);

    if (caixaRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, error: 'Usuário logado não é um caixa.' });
    }

    var idCaixa = caixaRes.rows[0].id;
    var restauranteId = caixaRes.rows[0].id_restaurante;

    // Buscar promoção vigente
    var promoRes = await client.query(`
      SELECT id, dt_inicio, dt_final 
      FROM promocao
      WHERE id_restaurante = $1
        AND CURRENT_DATE BETWEEN dt_inicio AND dt_final
      ORDER BY dt_inicio DESC
      LIMIT 1
    `, [restauranteId]);

    if (promoRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: 'Nenhuma promoção vigente no momento.'
      });
    }

    var promo = promoRes.rows[0];

    // Contar refeições dentro da promoção
    var countRes = await client.query(`
      SELECT COUNT(*) AS almocos_acumulados
      FROM refeicao
      WHERE id_cliente = $1
        AND cortesia = FALSE
        AND data BETWEEN $2 AND $3
    `, [clienteId, promo.dt_inicio, promo.dt_final]);

    var almocos_acumulados = parseInt(countRes.rows[0].almocos_acumulados);

    if (almocos_acumulados >= 10) {

      // Inserir cortesia com id_caixa correto
      await client.query(`
        INSERT INTO refeicao (id_cliente, id_caixa, cortesia)
        VALUES ($1, $2, TRUE)
      `, [clienteId, idCaixa]);

      // Deletar as 10 refeições NÃO cortesia mais antigas apenas dentro da promoção vigente
      await client.query(`
        DELETE FROM refeicao
        WHERE id IN (
          SELECT id FROM refeicao
          WHERE id_cliente = $1
            AND cortesia = FALSE
            AND data BETWEEN $2 AND $3
          ORDER BY data ASC, id ASC
          LIMIT 10
        )
      `, [clienteId, promo.dt_inicio, promo.dt_final]);

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Cortesia registrada com sucesso e contador zerado dentro da promoção!"
      });

    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: `Cliente tem apenas ${almocos_acumulados} refeições na promoção vigente. São necessárias 10.`
      });
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
});

module.exports = router;
