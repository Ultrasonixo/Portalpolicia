// server.js (Completo - Versão Final com JWT, Tokens de Registo c/ Limite/Expiração e Lógica de Corporação)

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
// Importar biblioteca para JWT (instale com: npm install jsonwebtoken)
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Para gerar tokens de registo

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;
// !!! TROQUE ISTO POR UMA CHAVE SEGURA EM VARIÁVEL DE AMBIENTE !!!
const JWT_SECRET = '66ddf6527444b1914de71b304c8158aa1d71301cb874e60bc1010b0025d615e98da2067b38373307d5992de3726546058f59c37d59ba44f0b95f2141fdbef019'; // <- MUDE ISTO!

// Servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_')); }
});
const upload = multer({ storage: storage });

// Conexão com o Banco de Dados
const db = mysql.createPool({ // <-- Alterado para createPool para melhor performance
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sgp_rp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => { // <-- Alterado para testar conexão do pool
    if (err) { console.error('ERRO AO CONECTAR AO BANCO DE DADOS:', err); return; }
    console.log('Backend conectado com sucesso ao banco de dados sgp_rp.');
    connection.release(); // <-- Libera a conexão
});

// =================================================================
// --- Middleware de Autenticação (Exemplo com JWT) ---
// =================================================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    // Verifica se a rota exige autenticação
    const requiresAuth = req.path.startsWith('/api/policia/') || req.path.startsWith('/api/admin/');
    // Rotas de login/registro são exceções
    const isLoginOrRegister = req.path === '/api/policia/login' || req.path === '/api/policia/register';

    if (token == null) {
        if (requiresAuth && !isLoginOrRegister) {
            // Se a rota é protegida e não é login/registro, retorna erro 401
            console.log(`[Auth] Acesso negado (sem token) para: ${req.method} ${req.path}`);
            return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
        } else {
            // Se não é rota protegida ou é login/registro, continua sem verificar token
            return next();
        }
    }

    // Se chegou aqui, temos um token e a rota pode precisar dele
    jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
        if (err) {
            console.error(`[Auth] Erro na verificação do token para ${req.method} ${req.path}:`, err.message);
            // Se a rota exige auth, retorna erro 403 (Forbidden). Se não, apenas ignora o token inválido.
            return requiresAuth ? res.status(403).json({ message: 'Token inválido ou expirado.' }) : next();
        }

        const userId = decodedPayload?.id;
        if (!userId) {
            console.error(`[Auth] Token decodificado não contém ID para ${req.method} ${req.path}.`);
            // Retorna 403 se a rota exige auth.
            return requiresAuth ? res.status(403).json({ message: 'Token inválido (sem ID).' }) : next();
        }

        // Busca dados atualizados do usuário no DB (APENAS POLICIAIS NESTE EXEMPLO)
        const sql = 'SELECT id, nome_completo, passaporte, patente, corporacao, divisao, permissoes, status FROM usuariospoliciais WHERE id = ?';
        db.query(sql, [userId], (dbErr, results) => {
            if (dbErr || results.length === 0 || results[0].status !== 'Aprovado') {
                console.error(`[Auth] Erro DB user token (${userId}) ou inativo/não encontrado p/ ${req.method} ${req.path}:`, dbErr);
                // Se a rota exige auth E o usuário não foi encontrado/está inativo, retorna 403.
                if (requiresAuth) {
                    return res.status(403).json({ message: 'Usuário do token não encontrado ou inativo.' });
                } else {
                    // Para rotas não protegidas, não anexa req.user se der erro, mas continua
                    req.user = null;
                    return next();
                }
            }

            const user = results[0];
            try { user.permissoes = user.permissoes ? JSON.parse(user.permissoes) : {}; } catch (e) { user.permissoes = {}; }
            req.user = user; // Anexa o usuário à requisição
            // console.log(`[Auth] Usuário ${user.id} (${user.nome_completo}) autenticado para ${req.method} ${req.path}`);
            next(); // Passa para a próxima rota/middleware
        });
    });
};
// Aplica o middleware globalmente ANTES de todas as rotas
app.use(authenticateToken);

// Middleware de verificação se é Polícia Civil
const checkCivil = (req, res, next) => {
    // authenticateToken DEVE ter rodado antes
    if (req.user && req.user.corporacao === 'PC') {
        next();
    } else {
        // Retorna 403 (Forbidden)
        res.status(403).json({ message: 'Acesso negado. Apenas Polícia Civil.' });
    }
};

// Middleware de verificação se é Admin RH
const checkRh = (req, res, next) => {
    // authenticateToken DEVE ter rodado antes
    if (req.user && req.user.permissoes && req.user.permissoes.is_rh === true) {
        next();
    } else {
        // Retorna 403 (Forbidden)
        res.status(403).json({ message: 'Acesso negado. Apenas administradores RH.' });
    }
};

// =================================================================
// --- ROTAS PÚBLICAS E DE CIDADÃO (Não precisam de token válido) ---
// =================================================================
// REGISTRO DE CIDADÃO
app.post('/api/auth/register', async (req, res) => {
    const { id_passaporte, nome_completo, telefone_rp, gmail, senha } = req.body;
    if (!id_passaporte || !nome_completo || !gmail || !senha) return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    try {
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);
        const sql = 'INSERT INTO usuarios (id_passaporte, nome_completo, telefone_rp, gmail, senha_hash) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [id_passaporte, nome_completo, telefone_rp, gmail, senha_hash], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Passaporte ou Gmail já cadastrado.' });
                console.error("Erro registro cidadão:", err); return res.status(500).json({ message: 'Erro interno.' });
            }
            return res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
        });
    } catch (error) { console.error("Catch registro cidadão:", error); return res.status(500).json({ message: 'Erro interno.' }); }
});

// LOGIN DE CIDADÃO
app.post('/api/auth/login', (req, res) => {
    const { id_passaporte, senha } = req.body;
    if (!id_passaporte || !senha) return res.status(400).json({ message: 'Forneça passaporte e senha.' });
    const sql = 'SELECT id, id_passaporte, nome_completo, senha_hash, cargo FROM usuarios WHERE id_passaporte = ?';
    db.query(sql, [id_passaporte], async (err, results) => {
        if (err) { console.error("Erro DB login cidadão:", err); return res.status(500).json({ message: 'Erro interno.' }); }
        if (results.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const usuario = results[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) return res.status(401).json({ message: 'Credenciais inválidas.' });
        // Opcional: Gerar token JWT para cidadão
        // const payloadCidadao = { id: usuario.id, type: 'civil' };
        // const tokenCidadao = jwt.sign(payloadCidadao, JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ message: 'Login bem-sucedido!', /* token: tokenCidadao, */ usuario: { id: usuario.id, id_passaporte: usuario.id_passaporte, nome_completo: usuario.nome_completo, cargo: usuario.cargo } });
    });
});

// REGISTRO DE POLICIAL (COM TOKEN DE REGISTO)
app.post('/api/policia/register', async (req, res) => {
    const { nome_completo, passaporte, discord_id, telefone_rp, gmail, senha, registration_token } = req.body;
    if (!nome_completo || !passaporte || !discord_id || !gmail || !senha || !registration_token) {
        return res.status(400).json({ message: 'Preencha todos os campos, incluindo o Token.' });
    }
    // 1. Validar o Token (verifica usos e expiração)
    const checkTokenSql = `
        SELECT id, corporacao, max_uses, use_count, expires_at
        FROM registration_tokens
        WHERE token = ? AND is_active = TRUE
    `;
    db.query(checkTokenSql, [registration_token], async (errToken, resToken) => {
        if (errToken) { console.error("Erro validar token:", errToken); return res.status(500).json({ message: "Erro interno." }); }
        if (resToken.length === 0) { return res.status(400).json({ message: "Token de Registo inválido ou inativo." }); }

        const tokenData = resToken[0];
        const tokenId = tokenData.id;
        const corporacaoDoToken = tokenData.corporacao;
        const now = new Date();

        // Verifica expiração
        if (tokenData.expires_at && new Date(tokenData.expires_at) < now) {
            console.log(`[Registo] Token ${registration_token} expirado em ${tokenData.expires_at}.`);
            return res.status(400).json({ message: "Token de Registo expirado." });
        }
        // Verifica limite de usos
        if (tokenData.use_count >= tokenData.max_uses) {
            console.log(`[Registo] Token ${registration_token} atingiu limite de ${tokenData.max_uses} usos.`);
            return res.status(400).json({ message: "Token de Registo já atingiu o limite de utilizações." });
        }

        // 2. Se o token é válido, prosseguir com o registo
        try {
            const salt = await bcrypt.genSalt(10);
            const senha_hash = await bcrypt.hash(senha, salt);
            const insertUserSql = ` INSERT INTO usuariospoliciais (nome_completo, passaporte, discord_id, telefone_rp, gmail, senha_hash, status, corporacao)
                                    VALUES (?, ?, ?, ?, ?, ?, "Em Análise", ?) `;
            db.query(insertUserSql, [nome_completo, passaporte, discord_id, telefone_rp, gmail, senha_hash, corporacaoDoToken], (errUser, resUser) => {
                if (errUser) {
                    if (errUser.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Passaporte, Discord ID ou Gmail já cadastrado.' });
                    console.error("Erro inserir policial:", errUser); return res.status(500).json({ message: 'Erro interno.' });
                }
                const novoPolicialId = resUser.insertId;

                // 3. Incrementar use_count E marcar como usado/inativo se atingiu o limite
                const newUseCount = tokenData.use_count + 1;
                const shouldDeactivate = newUseCount >= tokenData.max_uses;
                const updateTokenSql = `UPDATE registration_tokens SET use_count = ?, used_at = NOW(), is_active = ? WHERE id = ?`;
                db.query(updateTokenSql, [newUseCount, !shouldDeactivate, tokenId], (errUpdateToken) => {
                    if (errUpdateToken) console.error("Erro CRÍTICO ao atualizar contagem/status do token:", errUpdateToken); // Logar erro

                    // 4. Criar entrada na timeline
                    const historicoSql = 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento) VALUES (?, ?, ?, CURDATE())'; // Adicionado CURDATE()
                    db.query(historicoSql, [novoPolicialId, 'Criação de Conta', `Conta criada via token para ${corporacaoDoToken}.`], (histErr) => {
                        if (histErr) console.error("Falha ao registar evento na timeline:", histErr);
                    });
                    return res.status(201).json({ message: 'Registo enviado! Aguarde aprovação.' });
                });
            });
        } catch (error) { console.error("Erro processo registo com token:", error); return res.status(500).json({ message: 'Erro interno.' }); }
    });
});

// BUSCAR CONCURSOS
app.get('/api/concursos', (req, res) => {
    const sql = 'SELECT id, titulo, descricao, vagas, status, data_abertura, data_encerramento, link_edital, autor_id, data_publicacao, valor FROM concursos ORDER BY data_publicacao DESC';
    db.query(sql, (err, results) => {
        if (err) { console.error("Erro ao buscar concursos:", err); return res.status(500).json({ message: 'Erro interno.' }); }
        res.status(200).json(results);
    });
});

// =================================================================
// --- LOGIN POLICIAL (Gera o token) ---
// =================================================================
app.post('/api/policia/login', (req, res) => {
    const { passaporte, senha } = req.body;
    if (!passaporte || !senha) return res.status(400).json({ message: 'Passaporte e senha obrigatórios.' });
    const sql = 'SELECT id, passaporte, nome_completo, senha_hash, status, patente, corporacao, divisao, permissoes FROM usuariospoliciais WHERE passaporte = ?';
    db.query(sql, [passaporte], async (err, results) => {
        if (err) { console.error("Erro DB login policial:", err); return res.status(500).json({ message: 'Erro interno.' }); }
        if (results.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const policial = results[0];
        const senhaCorreta = await bcrypt.compare(senha, policial.senha_hash);
        if (!senhaCorreta) return res.status(401).json({ message: 'Credenciais inválidas.' });
        if (policial.status === 'Reprovado') return res.status(403).json({ message: 'Alistamento reprovado.' });
        if (policial.status !== 'Aprovado') return res.status(403).json({ message: 'Conta inativa ou em análise.' });
        let permissoesObj = {}; try { if (policial.permissoes) permissoesObj = JSON.parse(policial.permissoes); } catch (e) { /* ignore */ }
        const payload = { id: policial.id };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // Define expiração
        return res.status(200).json({ message: 'Login bem-sucedido!', token: token, policial: { id: policial.id, passaporte: policial.passaporte, nome_completo: policial.nome_completo, patente: policial.patente, corporacao: policial.corporacao, divisao: policial.divisao, permissoes: permissoesObj } });
    });
});


// =================================================================
// --- ROTAS DO PAINEL DE ADMINISTRAÇÃO (Protegidas por checkRh) ---
// =================================================================
// authenticateToken já aplicado globalmente para /api/admin/*

// GERAR TOKEN DE REGISTO (com max_uses e duration_hours)
app.post('/api/admin/generate-token', checkRh, async (req, res) => {
    const adminUser = req.user;
    const { max_uses = 1, duration_hours = 24 } = req.body; // Valores padrão
    const maxUsesInt = parseInt(max_uses, 10);
    const durationHoursInt = parseInt(duration_hours, 10);
    if (isNaN(maxUsesInt) || maxUsesInt < 1) return res.status(400).json({ message: "Usos >= 1." });
    if (isNaN(durationHoursInt) || durationHoursInt <= 0) return res.status(400).json({ message: "Duração > 0." });
    if (!adminUser?.corporacao) return res.status(400).json({ message: "Admin sem corporação." });
    const newToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHoursInt * 60 * 60 * 1000);
    const insertSql = ` INSERT INTO registration_tokens (token, corporacao, created_by_admin_id, expires_at, max_uses, use_count, is_active)
                        VALUES (?, ?, ?, ?, ?, 0, TRUE) `;
    db.query(insertSql, [newToken, adminUser.corporacao, adminUser.id, expiresAt, maxUsesInt], (err, result) => {
        if (err) {
            console.error("Erro inserir token:", err);
            if (err.code === 'ER_DUP_ENTRY') return res.status(500).json({ message: "Erro (colisão)." });
            return res.status(500).json({ message: "Erro interno." });
        }
        console.log(`[Admin] Token gerado por ${adminUser.nome_completo} p/ ${adminUser.corporacao} (Usos: ${maxUsesInt}, Exp: ${expiresAt.toISOString()}): ${newToken}`);
        res.status(201).json({ message: `Token gerado! Válido por ${durationHoursInt}h para ${maxUsesInt} uso(s).`, token: newToken });
    });
});

// BUSCAR RECRUTAS PENDENTES (Filtrado por corporação do admin)
app.get('/api/admin/recrutas', checkRh, (req, res) => {
    const adminCorporacao = req.user.corporacao;
    if (!adminCorporacao) return res.status(400).json({ message: "Admin sem corporação." });
    const sql = ` SELECT id, nome_completo, passaporte, discord_id, corporacao FROM usuariospoliciais WHERE status = 'Em Análise' AND corporacao = ? `;
    db.query(sql, [adminCorporacao], (err, results) => {
        if (err) { console.error("Erro buscar recrutas:", err); return res.status(500).json({ message: "Erro interno." }); }
        res.status(200).json(results);
    });
});

// APROVAR/REPROVAR RECRUTA (Verifica corporação)
app.put('/api/admin/recrutas/:id', checkRh, (req, res) => {
    const { id } = req.params;
    const { novoStatus, divisao } = req.body; // Recebe divisao se aprovado
    const adminUser = req.user;
    if (!novoStatus || (novoStatus !== 'Aprovado' && novoStatus !== 'Reprovado')) return res.status(400).json({ message: 'Ação inválida.' });
    const getRecrutaSql = "SELECT corporacao FROM usuariospoliciais WHERE id = ? AND status = 'Em Análise'";
    db.query(getRecrutaSql, [id], (errGet, resGet) => {
        if (errGet || resGet.length === 0) return res.status(404).json({ message: "Recruta não encontrado ou processado." });
        const recrutaCorporacao = resGet[0].corporacao;
        if (adminUser.corporacao !== recrutaCorporacao) return res.status(403).json({ message: `Gerencie apenas recrutas da sua corporação (${adminUser.corporacao}).` });
        let sql, values, patentePadrao, historicoDescricao, tipoEvento;
        if (novoStatus === 'Aprovado') {
            if (!divisao) return res.status(400).json({ message: 'Divisão obrigatória.' });
            patentePadrao = 'Soldado 2ª Classe'; tipoEvento = 'Aprovação';
            sql = "UPDATE usuariospoliciais SET status = ?, patente = ?, divisao = ? WHERE id = ?"; // Não muda corporação
            values = [novoStatus, patentePadrao, divisao, id];
            historicoDescricao = `Aprovado por ${adminUser.nome_completo}. Corp: ${recrutaCorporacao}, Div: ${divisao}, Pat: ${patentePadrao}.`;
        } else { // Reprovado
            tipoEvento = 'Outro'; // Ou 'Reprovação'
            sql = "UPDATE usuariospoliciais SET status = ?, patente = NULL, divisao = NULL WHERE id = ?"; // Não limpa corporação
            values = [novoStatus, id];
            historicoDescricao = `Reprovado por ${adminUser.nome_completo}.`;
        }
        db.query(sql, values, (err, result) => {
            if (err) { console.error(`Erro DB ao ${novoStatus} recruta:`, err); return res.status(500).json({ message: "Erro interno." }); }
            const historicoSql = 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento) VALUES (?, ?, ?, CURDATE())'; // Adicionado CURDATE()
            db.query(historicoSql, [id, tipoEvento, historicoDescricao], (histErr) => { if (histErr) console.error(`Falha log '${novoStatus}' ID ${id}:`, histErr); });
            res.status(200).json({ message: `Recruta ${novoStatus.toLowerCase()} com sucesso!` });
        });
    });
});

// GERENCIAR CARREIRA (Verifica corporação)
app.put('/api/admin/gerenciar-policial', checkRh, async (req, res) => {
    const { policialId, acao, novaPatente } = req.body;
    const adminUser = req.user;
    if (!policialId || !acao || !novaPatente || !adminUser?.nome_completo) return res.status(400).json({ message: 'Dados insuficientes.' });
    if (!['Promoção', 'Rebaixamento'].includes(acao)) return res.status(400).json({ message: 'Ação inválida.' });
    const getTargetSql = "SELECT corporacao FROM usuariospoliciais WHERE id = ?";
    db.query(getTargetSql, [policialId], (errTarget, resultsTarget) => {
        if (errTarget || resultsTarget.length === 0) return res.status(404).json({ message: "Policial alvo não encontrado." });
        if (adminUser.corporacao !== resultsTarget[0].corporacao) return res.status(403).json({ message: `Gerencie apenas policiais da sua corporação (${adminUser.corporacao}).` });
        const updateSql = "UPDATE usuariospoliciais SET patente = ? WHERE id = ?";
        db.query(updateSql, [novaPatente, policialId], (err, updateResult) => {
            if (err || updateResult.affectedRows === 0) { console.error("Erro att patente:", err); return res.status(500).json({ message: "Erro interno." }); }
            const desc = `${acao === 'Promoção' ? 'Promovido' : 'Rebaixado'} para ${novaPatente} por ${adminUser.nome_completo}.`;
            const histSql = 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento) VALUES (?, ?, ?, CURDATE())'; // Adicionado CURDATE()
            db.query(histSql, [policialId, acao, desc], (histErr) => { if (histErr) console.error("Erro log gerenciar carreira:", histErr); });
            res.status(200).json({ message: `Policial ${acao.toLowerCase()} com sucesso!` });
        });
    });
});

// LISTA OFICIAIS PARA MODAL ADMIN (Filtrado por corporação do admin)
app.get('/api/admin/lista-oficiais', checkRh, (req, res) => {
    const adminCorporacao = req.user.corporacao;
    if (!adminCorporacao) return res.status(400).json({ message: 'Admin sem corporação.' });
    const sql = "SELECT id, nome_completo, patente FROM usuariospoliciais WHERE status = 'Aprovado' AND corporacao = ? ORDER BY nome_completo ASC";
    db.query(sql, [adminCorporacao], (err, results) => {
        if (err) { console.error("Erro lista oficiais (admin):", err); return res.status(500).json({ message: "Erro interno." }); }
        res.status(200).json(results);
    });
});

// CRIAR ANÚNCIO (Verifica corporação)
app.post('/api/admin/anuncios', checkRh, (req, res) => {
    const { titulo, conteudo, corporacao } = req.body; // corporacao pode ser null para Geral
    const autor_id = req.user.id;
    if (!titulo || !conteudo || !autor_id) return res.status(400).json({ message: 'Título e conteúdo obrigatórios.' });
    if (!['PM', 'PC', 'GCM', null].includes(corporacao)) return res.status(400).json({ message: 'Corporação alvo inválida.' });
    if (corporacao !== null && corporacao !== req.user.corporacao) return res.status(403).json({ message: 'Anuncie apenas geral ou para sua corporação.' });
    const sql = 'INSERT INTO anuncios (titulo, conteudo, autor_id, corporacao) VALUES (?, ?, ?, ?)';
    db.query(sql, [titulo, conteudo, autor_id, corporacao], (err, result) => {
        if (err) { console.error("Erro criar anúncio:", err); return res.status(500).json({ message: 'Erro interno.' }); }
        res.status(201).json({ message: 'Anúncio publicado!', id: result.insertId });
    });
});

// DEMITIR POLICIAL (Verifica corporação)
app.put('/api/admin/demitir/:id', checkRh, async (req, res) => {
    const policialIdParaDemitir = req.params.id;
    const adminUser = req.user;
    if (!policialIdParaDemitir) return res.status(400).json({ message: "ID não fornecido." });
    if (adminUser.id === parseInt(policialIdParaDemitir, 10)) return res.status(400).json({ message: "Não pode demitir a si mesmo." });
    const getTargetSql = "SELECT corporacao, nome_completo FROM usuariospoliciais WHERE id = ?";
    db.query(getTargetSql, [policialIdParaDemitir], (errTarget, resultsTarget) => {
        if (errTarget || resultsTarget.length === 0) return res.status(404).json({ message: "Policial alvo não encontrado." });
        const targetPolicial = resultsTarget[0];
        if (adminUser.corporacao !== targetPolicial.corporacao) return res.status(403).json({ message: `Demita apenas policiais da sua corporação (${adminUser.corporacao}).` });
        // Muda status para 'Reprovado', limpa patente e divisão
        const updateSql = "UPDATE usuariospoliciais SET status = 'Reprovado', patente = NULL, divisao = NULL WHERE id = ?";
        db.query(updateSql, [policialIdParaDemitir], (errUpdate, updateResult) => {
            if (errUpdate || updateResult.affectedRows === 0) { console.error("Erro demitir (update):", errUpdate); return res.status(500).json({ message: "Erro interno." }); }
            const desc = `Demitido por ${adminUser.nome_completo}. Status: Reprovado.`;
            const histSql = 'INSERT INTO policial_historico (policial_id, tipo_evento, descricao, data_evento) VALUES (?, ?, ?, CURDATE())'; // Adicionado CURDATE()
            db.query(histSql, [policialIdParaDemitir, 'Demissão', desc], (histErr) => { if (histErr) console.error(`Erro log demissão ID ${policialIdParaDemitir}:`, histErr); });
            res.status(200).json({ message: `Policial ${targetPolicial.nome_completo} demitido.` });
        });
    });
});


// =================================================================
// --- ROTAS POLICIAIS GERAIS (Protegidas por authenticateToken) ---
// =================================================================
// ESTATÍSTICAS DO DASHBOARD
app.get('/api/policia/dashboard-stats', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });
    const queries = {
        totalBoletins: "SELECT COUNT(*) as count FROM ocorrencias",
        boletinsAbertos: "SELECT COUNT(*) as count FROM ocorrencias WHERE status = 'Aguardando Análise' OR status = 'Em Investigação'",
        policiaisAtivos: "SELECT COUNT(*) as count FROM usuariospoliciais WHERE status = 'Aprovado'"
    };
    Promise.all([
        db.promise().query(queries.totalBoletins),
        db.promise().query(queries.boletinsAbertos),
        db.promise().query(queries.policiaisAtivos)
    ]).then(([totalResult, abertosResult, ativosResult]) => {
        res.status(200).json({
            totalBoletins: totalResult[0][0].count,
            boletinsAbertos: abertosResult[0][0].count,
            policiaisAtivos: ativosResult[0][0].count
        });
    }).catch(err => {
        console.error("Erro ao buscar estatísticas:", err);
        res.status(500).json({ message: "Erro interno do servidor." });
    });
});

// CONSULTAR TODOS OS BOLETINS
app.get('/api/policia/boletins', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });
    const sql = ` SELECT o.id, o.protocolo, o.tipo, o.descricao, o.local, o.status, o.data_registro, o.policial_responsavel_id,
                        u.nome_completo as denunciante_nome, u.id_passaporte as denunciante_passaporte
                    FROM ocorrencias o LEFT JOIN usuarios u ON o.usuario_id = u.id
                    ORDER BY o.data_registro DESC `;
    db.query(sql, (err, results) => {
        if (err) { console.error("Erro ao buscar boletins:", err); return res.status(500).json({ message: "Erro interno." }); }
        res.status(200).json(results);
    });
});

// BUSCAR UM BOLETIM ESPECÍFICO (DETALHES)
app.get('/api/policia/boletins/:id', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });
    const { id } = req.params;
    const sql = ` SELECT o.*, u.nome_completo as denunciante_nome, u.id_passaporte as denunciante_passaporte,
                        u.gmail as denunciante_gmail, u.telefone_rp as denunciante_telefone,
                        p.nome_completo as policial_responsavel_nome, p.passaporte as policial_responsavel_passaporte
                    FROM ocorrencias o LEFT JOIN usuarios u ON o.usuario_id = u.id LEFT JOIN usuariospoliciais p ON o.policial_responsavel_id = p.id
                    WHERE o.id = ? `;
    db.query(sql, [id], (err, results) => {
        if (err) { console.error("Erro DB buscar BO detalhe:", err); return res.status(500).json({ message: "Erro interno." }); }
        if (results.length === 0) return res.status(404).json({ message: "Boletim não encontrado." });
        const boletim = results[0];
        try { boletim.envolvidos_identificados = boletim.envolvidos_identificados ? JSON.parse(boletim.envolvidos_identificados) : []; } catch (e) { boletim.envolvidos_identificados = []; }
        try { boletim.anexos_imagens = boletim.anexos_imagens ? JSON.parse(boletim.anexos_imagens) : []; } catch (e) { boletim.anexos_imagens = []; }
        res.status(200).json(boletim);
    });
});

// LISTAR POLICIAIS ATIVOS (Filtrado por corporação)
app.get('/api/policia/policiais', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });
    const userCorporacao = req.user.corporacao;
    let sql = ` SELECT id, nome_completo, passaporte, patente, corporacao, divisao, status
                FROM usuariospoliciais WHERE status = 'Aprovado' `;
    const params = [];
    // RH Geral vê todos? Se sim, descomente a linha abaixo e comente o bloco if/else if
    // if (!req.user.permissoes?.is_rh || userCorporacao) { // Se não for RH geral OU se tiver corporação, filtra
    if (userCorporacao === 'PC' || userCorporacao === 'PM' || userCorporacao === 'GCM') {
        sql += ' AND corporacao = ? ';
        params.push(userCorporacao);
    } else if (!req.user.permissoes?.is_rh) { // Se não for RH e não tiver corporação válida
        console.warn(`Usuário ${req.user.id} sem corporação válida tentando listar policiais.`);
        return res.status(200).json([]);
    } // Se for RH sem corporação, não adiciona filtro de corporação
    sql += ' ORDER BY nome_completo ASC';
    db.query(sql, params, (err, results) => {
        if (err) { console.error("Erro ao buscar policiais:", err); return res.status(500).json({ message: "Erro interno." }); }
        res.status(200).json(results);
    });
});

// BUSCAR PERFIL DE UM POLICIAL
app.get('/api/policia/perfil/:id', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });
    const { id } = req.params;
    const sql = "SELECT id, nome_completo, passaporte, patente, corporacao, divisao, status FROM usuariospoliciais WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) { console.error("Erro ao buscar perfil:", err); return res.status(500).json({ message: "Erro interno." }); }
        if (results.length === 0) return res.status(404).json({ message: "Policial não encontrado." });
        // Opcional: Adicionar verificação se req.user pode ver este perfil
        // if (req.user.corporacao !== results[0].corporacao && !req.user.permissoes?.is_rh) { return res.status(403).json({...}) }
        res.status(200).json(results[0]);
    });
});

// BUSCAR HISTÓRICO DE UM POLICIAL
app.get('/api/policia/perfil/:id/historico', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });
    // Opcional: Adicionar mesma verificação de corporação aqui
    const { id } = req.params;
    const sql = "SELECT id, policial_id, tipo_evento, descricao, data_evento, responsavel_id FROM policial_historico WHERE policial_id = ? ORDER BY data_evento DESC";
    db.query(sql, [id], (err, results) => {
        if (err) { console.error("Erro ao buscar histórico:", err); return res.status(500).json({ message: "Erro interno." }); }
        res.status(200).json(results);
    });
});

// Rota de Anúncios para o Dashboard (filtrada)
app.get('/api/anuncios', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });
    const userCorporacao = req.user.corporacao;
    if (!userCorporacao && !req.user.permissoes?.is_rh) {
        console.warn(`Usuário ${req.user.id} sem corporação tentando buscar anúncios.`);
        return res.status(403).json({ message: "Usuário sem corporação definida." });
    }
    let sql = ` SELECT a.id, a.titulo, a.conteudo, a.data_publicacao, u.nome_completo as autor_nome
                FROM anuncios a LEFT JOIN usuariospoliciais u ON a.autor_id = u.id `;
    const params = [];
    if (!req.user.permissoes?.is_rh || userCorporacao) { // Se não for RH geral ou tiver corporação, filtra
        sql += ' WHERE a.corporacao IS NULL OR a.corporacao = ? ';
        params.push(userCorporacao); // Será null se RH não tiver corporação
    }
    sql += ' ORDER BY a.data_publicacao DESC LIMIT 5 ';
    db.query(sql, params, (err, results) => {
        if (err) { console.error("Erro buscar anúncios (dashboard):", err); return res.status(500).json({ message: "Erro interno." }); }
        res.status(200).json(results);
    });
});


// =================================================================
// --- ROTAS DE BOLETINS COM CHECAGEM CIVIL ---
// =================================================================
// ATUALIZAR BOLETIM
app.put('/api/policia/boletins/:id', checkCivil, upload.array('anexos', 5), (req, res) => {
    const { id } = req.params;
    const { status, unidade_policial, envolvidos_identificados, evidencias_coletadas, relato_policial, encaminhamento, observacoes_internas, imagens_existentes } = req.body;
    const policial_responsavel_id = req.user.id;
    const novosAnexos = req.files ? req.files.map(file => file.filename) : [];
    let imagensExistentesArray = []; try { if (imagens_existentes) imagensExistentesArray = JSON.parse(imagens_existentes); } catch (e) { /* ignore */ }
    const todosAnexos = [...imagensExistentesArray, ...novosAnexos];
    const checkRespSql = "SELECT policial_responsavel_id FROM ocorrencias WHERE id = ?";
    db.query(checkRespSql, [id], (errCheck, resCheck) => {
        if (errCheck || resCheck.length === 0) return res.status(404).json({ message: "Boletim não encontrado." });
        
        // Permite que qualquer PC atualize, não apenas o responsável
        // if (resCheck[0].policial_responsavel_id !== policial_responsavel_id) return res.status(403).json({message: "Você não é o responsável por este BO."});
        
        const sql = ` UPDATE ocorrencias SET status = ?, unidade_policial = ?, envolvidos_identificados = ?, evidencias_coletadas = ?, relato_policial = ?, encaminhamento = ?, observacoes_internas = ?, anexos_imagens = ? WHERE id = ? `;
        const values = [status, unidade_policial, envolvidos_identificados, evidencias_coletadas, relato_policial, encaminhamento, observacoes_internas, JSON.stringify(todosAnexos), id];
        db.query(sql, values, (err, result) => {
            if (err) { console.error("Erro ao atualizar B.O.:", err); return res.status(500).json({ message: "Erro interno." }); }
            res.status(200).json({ message: 'Boletim atualizado!' });
        });
    });
});

// ASSUMIR BOLETIM
app.put('/api/policia/boletins/:id/assumir', checkCivil, (req, res) => {
    const { id } = req.params;
    const policial_id = req.user.id;
    if (!policial_id) return res.status(401).json({ message: 'Usuário não autenticado.' });
    const sql = ` UPDATE ocorrencias SET status = 'Em Investigação', policial_responsavel_id = ?, data_assumido = NOW() WHERE id = ? AND policial_responsavel_id IS NULL `;
    db.query(sql, [policial_id, id], (err, result) => {
        if (err) { console.error("Erro ao assumir BO:", err); return res.status(500).json({ message: "Erro interno." }); }
        if (result.affectedRows === 0) return res.status(409).json({ message: 'Caso já assumido ou não existe.' });
        res.status(200).json({ message: 'Caso assumido!' });
    });
});

// =================================================================
// --- ROTA REGISTRO DE BO (NECESSITA AUTH CIDADÃO?) ---
// =================================================================
// Adicione middleware de auth cidadão se necessário
app.post('/api/boletim/registrar', /* SEU_AUTH_CIDADÃO, */ upload.array('anexos', 5), (req, res) => {
    // const usuario_id = req.userCidadao?.id; // Exemplo
    const { tipo, local, descricao, usuario_id /* <-- Mudar para pegar do auth */ , data_ocorrido } = req.body;
    if (!usuario_id) return res.status(401).json({ success: false, message: "Utilizador não autenticado." }) // Adapte
    const anexos = req.files ? req.files.map(file => file.filename) : [];
    if (!tipo || !local || !descricao || !data_ocorrido) return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    const protocolo = `BO-${Date.now()}`;
    const query = ` INSERT INTO ocorrencias (protocolo, tipo, descricao, local, status, usuario_id, anexos_imagens, data_ocorrido) VALUES (?, ?, ?, ?, 'Aguardando Análise', ?, ?, ?) `;
    const values = [protocolo, tipo, descricao, local, usuario_id, JSON.stringify(anexos), data_ocorrido];
    db.query(query, values, (err, result) => {
        if (err) { console.error("Erro ao registrar ocorrência:", err); return res.status(500).json({ success: false, message: 'Erro interno.' }); }
        res.status(201).json({ success: true, message: `Ocorrência registrada! Protocolo: ${protocolo}` });
    });
});
app.get('/api/admin/logs', checkRh, (req, res) => {
    // Parâmetros opcionais para paginação (ex: /api/admin/logs?page=1&limit=20)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50; // Limite padrão de 50 logs
    const offset = (page - 1) * limit;

    const adminCorporacao = req.user.corporacao; // Corporação do RH logado

    // Query para buscar logs + nome do admin que realizou
    const logSql = `
        SELECT l.id, l.acao, l.detalhes, l.data_log, u.nome_completo as admin_nome, u.corporacao as admin_corporacao
        FROM logs_auditoria l
        LEFT JOIN usuariospoliciais u ON l.usuario_id = u.id
        WHERE u.corporacao = ? OR l.detalhes LIKE ?  -- Filtra pela corporação do admin ou se a corporação é mencionada nos detalhes
        ORDER BY l.data_log DESC
        LIMIT ?
        OFFSET ?
    `;
    const likePattern = `%"corporacao":"${adminCorporacao}"%`;

    // Query para contar o total de logs (para paginação no frontend)
    const countSql = `
        SELECT COUNT(*) as total
        FROM logs_auditoria l
        LEFT JOIN usuariospoliciais u ON l.usuario_id = u.id
        WHERE u.corporacao = ? OR l.detalhes LIKE ?
    `;

    // Executa ambas as queries
    Promise.all([
        db.promise().query(logSql, [adminCorporacao, likePattern, limit, offset]),
        db.promise().query(countSql, [adminCorporacao, likePattern])
    ])
        .then(([logsResult, countResult]) => {
            const logs = logsResult[0];
            const totalLogs = countResult[0][0].total;
            const totalPages = Math.ceil(totalLogs / limit);

            // Tenta fazer parse dos detalhes JSON, mas ignora erros
            logs.forEach(log => {
                try {
                    if (log.detalhes && log.detalhes.startsWith('{') && log.detalhes.endsWith('}')) {
                        log.detalhes = JSON.parse(log.detalhes);
                    }
                } catch (e) { /* Deixa como string se não for JSON válido */ }
            });


            res.status(200).json({
                logs: logs,
                currentPage: page,
                totalPages: totalPages,
                totalLogs: totalLogs
            });
        })
        .catch(err => {
            console.error("Erro ao buscar logs de auditoria:", err);
            res.status(500).json({ message: "Erro interno ao buscar logs." });
        });
});
// <<< --- ROTA: ESTATÍSTICAS RESUMIDAS PARA PÁGINA DE RELATÓRIOS --- >>>
app.get('/api/policia/relatorios/estatisticas', async (req, res) => {
    // Esta rota é protegida pelo 'authenticateToken' global em /api/policia/
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const dataFiltro = trintaDiasAtras.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    try {
        // Query 1: Contagem de Boletins por Status
        const boQuery = "SELECT status, COUNT(*) as count FROM ocorrencias GROUP BY status";
        const [boResults] = await db.promise().query(boQuery);
        
        // Query 2: Contagem de Efetivo por Corporação
        const efetivoQuery = "SELECT corporacao, COUNT(*) as count FROM usuariospoliciais WHERE status = 'Aprovado' GROUP BY corporacao";
        const [efetivoResults] = await db.promise().query(efetivoQuery);

        // Query 3: Contagem de Ações de RH (Últimos 30 dias)
        const historicoQuery = `
            SELECT tipo_evento, COUNT(*) as count 
            FROM policial_historico 
            WHERE data_evento >= ? AND tipo_evento IN ('Promoção', 'Rebaixamento', 'Demissão', 'Aprovação')
            GROUP BY tipo_evento
        `;
        const [historicoResults] = await db.promise().query(historicoQuery, [dataFiltro]);

        // --- Processa os resultados ---
        const boletins = { total: 0, aguardando: 0, investigacao: 0, resolvido: 0, arquivado: 0, falso: 0 };
        boResults.forEach(row => {
            if (row.status === 'Aguardando Análise') boletins.aguardando = row.count;
            if (row.status === 'Em Investigação') boletins.investigacao = row.count;
            if (row.status === 'Resolvido') boletins.resolvido = row.count;
            if (row.status === 'Arquivado') boletins.arquivado = row.count;
            if (row.status === 'Falso') boletins.falso = row.count;
            boletins.total += row.count;
        });

        const efetivo = { total: 0 };
        efetivoResults.forEach(row => {
            if (row.corporacao) { // Ignora se corporacao for NULL
                efetivo[row.corporacao] = row.count; // ex: efetivo.PM = 10
                efetivo.total += row.count;
            }
        });

        const historico = { promocao: 0, rebaixamento: 0, demissao: 0, aprovacao: 0 };
        historicoResults.forEach(row => {
            if (row.tipo_evento === 'Promoção') historico.promocao = row.count;
            if (row.tipo_evento === 'Rebaixamento') historico.rebaixamento = row.count;
            if (row.tipo_evento === 'Demissão') historico.demissao = row.count;
            if (row.tipo_evento === 'Aprovação') historico.aprovacao = row.count;
        });
        
        // Retorna o objeto de estatísticas compilado
        res.status(200).json({
            boletins,
            efetivo,
            historico
        });

    } catch (err) {
        console.error("Erro ao buscar estatísticas de relatórios:", err);
        res.status(500).json({ message: "Erro interno ao processar dados." });
    }
});
// <<< --- FIM ROTA --- >>>


// <<< --- NOVA ROTA: CRIAR RELATÓRIO ESCRITO (NARRATIVO) --- >>>
app.post('/api/policia/relatorios', async (req, res) => {
    // O authenticateToken global já protege esta rota e anexa req.user
    if (!req.user) return res.status(401).json({ message: "Não autorizado (usuário não encontrado no token)." });

    // 1. Pega os dados do formulário (que virão do frontend)
    const { titulo, conteudo, tipo_relatorio, data_relatorio, id_ocorrencia_associada } = req.body;
    
    // 2. Pega o ID do policial que está logado (vem do token)
    const id_policial_autor = req.user.id;

    // 3. Validação básica
    if (!titulo || !conteudo || !tipo_relatorio || !data_relatorio) {
        return res.status(400).json({ 
            message: "Campos obrigatórios (título, conteúdo, tipo, data) estão faltando." 
        });
    }

    // 4. Monta a query para inserir no banco
    try {
        const insertQuery = `
            INSERT INTO relatorios 
                (id_policial_autor, titulo, conteudo, tipo_relatorio, data_relatorio, id_ocorrencia_associada)
            VALUES 
                (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.promise().query(insertQuery, [
            id_policial_autor,
            titulo,
            conteudo,
            tipo_relatorio,
            data_relatorio,
            id_ocorrencia_associada || null // Garante que seja NULL se não for enviado
        ]);

        // 5. Responde com sucesso
        res.status(201).json({ 
            message: "Relatório criado com sucesso!", 
            id_relatorio_criado: result.insertId 
        });

    } catch (err) {
        console.error("Erro ao salvar relatório escrito:", err);
        res.status(500).json({ message: "Erro interno ao salvar o relatório." });
    }
});
// <<< --- FIM NOVA ROTA --- >>>


// =================================================================
// --- INICIAR O SERVIDOR ---
// =================================================================
app.listen(PORT, () => {
    console.log(`****************************************************`);
    console.log(`* Servidor SGP-RP rodando em http://localhost:${PORT} *`);
    console.log(`****************************************************`);
});
