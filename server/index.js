import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './database.js';
import { syncUfConfig, getOuSincronizaApuracao } from './tseSync.js';

initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log de requisições simples
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

/**
 * 1. Lista todos os estados
 */
app.get('/api/estados', (req, res) => {
  try {
    const estados = db.prepare('SELECT sigla, nome FROM estados ORDER BY nome ASC').all();
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Lista os municípios de uma UF (sincroniza automaticamente do TSE se ainda não tiver)
 */
app.get('/api/municipios', async (req, res) => {
  try {
    const uf = (req.query.uf || 'SP').toString().toUpperCase();

    // Verifica se já temos municípios cadastrados no SQLite
    let munis = db.prepare('SELECT codigo_tse, nome FROM municipios WHERE uf = ? ORDER BY nome ASC').all(uf);

    // Se estiver vazio, sincroniza da API oficial do TSE
    if (munis.length === 0) {
      await syncUfConfig(uf);
      munis = db.prepare('SELECT codigo_tse, nome FROM municipios WHERE uf = ? ORDER BY nome ASC').all(uf);
    }

    // Carrega zonas e estrutura resumida para compatibilidade
    const municipiosFormatados = munis.map((m) => {
      const zonas = db.prepare('SELECT id, numero FROM zonas WHERE codigo_municipio = ? AND uf = ?').all(m.codigo_tse, uf);
      return {
        codigoTse: m.codigo_tse,
        nome: m.nome,
        zonas: zonas.map((z) => ({
          id: z.id,
          numero: z.numero,
          locais: []
        }))
      };
    });

    res.json(municipiosFormatados);
  } catch (err) {
    console.error('Erro ao buscar municípios:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Detalhes completos de um município (Zonas, Locais e Seções)
 */
app.get('/api/municipios/:codigoTse', (req, res) => {
  try {
    const { codigoTse } = req.params;
    const uf = (req.query.uf || 'SP').toString().toUpperCase();

    const muni = db.prepare('SELECT codigo_tse, nome FROM municipios WHERE codigo_tse = ? AND uf = ?').get(codigoTse, uf);
    if (!muni) {
      return res.status(404).json({ error: 'Município não encontrado no SQLite' });
    }

    const zonas = db.prepare('SELECT id, numero FROM zonas WHERE codigo_municipio = ? AND uf = ?').all(codigoTse, uf);

    const zonasCompletas = zonas.map((z) => {
      const locais = db.prepare(`
        SELECT id, numero, nome, endereco, bairro 
        FROM locais_votacao 
        WHERE zona_id = ? AND codigo_municipio = ? AND uf = ?
      `).all(z.id, codigoTse, uf);

      const locaisCompletos = locais.map((loc) => {
        const secoes = db.prepare(`
          SELECT id, numero, urna_modelo 
          FROM secoes 
          WHERE local_id = ? AND zona_id = ? AND codigo_municipio = ? AND uf = ?
          ORDER BY CAST(numero AS INTEGER) ASC
        `).all(loc.id, z.id, codigoTse, uf);

        return {
          id: loc.id,
          numero: loc.numero,
          nome: loc.nome,
          endereco: loc.endereco,
          bairro: loc.bairro,
          secoes: secoes.map((s) => ({
            id: s.id,
            numero: s.numero,
            urnaEletronica: s.urna_modelo || 'Urna Oficial TSE'
          }))
        };
      });

      return {
        id: z.id,
        numero: z.numero,
        locais: locaisCompletos
      };
    });

    res.json({
      codigoTse: muni.codigo_tse,
      nome: muni.nome,
      zonas: zonasCompletas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Dados de apuração da seção/município
 */
app.get('/api/resultado-secao', async (req, res) => {
  try {
    const uf = (req.query.uf || 'SP').toString().toUpperCase();
    const codigoMunicipio = (req.query.codigoMunicipio || '').toString();
    const zonaId = (req.query.zonaId || '').toString();
    const secaoId = (req.query.secaoId || '').toString();
    const ano = parseInt(req.query.ano || '2024', 10);

    // Obtém resultado oficial da eleição consolidada do município no TSE / SQLite
    const apuracao = await getOuSincronizaApuracao(uf, codigoMunicipio, ano);

    res.json({
      id: secaoId,
      numero: secaoId,
      urnaEletronica: `Urna Eletrônica Oficial TSE - Seção ${secaoId} (Zona ${parseInt(zonaId, 10) || zonaId})`,
      primeiroTurno: apuracao.turno1,
      segundoTurno: apuracao.turno2
    });
  } catch (err) {
    console.error('Erro ao buscar resultado da seção:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Status / Estatísticas do SQLite local
 */
app.get('/api/stats', (req, res) => {
  try {
    const estadosCount = db.prepare('SELECT COUNT(*) as c FROM estados').get().c;
    const munisCount = db.prepare('SELECT COUNT(*) as c FROM municipios').get().c;
    const zonasCount = db.prepare('SELECT COUNT(*) as c FROM zonas').get().c;
    const secoesCount = db.prepare('SELECT COUNT(*) as c FROM secoes').get().c;
    const resultadosCount = db.prepare('SELECT COUNT(*) as c FROM apuracao_municipio').get().c;

    res.json({
      database: 'SQLite (eleicoes.db)',
      estados: estadosCount,
      municipios: munisCount,
      zonas: zonasCount,
      secoes: secoesCount,
      resultados_salvos: resultadosCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor SQLite Eleições TSE rodando na porta ${PORT}`);
});
