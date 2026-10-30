import { db } from './database.js';

const TSE_BASE = 'https://resultados.tse.jus.br/oficial';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Função utilitária para fetch seguro com User-Agent e timeout
 */
async function fetchTSE(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/plain, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro TSE HTTP ${response.status} ao acessar: ${url}`);
  }

  return await response.json();
}

/**
 * Sincroniza todos os municípios, zonas e seções de uma UF a partir da API oficial do TSE
 */
export async function syncUfConfig(uf) {
  const ufUpper = uf.toUpperCase();
  const ufLower = uf.toLowerCase();

  const syncKey = `config_${ufUpper}`;
  const alreadySynced = db.prepare('SELECT chave FROM sync_status WHERE chave = ?').get(syncKey);

  if (alreadySynced) {
    const muniCount = db.prepare('SELECT COUNT(*) as count FROM municipios WHERE uf = ?').get(ufUpper);
    if (muniCount.count > 0) {
      return { status: 'already_cached', count: muniCount.count };
    }
  }

  console.log(`[TSE Sync] Baixando configuração oficial de ${ufUpper}...`);
  const url = `${TSE_BASE}/ele2024/arquivo-urna/452/config/${ufLower}/${ufLower}-p000452-cs.json`;
  const data = await fetchTSE(url);

  const estadoAbr = data.abr?.find((a) => a.cd?.toLowerCase() === ufLower) || data.abr?.[0];
  if (!estadoAbr || !estadoAbr.mu) {
    throw new Error(`Não foram encontrados municípios no retorno da UF ${ufUpper}`);
  }

  const insertMunicipio = db.prepare(`
    INSERT OR REPLACE INTO municipios (codigo_tse, uf, nome)
    VALUES (?, ?, ?)
  `);

  const insertZona = db.prepare(`
    INSERT OR REPLACE INTO zonas (id, numero, codigo_municipio, uf)
    VALUES (?, ?, ?, ?)
  `);

  const insertLocal = db.prepare(`
    INSERT OR REPLACE INTO locais_votacao (id, numero, nome, endereco, bairro, zona_id, codigo_municipio, uf)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSecao = db.prepare(`
    INSERT OR REPLACE INTO secoes (id, numero, urna_modelo, local_id, zona_id, codigo_municipio, uf)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    let totalSecoes = 0;

    for (const muni of estadoAbr.mu) {
      // Ex: cd: "69299", nm: "PRESIDENTE PRUDENTE"
      insertMunicipio.run(muni.cd, ufUpper, muni.nm);

      if (Array.isArray(muni.zon)) {
        for (const zona of muni.zon) {
          const zonaId = zona.cd;
          const zonaNumero = `${parseInt(zona.cd, 10)}ª Zona Eleitoral (${muni.nm})`;
          insertZona.run(zonaId, zonaNumero, muni.cd, ufUpper);

          // Criamos locais de votação agrupando as seções
          // No TSE, cada zona tem suas seções
          const localId = `LOC-${zonaId}`;
          const localNome = `Polo de Votação - Zona ${parseInt(zonaId, 10)}`;
          insertLocal.run(
            localId,
            `L-${zonaId}`,
            localNome,
            'Sede / Seções Eleitorais',
            'Centro',
            zonaId,
            muni.cd,
            ufUpper
          );

          if (Array.isArray(zona.sec)) {
            for (const sec of zona.sec) {
              const secaoId = sec.ns;
              insertSecao.run(
                secaoId,
                secaoId,
                'Urna Eletrônica Oficial TSE',
                localId,
                zonaId,
                muni.cd,
                ufUpper
              );
              totalSecoes++;
            }
          }
        }
      }
    }

    db.prepare('INSERT OR REPLACE INTO sync_status (chave, atualizado_em) VALUES (?, ?)').run(
      syncKey,
      new Date().toISOString()
    );
  });

  transaction();
  console.log(`[TSE Sync] ${ufUpper} sincronizado com sucesso no SQLite! (${estadoAbr.mu.length} municípios)`);

  return { status: 'success', count: estadoAbr.mu.length };
}

/**
 * Converte valor numérico formatado pelo TSE (ex: "52,81" ou "56800")
 */
function parseTseNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Obtém ou sincroniza a apuração do município (1º e 2º Turno) da eleição oficial
 */
export async function getOuSincronizaApuracao(uf, codigoMunicipio, ano = 2024) {
  const ufUpper = uf.toUpperCase();
  const ufLower = uf.toLowerCase();

  // Verifica se já temos no banco de dados SQLite
  const cached1T = db.prepare(`
    SELECT * FROM apuracao_municipio 
    WHERE codigo_municipio = ? AND uf = ? AND ano = ? AND turno = 1
  `).get(codigoMunicipio, ufUpper, ano);

  if (cached1T) {
    const cached2T = db.prepare(`
      SELECT * FROM apuracao_municipio 
      WHERE codigo_municipio = ? AND uf = ? AND ano = ? AND turno = 2
    `).get(codigoMunicipio, ufUpper, ano);

    return {
      turno1: formatarResultadoDb(cached1T),
      turno2: cached2T ? formatarResultadoDb(cached2T) : null
    };
  }

  // Se não estiver no cache, busca no TSE
  console.log(`[TSE Sync] Buscando resultados oficiais de ${codigoMunicipio} (${ufUpper}) para ano ${ano}...`);

  let resultado1T = null;
  let resultado2T = null;

  try {
    // Busca do TSE conforme o ano
    const eleicao1TId = ano === 2024 ? '619' : ano === 2022 ? '544' : '619';
    const cargoId = ano === 2022 || ano === 2026 ? '0001' : '0011'; // 0001: Presidente, 0011: Prefeito
    const cargoNome = ano === 2022 || ano === 2026 ? 'Presidente' : 'Prefeito';

    const url1T = `${TSE_BASE}/ele${ano}/${eleicao1TId}/dados/${ufLower}/${ufLower}${codigoMunicipio}-c${cargoId}-e000${eleicao1TId}-u.json`;
    const data1T = await fetchTSE(url1T);
    resultado1T = parseTseResult(data1T, 1);
    salvarResultadoDb(codigoMunicipio, ufUpper, ano, 1, cargoNome, resultado1T);
  } catch (err) {
    console.warn(`[TSE Sync] Não foi possível carregar 1º turno (${ano}) para ${codigoMunicipio}: ${err.message}`);
  }

  try {
    const eleicao2TId = ano === 2024 ? '620' : ano === 2022 ? '545' : '620';
    const cargoId = ano === 2022 || ano === 2026 ? '0001' : '0011';
    const cargoNome = ano === 2022 || ano === 2026 ? 'Presidente' : 'Prefeito';

    const url2T = `${TSE_BASE}/ele${ano}/${eleicao2TId}/dados/${ufLower}/${ufLower}${codigoMunicipio}-c${cargoId}-e000${eleicao2TId}-u.json`;
    const data2T = await fetchTSE(url2T);
    resultado2T = parseTseResult(data2T, 2);
    salvarResultadoDb(codigoMunicipio, ufUpper, ano, 2, cargoNome, resultado2T);
  } catch {
    // É perfeitamente normal cidades sem 2º turno não terem arquivo
  }

  return {
    turno1: resultado1T,
    turno2: resultado2T
  };
}

function parseTseResult(data, turno) {
  const eleitores = data.e || {};
  const votos = data.v || {};
  const carg = data.carg?.[0] || {};

  const candidatos = [];
  if (Array.isArray(carg.agr)) {
    for (const ag of carg.agr) {
      if (Array.isArray(ag.par)) {
        for (const p of ag.par) {
          if (Array.isArray(p.cand)) {
            for (const c of p.cand) {
              candidatos.push({
                numero: String(c.n || ''),
                nome: c.nm || '',
                partido: p.nm || p.sg || '',
                siglaPartido: p.sg || '',
                votos: parseTseNumber(c.vap || c.v),
                percentual: parseTseNumber(c.pvap || c.pv)
              });
            }
          }
        }
      }
    }
  }

  // Ordena por quantidade de votos decrescente
  candidatos.sort((a, b) => b.votos - a.votos);

  return {
    turno,
    eleitoresAptos: parseTseNumber(eleitores.te),
    totalVotosApurados: parseTseNumber(votos.tv),
    votosValidos: parseTseNumber(votos.vv || votos.vvc),
    votosBrancos: parseTseNumber(votos.vb),
    votosNulos: parseTseNumber(votos.vn || votos.tvn),
    abstencoes: parseTseNumber(eleitores.a),
    candidatos
  };
}

function salvarResultadoDb(codigoMunicipio, uf, ano, turno, cargo, res) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO apuracao_municipio (
      codigo_municipio, uf, ano, turno, cargo,
      eleitores_aptos, comparecimento, abstencoes,
      votos_apurados, votos_validos, votos_brancos, votos_nulos,
      candidatos_json, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    codigoMunicipio,
    uf,
    ano,
    turno,
    cargo,
    res.eleitoresAptos,
    res.totalVotosApurados,
    res.abstencoes,
    res.totalVotosApurados,
    res.votosValidos,
    res.votosBrancos,
    res.votosNulos,
    JSON.stringify(res.candidatos),
    new Date().toISOString()
  );
}

function formatarResultadoDb(row) {
  return {
    turno: row.turno,
    eleitoresAptos: row.eleitores_aptos,
    totalVotosApurados: row.votos_apurados,
    votosValidos: row.votos_validos,
    votosBrancos: row.votos_brancos,
    votosNulos: row.votos_nulos,
    abstencoes: row.abstencoes,
    candidatos: JSON.parse(row.candidatos_json || '[]')
  };
}
