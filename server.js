// server.js - VERSÃO COMPLETA E FINAL

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sgp_rp'
});

db.connect(err => {
    if (err) {
        console.error('ERRO AO CONECTAR AO BANCO DE DADOS:', err);
        return;
    }
    console.log('Backend conectado com sucesso ao banco de dados sgp_rp.');
});

// --- ROTAS DE AUTENTICAÇÃO CIVIL (INTACTAS) ---
app.post('/api/auth/register', async (req, res) => {
    const { id_passaporte, nome_completo, telefone_rp, gmail, senha } = req.body;
    if (!id_passaporte || !nome_completo || !gmail || !senha) { return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios.' }); }
    try {
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);
        const sql = 'INSERT INTO usuarios (id_passaporte, nome_completo, telefone_rp, gmail, senha_hash) VALUES (?, ?, ?, ?, ?)';
        const values = [id_passaporte, nome_completo, telefone_rp, gmail, senha_hash];
        db.query(sql, values, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'Passaporte ou Gmail já cadastrado no sistema.' }); }
                return res.status(500).json({ message: 'Erro interno do servidor ao tentar registrar.' });
            }
            return res.status(201).json({ message: 'Cadastro realizado com sucesso! Você já pode fazer o login.' });
        });
    } catch (error) { return res.status(500).json({ message: 'Erro interno do servidor.' }); }
});

app.post('/api/auth/login', (req, res) => {
    const { id_passaporte, senha } = req.body;
    if (!id_passaporte || !senha) { return res.status(400).json({ message: 'Por favor, forneça o passaporte e a senha.' }); }
    const sql = 'SELECT * FROM usuarios WHERE id_passaporte = ?';
    db.query(sql, [id_passaporte], async (err, results) => {
        if (err) { return res.status(500).json({ message: 'Erro interno do servidor.' }); }
        if (results.length === 0) { return res.status(401).json({ message: 'Passaporte ou senha inválidos.' }); }
        const usuario = results[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) { return res.status(401).json({ message: 'Passaporte ou senha inválidos.' }); }
        return res.status(200).json({ message: 'Login realizado com sucesso!', usuario: { id: usuario.id, id_passaporte: usuario.id_passaporte, nome_completo: usuario.nome_completo, cargo: usuario.cargo } });
    });
});


// --- ROTAS DE AUTENTICAÇÃO POLICIAL (INTACTAS) ---
app.post('/api/policia/register', async (req, res) => {
    const { nome_completo, passaporte, discord_id, telefone_rp, gmail, senha } = req.body;
    if (!nome_completo || !passaporte || !discord_id || !gmail || !senha) { return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios.' }); }
    try {
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);
        const sql = 'INSERT INTO usuariospoliciais (nome_completo, passaporte, discord_id, telefone_rp, gmail, senha_hash) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [nome_completo, passaporte, discord_id, telefone_rp, gmail, senha_hash];
        db.query(sql, values, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'Passaporte, Discord ID ou Gmail já cadastrado.' }); }
                return res.status(500).json({ message: 'Erro interno do servidor.' });
            }
            return res.status(201).json({ message: 'Cadastro realizado com sucesso! Aguarde a aprovação.' });
        });
    } catch (error) { return res.status(500).json({ message: 'Erro interno do servidor.' }); }
});

app.post('/api/policia/login', (req, res) => {
    const { passaporte, senha } = req.body;
    if (!passaporte || !senha) { return res.status(400).json({ message: 'Por favor, forneça o passaporte e a senha.' }); }
    const sql = 'SELECT * FROM usuariospoliciais WHERE passaporte = ?';
    db.query(sql, [passaporte], async (err, results) => {
        if (err) { return res.status(500).json({ message: 'Erro interno do servidor.' }); }
        if (results.length === 0) { return res.status(401).json({ message: 'Passaporte ou senha inválidos.' }); }
        const policial = results[0];
        const senhaCorreta = await bcrypt.compare(senha, policial.senha_hash);
        if (!senhaCorreta) { return res.status(401).json({ message: 'Passaporte ou senha inválidos.' }); }
        if (policial.status !== 'Aprovado') { return res.status(403).json({ message: 'Sua conta ainda está em análise.' }); }
        return res.status(200).json({ message: 'Login bem-sucedido!', policial: { id: policial.id, passaporte: policial.passaporte, nome_completo: policial.nome_completo, patente: policial.patente, guarnicao: policial.guarnicao } });
    });
});


// --- ROTAS DO DASHBOARD POLICIAL (NOVAS) ---

// ROTA PARA AS ESTATÍSTICAS DA PÁGINA INICIAL DO DASHBOARD
app.get('/api/policia/dashboard-stats', (req, res) => {
    const queries = {
        totalBoletins: "SELECT COUNT(*) as count FROM ocorrencias",
        boletinsAbertos: "SELECT COUNT(*) as count FROM ocorrencias WHERE status = 'Aguardando Análise'",
        policiaisAtivos: "SELECT COUNT(*) as count FROM usuariospoliciais WHERE status = 'Aprovado'"
    };

    Promise.all([
        db.promise().query(queries.totalBoletins),
        db.promise().query(queries.boletinsAbertos),
        db.promise().query(queries.policiaisAtivos)
    ]).then(([totalBoletins, boletinsAbertos, policiaisAtivos]) => {
        res.status(200).json({
            totalBoletins: totalBoletins[0][0].count,
            boletinsAbertos: boletinsAbertos[0][0].count,
            policiaisAtivos: policiaisAtivos[0][0].count
        });
    }).catch(err => {
        console.error("Erro ao buscar estatísticas:", err);
        res.status(500).json({ message: "Erro interno do servidor." });
    });
});

// ROTA PARA A PÁGINA DE ADMINISTRAÇÃO (BUSCAR RECRUTAS)
app.get('/api/admin/recrutas', (req, res) => {
    const sql = "SELECT id, nome_completo, passaporte, discord_id FROM usuariospoliciais WHERE status = 'Em Análise'";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar recrutas:", err);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }
        res.status(200).json(results);
    });
});

// ROTA PARA ATUALIZAR STATUS DE UM RECRUTA (APROVAR/REPROVAR)
app.put('/api/admin/recrutas/:id', (req, res) => {
    const { id } = req.params;
    const { novoStatus, patente, guarnicao } = req.body;

    if (!novoStatus) return res.status(400).json({ message: 'Ação inválida.' });

    let sql, values;
    if (novoStatus === 'Aprovado') {
        if (!patente || !guarnicao) return res.status(400).json({ message: 'Patente e guarnição são obrigatórias.' });
        sql = "UPDATE usuariospoliciais SET status = ?, patente = ?, guarnicao = ?, data_ingresso = CURDATE() WHERE id = ?";
        values = [novoStatus, patente, guarnicao, id];
    } else {
        sql = "UPDATE usuariospoliciais SET status = ? WHERE id = ?";
        values = [novoStatus, id];
    }

    db.query(sql, values, (err, result) => {
        if (err) { return res.status(500).json({ message: "Erro interno do servidor." }); }
        if (result.affectedRows === 0) { return res.status(404).json({ message: 'Recruta não encontrado.' }); }
        res.status(200).json({ message: `Recruta ${novoStatus.toLowerCase()} com sucesso!` });
    });
});

// ROTA PARA CONSULTAR TODOS OS BOLETINS DE OCORRÊNCIA
app.get('/api/policia/boletins', (req, res) => {
    const sql = `
        SELECT o.id, o.protocolo, o.tipo, o.descricao, o.local, o.status, o.data_registro,
               u.nome_completo as denunciante_nome, u.id_passaporte as denunciante_passaporte
        FROM ocorrencias o
        INNER JOIN usuarios u ON o.usuario_id = u.id
        ORDER BY o.data_registro DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar boletins:", err);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }
        res.status(200).json(results);
    });
});


// --- ROTAS PÚBLICAS (INTACTAS) ---
app.get('/api/concursos', (req, res) => {
    const sql = 'SELECT * FROM concursos ORDER BY data_publicacao DESC';
    db.query(sql, (err, results) => {
        if (err) { return res.status(500).json({ message: 'Erro interno do servidor.' }); }
        res.status(200).json(results);
    });
});

app.post('/api/boletim/registrar', (req, res) => {
    const { nome, rg, tipo, local, descricao, usuario_id } = req.body;
    if (!nome || !rg || !tipo || !local || !descricao || !usuario_id) { return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' }); }
    const protocolo = `BO-${Date.now()}`;
    const query = `INSERT INTO ocorrencias (protocolo, tipo, descricao, local, status, usuario_id) VALUES (?, ?, ?, ?, 'Aguardando Análise', ?)`;
    db.query(query, [protocolo, tipo, descricao, local, usuario_id], (err, result) => {
        if (err) { return res.status(500).json({ success: false, message: 'Erro interno ao salvar a ocorrência.' }); }
        res.status(201).json({ success: true, message: `Ocorrência registrada com sucesso! Protocolo: ${protocolo}` });
    });
});

// 5. INICIAR O SERVIDOR
app.listen(PORT, () => {
    console.log(`****************************************************`);
    console.log(`* Servidor SGP-RP rodando em http://localhost:${PORT} *`);
    console.log(`****************************************************`);
});