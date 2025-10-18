const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer'); // Importa o multer
const path = require('path');   // Importa o 'path' para lidar com caminhos de arquivo

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;

// ✅ SERVIR ARQUIVOS ESTÁTICOS DA PASTA 'uploads'
// Isso torna as imagens acessíveis pela URL, ex: http://localhost:3000/uploads/nome-da-imagem.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ CONFIGURAÇÃO DO MULTER (ARMAZENAMENTO DE ARQUIVOS)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        // Cria um nome de arquivo único para evitar conflitos
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});
const upload = multer({ storage: storage });

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


// =================================================================
// --- ROTAS DE AUTENTICAÇÃO E REGISTRO ---
// =================================================================

// REGISTRO DE CIDADÃO
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

// LOGIN DE CIDADÃO
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

// REGISTRO DE POLICIAL (ALISTAMENTO)
// Em server.js

// REGISTRO DE POLICIAL (ALISTAMENTO) - VERSÃO ATUALIZADA
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
                console.error("Erro ao registrar policial:", err);
                return res.status(500).json({ message: 'Erro interno do servidor.' });
            }
            
            // ✅ ETAPA ADICIONADA: CRIAR O PRIMEIRO EVENTO NA TIMELINE
            const novoPolicialId = result.insertId;
            const historicoSql = 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao) VALUES (?, ?, ?)';
            const historicoValues = [novoPolicialId, 'Criação de Conta', 'Conta criada através do sistema de alistamento.'];

            db.query(historicoSql, historicoValues, (histErr, histResult) => {
                if (histErr) {
                    // Mesmo que o histórico falhe, o registro do usuário foi um sucesso.
                    // Apenas logamos o erro no console do servidor.
                    console.error("Falha ao registrar o evento 'Criação de Conta' na timeline:", histErr);
                }
                // A resposta de sucesso é enviada de qualquer forma.
                return res.status(201).json({ message: 'Cadastro realizado com sucesso! Aguarde a aprovação.' });
            });
        });
    } catch (error) {
        console.error("Erro no processo de registro:", error);
        return res.status(500).json({ message: 'Erro interno do servidor.' }); 
    }
});

// LOGIN DE POLICIAL
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
        if (policial.status === 'Reprovado') { return res.status(403).json({ message: 'Seu alistamento foi reprovado. Entre em contato com um administrador.' }); }
        if (policial.status !== 'Aprovado') { return res.status(403).json({ message: 'Sua conta ainda está em análise e aguardando aprovação.' }); }
        return res.status(200).json({
            message: 'Login bem-sucedido!',
            policial: { id: policial.id, passaporte: policial.passaporte, nome_completo: policial.nome_completo, patente: policial.patente, guarnicao: policial.guarnicao }
        });
    });
});


// =================================================================
// --- ROTAS DO PAINEL DE ADMINISTRAÇÃO ---
// =================================================================

// BUSCAR RECRUTAS PENDENTES
app.get('/api/admin/recrutas', (req, res) => {
    const sql = "SELECT id, nome_completo, passaporte, discord_id FROM usuariospoliciais WHERE status = 'Em Análise'";
    db.query(sql, (err, results) => {
        if (err) { console.error("Erro ao buscar recrutas:", err); return res.status(500).json({ message: "Erro interno do servidor." }); }
        res.status(200).json(results);
    });
});

// APROVAR/REPROVAR RECRUTA
// Em server.js

// APROVAR/REPROVAR RECRUTA - VERSÃO ATUALIZADA
app.put('/api/admin/recrutas/:id', (req, res) => {
    const { id } = req.params;
    const { novoStatus, patente, guarnicao } = req.body;
    // Futuramente, você pode passar o ID do admin que está aprovando no req.body
    // const { admin_id } = req.body; 

    if (!novoStatus) return res.status(400).json({ message: 'Ação inválida.' });

    let sql, values;

    if (novoStatus === 'Aprovado') {
        if (!patente || !guarnicao) return res.status(400).json({ message: 'Patente e guarnição são obrigatórias.' });
        sql = "UPDATE usuariospoliciais SET status = ?, patente = ?, guarnicao = ? WHERE id = ?";
        values = [novoStatus, patente, guarnicao, id];
    } else { // Para 'Reprovado' ou outros status
        sql = "UPDATE usuariospoliciais SET status = ? WHERE id = ?";
        values = [novoStatus, id];
    }
    
    db.query(sql, values, (err, result) => {
        if (err) { return res.status(500).json({ message: "Erro interno do servidor." }); }
        if (result.affectedRows === 0) { return res.status(404).json({ message: 'Recruta não encontrado.' }); }

        // ✅ ETAPA ADICIONADA: SE FOI APROVADO, REGISTRA NA TIMELINE
        if (novoStatus === 'Aprovado') {
            const historicoSql = 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao) VALUES (?, ?, ?)';
            // Idealmente, a descrição incluiria o nome do admin responsável.
            const historicoValues = [id, 'Aprovação', `Alistamento aprovado pela Administração. Patente inicial: ${patente}.`];

            db.query(historicoSql, historicoValues, (histErr) => {
                if (histErr) {
                    console.error("Falha ao registrar o evento 'Aprovação' na timeline:", histErr);
                }
            });
        }
        
        res.status(200).json({ message: `Recruta ${novoStatus.toLowerCase()} com sucesso!` });
    });
});


// =================================================================
// --- ROTAS DO DASHBOARD POLICIAL E BOLETINS ---
// =================================================================

// ESTATÍSTICAS DO DASHBOARD
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

// CONSULTAR TODOS OS BOLETINS
app.get('/api/policia/boletins', (req, res) => {
    const sql = `
        SELECT o.id, o.protocolo, o.tipo, o.descricao, o.local, o.status, o.data_registro,
               u.nome_completo as denunciante_nome, u.id_passaporte as denunciante_passaporte
        FROM ocorrencias o
        INNER JOIN usuarios u ON o.usuario_id = u.id
        ORDER BY o.data_registro DESC
    `;
    db.query(sql, (err, results) => {
        if (err) { console.error("Erro ao buscar boletins:", err); return res.status(500).json({ message: "Erro interno do servidor." }); }
        res.status(200).json(results);
    });
});

// BUSCAR UM BOLETIM ESPECÍFICO (DETALHES)
app.get('/api/policia/boletins/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            o.*, 
            u.nome_completo as denunciante_nome, 
            u.id_passaporte as denunciante_passaporte,
            u.gmail as denunciante_gmail,
            u.telefone_rp as denunciante_telefone,
            p.nome_completo as policial_responsavel_nome,
            p.passaporte as policial_responsavel_passaporte
        FROM ocorrencias o
        JOIN usuarios u ON o.usuario_id = u.id
        LEFT JOIN usuariospoliciais p ON o.policial_responsavel_id = p.id
        WHERE o.id = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) { console.error("Erro ao buscar detalhes do B.O.:", err); return res.status(500).json({ message: "Erro interno do servidor." }); }
        if (results.length === 0) return res.status(404).json({ message: "Boletim não encontrado." });
        
        // Converte os campos JSON de string para objeto, se não forem nulos
        const boletim = results[0];
        boletim.envolvidos_identificados = boletim.envolvidos_identificados ? JSON.parse(boletim.envolvidos_identificados) : [];
        boletim.anexos_imagens = boletim.anexos_imagens ? JSON.parse(boletim.anexos_imagens) : [];

        res.status(200).json(boletim);
    });
});

// ✅ ROTA DE ATUALIZAÇÃO DO BOLETIM MODIFICADA PARA ACEITAR IMAGENS
app.put('/api/policia/boletins/:id', upload.array('anexos', 5), (req, res) => {
    const { id } = req.params;
    const { 
        status, policial_responsavel_id, unidade_policial, envolvidos_identificados, 
        evidencias_coletadas, relato_policial, encaminhamento, observacoes_internas,
        imagens_existentes // Lista (em string JSON) de imagens antigas que não foram removidas
    } = req.body;

    // Pega os nomes dos novos arquivos que acabaram de ser enviados
    const novosAnexos = req.files ? req.files.map(file => file.filename) : [];
    
    // Junta as imagens existentes (que o frontend enviou de volta) com as novas
    const imagensExistentesArray = imagens_existentes ? JSON.parse(imagens_existentes) : [];
    const todosAnexos = [...imagensExistentesArray, ...novosAnexos];

    const sql = `
        UPDATE ocorrencias 
        SET 
            status = ?, policial_responsavel_id = ?, unidade_policial = ?, 
            envolvidos_identificados = ?, evidencias_coletadas = ?, 
            relato_policial = ?, encaminhamento = ?, observacoes_internas = ?,
            anexos_imagens = ?
        WHERE id = ?
    `;
    const values = [
        status, policial_responsavel_id, unidade_policial,
        envolvidos_identificados, evidencias_coletadas, relato_policial,
        encaminhamento, observacoes_internas, JSON.stringify(todosAnexos), id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao atualizar B.O.:", err);
            return res.status(500).json({ message: "Erro interno do servidor ao atualizar." });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: "Boletim não encontrado." });
        res.status(200).json({ message: 'Boletim atualizado com sucesso!' });
    });
});


// ASSUMIR UM CASO DE BOLETIM
app.put('/api/policia/boletins/:id/assumir', (req, res) => {
    const { id } = req.params;
    const { policial_id } = req.body;
    if (!policial_id) { return res.status(400).json({ message: 'ID do policial é obrigatório.' }); }
    const sql = `
        UPDATE ocorrencias SET status = 'Em Investigação', policial_responsavel_id = ?, data_assumido = NOW()
        WHERE id = ? AND policial_responsavel_id IS NULL
    `;
    const values = [policial_id, id];
    db.query(sql, values, (err, result) => {
        if (err) { return res.status(500).json({ message: "Erro interno do servidor." }); }
        if (result.affectedRows === 0) return res.status(409).json({ message: 'Este caso já foi assumido por outro policial.' });
        res.status(200).json({ message: 'Caso assumido com sucesso!' });
    });
});

// LISTAR POLICIAIS ATIVOS (PARA <SELECT>)
app.get('/api/policia/lista-oficiais', (req, res) => {
    const sql = "SELECT id, nome_completo, patente FROM usuariospoliciais WHERE status = 'Aprovado' ORDER BY nome_completo ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Erro interno do servidor." });
        res.status(200).json(results);
    });
});


// =================================================================
// --- ROTAS PÚBLICAS (ANÚNCIOS, CONCURSOS, ETC) ---
// =================================================================

// REGISTRAR BOLETIM (PELO CIDADÃO)
// Em server.js, SUBSTITUA a rota de registrar boletim por esta:

// ✅ USA O MIDDLEWARE 'upload.array()' PARA PROCESSAR ATÉ 5 ARQUIVOS COM O NOME 'anexos'
app.post('/api/boletim/registrar', upload.array('anexos', 5), (req, res) => {
    // Os dados de texto agora vêm de req.body
    const { tipo, local, descricao, usuario_id } = req.body;
    
    // ✅ Os arquivos de imagem vêm de req.files
    const anexos = req.files ? req.files.map(file => file.filename) : [];

    if (!tipo || !local || !descricao || !usuario_id) { 
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' }); 
    }
    
    const protocolo = `BO-${Date.now()}`;
    
    // ✅ A CONSULTA SQL AGORA INCLUI A COLUNA 'anexos_imagens'
    const query = `
        INSERT INTO ocorrencias 
            (protocolo, tipo, descricao, local, status, usuario_id, anexos_imagens) 
        VALUES 
            (?, ?, ?, ?, 'Aguardando Análise', ?, ?)
    `;
    
    // ✅ O NOME DAS IMAGENS É SALVO COMO UMA STRING JSON
    const values = [protocolo, tipo, descricao, local, usuario_id, JSON.stringify(anexos)];
    
    db.query(query, values, (err, result) => {
        if (err) { 
            console.error("Erro ao registrar ocorrência:", err);
            return res.status(500).json({ success: false, message: 'Erro interno ao salvar a ocorrência.' }); 
        }
        res.status(201).json({ success: true, message: `Ocorrência registrada com sucesso! Protocolo: ${protocolo}` });
    });
});

// BUSCAR ANÚNCIOS
app.get('/api/anuncios', (req, res) => {
    const sql = `
        SELECT a.id, a.titulo, a.conteudo, a.data_publicacao, u.nome_completo as autor_nome 
        FROM anuncios a
        LEFT JOIN usuariospoliciais u ON a.autor_id = u.id
        ORDER BY a.data_publicacao DESC LIMIT 5
    `;
    db.query(sql, (err, results) => {
        if (err) { console.error("Erro ao buscar anúncios:", err); return res.status(500).json({ message: "Erro interno do servidor." }); }
        res.status(200).json(results);
    });
});

// CRIAR ANÚNCIO
app.post('/api/anuncios', (req, res) => {
    const { titulo, conteudo, autor_id } = req.body;
    if (!titulo || !conteudo || !autor_id) { return res.status(400).json({ message: 'Título, conteúdo e ID do autor são obrigatórios.' }); }
    const sql = 'INSERT INTO anuncios (titulo, conteudo, autor_id) VALUES (?, ?, ?)';
    const values = [titulo, conteudo, autor_id];
    db.query(sql, values, (err, result) => {
        if (err) { console.error("Erro ao criar anúncio:", err); return res.status(500).json({ message: 'Erro interno ao criar anúncio.' }); }
        res.status(201).json({ message: 'Anúncio publicado com sucesso!', id: result.insertId });
    });
});

// BUSCAR CONCURSOS
app.get('/api/concursos', (req, res) => {
    const sql = 'SELECT * FROM concursos ORDER BY data_publicacao DESC';
    db.query(sql, (err, results) => {
        if (err) { return res.status(500).json({ message: 'Erro interno do servidor.' }); }
        res.status(200).json(results);
    });
});
// Em server.js, adicione estas duas novas rotas

// ROTA PARA BUSCAR OS DADOS DE PERFIL DE UM POLICIAL ESPECÍFICO
app.get('/api/policia/perfil/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id, nome_completo, passaporte, patente, guarnicao, status FROM usuariospoliciais WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) { return res.status(500).json({ message: "Erro interno do servidor." }); }
        if (results.length === 0) { return res.status(404).json({ message: "Policial não encontrado." }); }
        res.status(200).json(results[0]);
    });
});

// ROTA PARA BUSCAR O HISTÓRICO (TIMELINE) DE UM POLICIAL
app.get('/api/policia/perfil/:id/historico', (req, res) => {
    const { id } = req.params;
    // Traz os eventos do mais recente para o mais antigo
    const sql = "SELECT tipo_evento, descricao, data_evento FROM policial_historico WHERE policial_id = ? ORDER BY data_evento DESC";
    db.query(sql, [id], (err, results) => {
        if (err) { return res.status(500).json({ message: "Erro interno do servidor." }); }
        res.status(200).json(results);
    });
});

app.get('/api/policia/policiais', (req, res) => {
    const sql = `
        SELECT id, nome_completo, passaporte, patente, guarnicao, status 
        FROM usuariospoliciais 
        WHERE status = 'Aprovado' 
        ORDER BY nome_completo ASC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar lista de policiais:", err);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }
        res.status(200).json(results);
    });
});
// Em server.js, verifique se esta rota existe e está correta

// ROTA PARA BUSCAR A LISTA DE TODOS OS POLICIAIS ATIVOS
app.get('/api/policia/policiais', (req, res) => {
    const sql = `
        SELECT id, nome_completo, passaporte, patente, guarnicao, status 
        FROM usuariospoliciais 
        WHERE status = 'Aprovado' 
        ORDER BY nome_completo ASC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar lista de policiais:", err);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }
        res.status(200).json(results);
    });
});


// 5. INICIAR O SERVIDOR
app.listen(PORT, () => {
    console.log(`****************************************************`);
    console.log(`* Servidor SGP-RP rodando em http://localhost:${PORT} *`);
    console.log(`****************************************************`);
});