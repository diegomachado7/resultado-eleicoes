import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'eleicoes.db');

export const db = new Database(DB_PATH);

// Ativar modo WAL para alta performance concorrente
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

/**
 * Inicialização das tabelas no SQLite local
 */
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS estados (
      sigla TEXT PRIMARY KEY,
      nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS municipios (
      codigo_tse TEXT NOT NULL,
      uf TEXT NOT NULL,
      nome TEXT NOT NULL,
      PRIMARY KEY (codigo_tse, uf)
    );

    CREATE TABLE IF NOT EXISTS zonas (
      id TEXT NOT NULL,
      numero TEXT NOT NULL,
      codigo_municipio TEXT NOT NULL,
      uf TEXT NOT NULL,
      PRIMARY KEY (id, codigo_municipio, uf)
    );

    CREATE TABLE IF NOT EXISTS locais_votacao (
      id TEXT NOT NULL,
      numero TEXT NOT NULL,
      nome TEXT NOT NULL,
      endereco TEXT,
      bairro TEXT,
      zona_id TEXT NOT NULL,
      codigo_municipio TEXT NOT NULL,
      uf TEXT NOT NULL,
      PRIMARY KEY (id, zona_id, codigo_municipio, uf)
    );

    CREATE TABLE IF NOT EXISTS secoes (
      id TEXT NOT NULL,
      numero TEXT NOT NULL,
      urna_modelo TEXT,
      local_id TEXT NOT NULL,
      zona_id TEXT NOT NULL,
      codigo_municipio TEXT NOT NULL,
      uf TEXT NOT NULL,
      PRIMARY KEY (id, local_id, zona_id, codigo_municipio, uf)
    );

    CREATE TABLE IF NOT EXISTS apuracao_municipio (
      codigo_municipio TEXT NOT NULL,
      uf TEXT NOT NULL,
      ano INTEGER NOT NULL,
      turno INTEGER NOT NULL,
      cargo TEXT NOT NULL,
      eleitores_aptos INTEGER,
      comparecimento INTEGER,
      abstencoes INTEGER,
      votos_apurados INTEGER,
      votos_validos INTEGER,
      votos_brancos INTEGER,
      votos_nulos INTEGER,
      candidatos_json TEXT,
      atualizado_em TEXT,
      PRIMARY KEY (codigo_municipio, uf, ano, turno, cargo)
    );

    CREATE TABLE IF NOT EXISTS apuracao_secao (
      codigo_municipio TEXT NOT NULL,
      uf TEXT NOT NULL,
      ano INTEGER NOT NULL,
      turno INTEGER NOT NULL,
      zona_id TEXT NOT NULL,
      secao_id TEXT NOT NULL,
      cargo TEXT NOT NULL,
      eleitores_aptos INTEGER,
      comparecimento INTEGER,
      abstencoes INTEGER,
      votos_apurados INTEGER,
      votos_validos INTEGER,
      votos_brancos INTEGER,
      votos_nulos INTEGER,
      candidatos_json TEXT,
      fonte TEXT DEFAULT 'BOLETIM_URNA',
      atualizado_em TEXT,
      PRIMARY KEY (codigo_municipio, uf, ano, turno, zona_id, secao_id, cargo)
    );

    CREATE TABLE IF NOT EXISTS sync_status (
      chave TEXT PRIMARY KEY,
      atualizado_em TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_municipios_uf ON municipios(uf);
    CREATE INDEX IF NOT EXISTS idx_zonas_muni ON zonas(codigo_municipio, uf);
    CREATE INDEX IF NOT EXISTS idx_locais_zona ON locais_votacao(zona_id, codigo_municipio, uf);
    CREATE INDEX IF NOT EXISTS idx_secoes_local ON secoes(local_id, zona_id, codigo_municipio, uf);
    CREATE INDEX IF NOT EXISTS idx_apuracao_secao_lookup ON apuracao_secao(codigo_municipio, uf, ano, turno, zona_id, secao_id);
  `);

  // Popula os 27 estados do Brasil se ainda não existirem
  const countEstados = db.prepare('SELECT COUNT(*) as count FROM estados').get();
  if (countEstados.count === 0) {
    const insertEstado = db.prepare('INSERT INTO estados (sigla, nome) VALUES (?, ?)');
    const insertMany = db.transaction((estados) => {
      for (const e of estados) {
        insertEstado.run(e.sigla, e.nome);
      }
    });

    insertMany([
      { sigla: 'AC', nome: 'Acre' },
      { sigla: 'AL', nome: 'Alagoas' },
      { sigla: 'AP', nome: 'Amapá' },
      { sigla: 'AM', nome: 'Amazonas' },
      { sigla: 'BA', nome: 'Bahia' },
      { sigla: 'CE', nome: 'Ceará' },
      { sigla: 'DF', nome: 'Distrito Federal' },
      { sigla: 'ES', nome: 'Espírito Santo' },
      { sigla: 'GO', nome: 'Goiás' },
      { sigla: 'MA', nome: 'Maranhão' },
      { sigla: 'MT', nome: 'Mato Grosso' },
      { sigla: 'MS', nome: 'Mato Grosso do Sul' },
      { sigla: 'MG', nome: 'Minas Gerais' },
      { sigla: 'PA', nome: 'Pará' },
      { sigla: 'PB', nome: 'Paraíba' },
      { sigla: 'PR', nome: 'Paraná' },
      { sigla: 'PE', nome: 'Pernambuco' },
      { sigla: 'PI', nome: 'Piauí' },
      { sigla: 'RJ', nome: 'Rio de Janeiro' },
      { sigla: 'RN', nome: 'Rio Grande do Norte' },
      { sigla: 'RS', nome: 'Rio Grande do Sul' },
      { sigla: 'RO', nome: 'Rondônia' },
      { sigla: 'RR', nome: 'Roraima' },
      { sigla: 'SC', nome: 'Santa Catarina' },
      { sigla: 'SP', nome: 'São Paulo' },
      { sigla: 'SE', nome: 'Sergipe' },
      { sigla: 'TO', nome: 'Tocantins' },
      { sigla: 'ZZ', nome: 'Exterior' }
    ]);
  }
}
