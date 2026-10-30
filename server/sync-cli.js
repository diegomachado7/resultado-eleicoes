import { initDatabase } from './database.js';
import { syncUfConfig, getOuSincronizaApuracao } from './tseSync.js';

initDatabase();

const uf = (process.argv[2] || 'SP').toUpperCase();

console.log(`\n========================================`);
console.log(` Iniciando Sincronização TSE -> SQLite  `);
console.log(` UF Alvo: ${uf} `);
console.log(`========================================\n`);

try {
  const res = await syncUfConfig(uf);
  console.log(`\n✅ Sucesso! Total de municípios sincronizados: ${res.count}`);

  // Testando carregar Presidente Prudente (69299)
  console.log(`\n[Teste] Pré-carregando apuração oficial de Presidente Prudente (69299)...`);
  const ppResult = await getOuSincronizaApuracao(uf, '69299');
  console.log(`✅ Apuração 1º Turno Presidente Prudente carregada com ${ppResult.turno1?.candidatos?.length} candidatos!`);
  console.log(`Primeiro colocado: ${ppResult.turno1?.candidatos?.[0]?.nome} com ${ppResult.turno1?.candidatos?.[0]?.votos} votos (${ppResult.turno1?.candidatos?.[0]?.percentual}%)`);
  console.log(`\nSincronização concluída com sucesso no banco 'eleicoes.db'.\n`);
  process.exit(0);
} catch (err) {
  console.error('❌ Falha na sincronização:', err);
  process.exit(1);
}
