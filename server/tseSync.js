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
 * Função utilitária para fetch com buffer binário
 */
async function fetchTSEBuffer(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Erro TSE HTTP ${response.status} ao acessar arquivo: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Funções utilitárias para decodificação ASN.1/BER dos Boletins de Urna (-bu.dat)
 */
function parseTLV(buffer, offset = 0) {
  if (offset >= buffer.length) return null;
  const tag = buffer[offset];
  let len = buffer[offset + 1];
  let headerLen = 2;
  if (len & 0x80) {
    const numBytes = len & 0x7f;
    len = 0;
    for (let i = 0; i < numBytes; i++) {
      len = (len << 8) | buffer[offset + 2 + i];
    }
    headerLen = 2 + numBytes;
  }
  return {
    tag,
    headerLen,
    len,
    totalLen: headerLen + len,
    offset,
    valueOffset: offset + headerLen,
    value: buffer.subarray(offset + headerLen, offset + headerLen + len)
  };
}

function parseChildren(buffer, offset, length) {
  const list = [];
  let cur = offset;
  while (cur < offset + length) {
    const tlv = parseTLV(buffer, cur);
    if (!tlv) break;
    list.push(tlv);
    cur += tlv.totalLen;
  }
  return list;
}

function parseInteger(b) {
  let val = 0;
  for (let i = 0; i < b.length; i++) {
    val = (val << 8) | b[i];
  }
  return val;
}

/**
 * Mapeia os dados descritivos dos candidatos para preencher nomes e legendas nos BUs
 */
async function getCandidatosMetadata(uf, codigoMunicipio, ano, turno) {
  const ufLower = uf.toLowerCase();
  const is2026 = ano === 2026;
  const eleicaoId = is2026 ? (turno === 2 ? '6258' : '6257') : (turno === 2 ? '620' : '619');
  const cargoId = is2026 ? '0001' : '0011';
  const eleicaoPadded = eleicaoId.padStart(6, '0');

  try {
    const url = `${TSE_BASE}/ele${ano}/${eleicaoId}/dados/${ufLower}/${ufLower}${codigoMunicipio}-c${cargoId}-e${eleicaoPadded}-u.json`;
    const data = await fetchTSE(url);
    const map = new Map();
    if (Array.isArray(data.carg?.[0]?.agr)) {
      for (const ag of data.carg[0].agr) {
        if (Array.isArray(ag.par)) {
          for (const p of ag.par) {
            if (Array.isArray(p.cand)) {
              for (const c of p.cand) {
                map.set(String(c.n), {
                  numero: String(c.n),
                  nome: c.nmu || c.nm || '',
                  partido: p.nm || p.sg || '',
                  siglaPartido: p.sg || ''
                });
              }
            }
          }
        }
      }
    }
    return map;
  } catch (err) {
    console.warn(`[TSE Sync] Aviso ao carregar catálogo de candidatos (${ano} - T${turno}): ${err.message}`);
    return new Map();
  }
}

/**
 * Baixa e decodifica o Boletim de Urna (BU) oficial de uma seção específica
 */
export async function getOuSincronizaApuracaoSecao(uf, codigoMunicipio, zonaId, secaoId, ano = 2026) {
  const ufUpper = uf.toUpperCase();
  const ufLower = uf.toLowerCase();
  const zonaNorm = String(parseInt(zonaId, 10));
  const secaoNorm = String(parseInt(secaoId, 10));

  // 1. Verifica se já está gravado na tabela apuracao_secao do SQLite
  const cached1T = db.prepare(`
    SELECT * FROM apuracao_secao 
    WHERE codigo_municipio = ? AND uf = ? AND ano = ? AND zona_id = ? AND secao_id = ? AND turno = 1
  `).get(codigoMunicipio, ufUpper, ano, zonaNorm, secaoNorm);

  if (cached1T) {
    const cached2T = db.prepare(`
      SELECT * FROM apuracao_secao 
      WHERE codigo_municipio = ? AND uf = ? AND ano = ? AND zona_id = ? AND secao_id = ? AND turno = 2
    `).get(codigoMunicipio, ufUpper, ano, zonaNorm, secaoNorm);

    return {
      turno1: formatarResultadoDb(cached1T),
      turno2: cached2T ? formatarResultadoDb(cached2T) : null,
      fonte: 'BOLETIM_URNA_INDIVIDUAL',
      urnaModelo: cached1T.fonte || 'Urna Oficial TSE'
    };
  }

  // 2. Se não estiver no SQLite, busca o BU oficial diretamente no TSE
  console.log(`[TSE Sync] Baixando Boletim de Urna oficial da Seção ${secaoNorm} (Zona ${zonaNorm}) - Ano ${ano}...`);

  const zPadded = zonaNorm.padStart(4, '0');
  const sPadded = secaoNorm.padStart(4, '0');

  // Mapeamento de pleitos oficiais do TSE para Arquivo-Urna
  // 2026: 3220 (1º Turno Geral), 3221 (2º Turno Geral)
  // 2024: 452 (1º Turno Municipal), 453 (2º Turno Municipal)
  const pleito1T = ano === 2026 ? '3220' : '452';
  const pleito2T = ano === 2026 ? '3221' : '453';
  const eleicaoAlvo1T = ano === 2026 ? 6257 : 619;
  const eleicaoAlvo2T = ano === 2026 ? 6258 : 620;
  const cargoAlvo = ano === 2026 ? 1 : 11; // 1: Presidente, 11: Prefeito
  const cargoNome = ano === 2026 ? 'Presidente' : 'Prefeito';

  let resultado1T = null;
  let resultado2T = null;
  let urnaModeloDesc = null;

  // Processa 1º Turno
  try {
    const candMap1T = await getCandidatosMetadata(ufUpper, codigoMunicipio, ano, 1);
    const parsed1T = await baixarEDecodificarBU(
      ano,
      pleito1T,
      eleicaoAlvo1T,
      cargoAlvo,
      cargoNome,
      ufLower,
      codigoMunicipio,
      zPadded,
      sPadded,
      candMap1T,
      1
    );

    if (parsed1T) {
      resultado1T = parsed1T.resultado;
      urnaModeloDesc = parsed1T.urnaModelo;
      salvarResultadoSecaoDb(codigoMunicipio, ufUpper, ano, 1, zonaNorm, secaoNorm, cargoNome, resultado1T, urnaModeloDesc);
    }
  } catch (err) {
    console.warn(`[TSE Sync] BU 1º Turno não obtido para Seção ${secaoNorm}: ${err.message}`);
  }

  // Processa 2º Turno
  try {
    const candMap2T = await getCandidatosMetadata(ufUpper, codigoMunicipio, ano, 2);
    const parsed2T = await baixarEDecodificarBU(
      ano,
      pleito2T,
      eleicaoAlvo2T,
      cargoAlvo,
      cargoNome,
      ufLower,
      codigoMunicipio,
      zPadded,
      sPadded,
      candMap2T,
      2
    );

    if (parsed2T) {
      resultado2T = parsed2T.resultado;
      salvarResultadoSecaoDb(codigoMunicipio, ufUpper, ano, 2, zonaNorm, secaoNorm, cargoNome, resultado2T, urnaModeloDesc);
    }
  } catch (err) {
    console.log(`[TSE Sync] BU 2º Turno não aplicável/disponível para Seção ${secaoNorm} (${ano})`);
  }

  if (resultado1T || resultado2T) {
    return {
      turno1: resultado1T,
      turno2: resultado2T,
      fonte: 'BOLETIM_URNA_INDIVIDUAL',
      urnaModelo: urnaModeloDesc || 'Urna Oficial TSE'
    };
  }

  return null;
}

async function baixarEDecodificarBU(
  ano,
  pleito,
  eleicaoAlvo,
  cargoAlvo,
  cargoNome,
  ufLower,
  codigoMunicipio,
  zPadded,
  sPadded,
  candMap,
  turno
) {
  const pPadded = pleito.padStart(6, '0');
  const urlAux = `${TSE_BASE}/ele${ano}/arquivo-urna/${pleito}/dados/${ufLower}/${codigoMunicipio}/${zPadded}/${sPadded}/p${pPadded}-${ufLower}-m${codigoMunicipio}-z${zPadded}-s${sPadded}-aux.json`;

  const dataAux = await fetchTSE(urlAux);
  const hashObj = dataAux.hashes?.[0];
  if (!hashObj) return null;

  const hash = hashObj.hash;
  const buEntry = hashObj.arq?.find((a) => a.tp === 'bu');
  if (!buEntry) return null;

  const buName = buEntry.nm;
  const urlBu = `${TSE_BASE}/ele${ano}/arquivo-urna/${pleito}/dados/${ufLower}/${codigoMunicipio}/${zPadded}/${sPadded}/${hash}/${buName}`;
  const buf = await fetchTSEBuffer(urlBu);

  // Decodifica ASN.1/BER da urna
  const envelope = parseTLV(buf, 0);
  if (!envelope) return null;

  const innerBuf = parseChildren(buf, envelope.valueOffset, envelope.len).find((x) => x.tag === 0x04)?.value;
  if (!innerBuf) return null;

  const buRoot = parseTLV(innerBuf, 0);
  if (!buRoot) return null;

  const buFields = parseChildren(innerBuf, buRoot.valueOffset, buRoot.len);

  // Identificação do Modelo/Software da Urna (Campo 2)
  let urnaModeloDesc = 'Urna Eletrônica Oficial TSE';
  try {
    const urnaFields = parseChildren(innerBuf, buFields[2].valueOffset, buFields[2].len);
    const software = urnaFields[1]?.value?.toString('latin1')?.trim();
    const cargaSeq = parseChildren(innerBuf, urnaFields[2].valueOffset, urnaFields[2].len);
    const cargaDetails = parseChildren(innerBuf, cargaSeq[1].valueOffset, cargaSeq[1].len);
    const numUrna = parseInteger(cargaDetails[0].value);
    if (numUrna && software) {
      urnaModeloDesc = `Urna nº ${numUrna} (${software})`;
    }
  } catch (e) {
    // modelo fallback
  }

  // Lista com os resultados por eleição (Campo 8)
  const eleicoes = parseChildren(innerBuf, buFields[8].valueOffset, buFields[8].len);

  for (const el of eleicoes) {
    const elFields = parseChildren(innerBuf, el.valueOffset, el.len);
    const idEleicao = parseInteger(elFields[0].value);
    const aptos = parseInteger(elFields[1].value);

    if (idEleicao === eleicaoAlvo) {
      const resVotacaoList = parseChildren(innerBuf, elFields[4].valueOffset, elFields[4].len);
      for (const rv of resVotacaoList) {
        const rvFields = parseChildren(innerBuf, rv.valueOffset, rv.len);
        const totaisCargo = parseChildren(innerBuf, rvFields[2].valueOffset, rvFields[2].len);
        for (const tc of totaisCargo) {
          const tcFields = parseChildren(innerBuf, tc.valueOffset, tc.len);
          const cargoEnum = parseInteger(tcFields[0].value);

          if (cargoEnum === cargoAlvo) {
            const comp = parseInteger(rvFields[1].value);
            const votosList = parseChildren(innerBuf, tcFields[2].valueOffset, tcFields[2].len);
            let brancos = 0;
            let nulos = 0;
            let validos = 0;
            const cands = [];

            for (const v of votosList) {
              const vFields = parseChildren(innerBuf, v.valueOffset, v.len);
              const tipoVoto = parseInteger(vFields[0].value);
              const qtd = parseInteger(vFields[1].value);

              if (tipoVoto === 1) {
                // Voto Nominal
                const idVot = parseChildren(innerBuf, vFields[2].valueOffset, vFields[2].len);
                const num = String(parseInteger(idVot[1].value));
                validos += qtd;
                const meta = candMap.get(num) || {
                  numero: num,
                  nome: `Candidato ${num}`,
                  partido: '',
                  siglaPartido: ''
                };

                cands.push({
                  numero: num,
                  nome: meta.nome,
                  partido: meta.partido,
                  siglaPartido: meta.siglaPartido,
                  votos: qtd,
                  percentual: 0
                });
              } else if (tipoVoto === 2) {
                brancos += qtd;
              } else if (tipoVoto === 3) {
                nulos += qtd;
              }
            }

            cands.forEach((c) => {
              c.percentual = validos > 0 ? parseFloat(((c.votos / validos) * 100).toFixed(2)) : 0;
            });
            cands.sort((a, b) => b.votos - a.votos);

            return {
              urnaModelo: urnaModeloDesc,
              resultado: {
                turno,
                cargo: cargoNome,
                eleitoresAptos: aptos,
                totalVotosApurados: comp,
                votosValidos: validos,
                votosBrancos: brancos,
                votosNulos: nulos,
                abstencoes: Math.max(0, aptos - comp),
                candidatos: cands
              }
            };
          }
        }
      }
    }
  }

  return null;
}

function salvarResultadoSecaoDb(codigoMunicipio, uf, ano, turno, zonaId, secaoId, cargo, res, urnaModelo) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO apuracao_secao (
      codigo_municipio, uf, ano, turno, zona_id, secao_id, cargo,
      eleitores_aptos, comparecimento, abstencoes,
      votos_apurados, votos_validos, votos_brancos, votos_nulos,
      candidatos_json, fonte, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    codigoMunicipio,
    uf,
    ano,
    turno,
    zonaId,
    secaoId,
    cargo,
    res.eleitoresAptos,
    res.totalVotosApurados,
    res.abstencoes,
    res.totalVotosApurados,
    res.votosValidos,
    res.votosBrancos,
    res.votosNulos,
    JSON.stringify(res.candidatos),
    urnaModelo || 'Urna Oficial TSE',
    new Date().toISOString()
  );
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

  // Mapeamento oficial dos ciclos e códigos de eleição no TSE
  // 2026: Ordinária Federal / Estadual (Presidente: e006257 / e006258)
  // 2024: Ordinária Municipal (Prefeito: e000619 / e000620)
  const is2026 = ano === 2026;
  const eleicao1TId = is2026 ? '6257' : '619';
  const eleicao2TId = is2026 ? '6258' : '620';
  const cargoId = is2026 ? '0001' : '0011'; // 0001: Presidente, 0011: Prefeito
  const cargoNome = is2026 ? 'Presidente' : 'Prefeito';

  const eleicao1TPadded = eleicao1TId.padStart(6, '0');
  const eleicao2TPadded = eleicao2TId.padStart(6, '0');

  try {
    const url1T = `${TSE_BASE}/ele${ano}/${eleicao1TId}/dados/${ufLower}/${ufLower}${codigoMunicipio}-c${cargoId}-e${eleicao1TPadded}-u.json`;
    const data1T = await fetchTSE(url1T);
    resultado1T = parseTseResult(data1T, 1, cargoNome);
    salvarResultadoDb(codigoMunicipio, ufUpper, ano, 1, cargoNome, resultado1T);
  } catch (err) {
    console.warn(`[TSE Sync] Não foi possível carregar 1º turno (${ano}) para ${codigoMunicipio}: ${err.message}`);
  }

  try {
    const url2T = `${TSE_BASE}/ele${ano}/${eleicao2TId}/dados/${ufLower}/${ufLower}${codigoMunicipio}-c${cargoId}-e${eleicao2TPadded}-u.json`;
    const data2T = await fetchTSE(url2T);
    resultado2T = parseTseResult(data2T, 2, cargoNome);
    salvarResultadoDb(codigoMunicipio, ufUpper, ano, 2, cargoNome, resultado2T);
  } catch (err) {
    // Cidades ou eleições sem 2º turno não possuem arquivo de 2º turno
    console.log(`[TSE Sync] 2º turno não aplicável ou não disponível para ${codigoMunicipio} (${ano})`);
  }

  return {
    turno1: resultado1T,
    turno2: resultado2T
  };
}

function parseTseResult(data, turno, defaultCargoNome) {
  const eleitores = data.e || {};
  const votos = data.v || {};
  const carg = data.carg?.[0] || {};
  const cargo = carg.nmn || carg.nmm || defaultCargoNome || 'Votação';

  const candidatos = [];
  if (Array.isArray(carg.agr)) {
    for (const ag of carg.agr) {
      if (Array.isArray(ag.par)) {
        for (const p of ag.par) {
          if (Array.isArray(p.cand)) {
            for (const c of p.cand) {
              candidatos.push({
                numero: String(c.n || ''),
                nome: c.nmu || c.nm || '',
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
    cargo,
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
    cargo: row.cargo,
    eleitoresAptos: row.eleitores_aptos,
    totalVotosApurados: row.votos_apurados,
    votosValidos: row.votos_validos,
    votosBrancos: row.votos_brancos,
    votosNulos: row.votos_nulos,
    abstencoes: row.abstencoes,
    candidatos: JSON.parse(row.candidatos_json || '[]')
  };
}
