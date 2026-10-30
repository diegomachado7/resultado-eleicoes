import { useState, useEffect } from 'react';
import { ElectionService, ANOS_ELEICAO } from '../services/electionService';
import { SecaoData, CandidateVote, TurnoResult } from '../types/election';
import { SecaoSelector, SecaoSelectorValue } from './SecaoSelector';

interface ComparativoPageProps {
  onVoltarParaConsulta?: () => void;
}

export function ComparativoPage({ onVoltarParaConsulta }: ComparativoPageProps) {
  const [selectedAno, setSelectedAno] = useState<number>(2026);
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);

  // Configurações independentes para Urna A e Urna B
  const [secaoA, setSecaoA] = useState<SecaoSelectorValue>({
    uf: 'RS',
    municipio: '88013', // Porto Alegre
    zona: '0001',
    local: '1015',
    secao: '0001'
  });

  const [secaoB, setSecaoB] = useState<SecaoSelectorValue>({
    uf: 'AM',
    municipio: '02550', // Manaus
    zona: '0001',
    local: '1015',
    secao: '0001'
  });

  const [turnoSelecionado, setTurnoSelecionado] = useState<1 | 2>(1);

  const [secaoAData, setSecaoAData] = useState<SecaoData | null>(null);
  const [secaoBData, setSecaoBData] = useState<SecaoData | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  // 1. Carrega lista de Estados
  useEffect(() => {
    async function loadEstados() {
      const ufs = await ElectionService.getEstados();
      setEstados(ufs);
    }
    loadEstados();
  }, []);

  // 2. Carrega dados comparativos das Seções A e B
  useEffect(() => {
    if (!secaoA.secao || !secaoB.secao || !secaoA.municipio || !secaoB.municipio) {
      return;
    }

    let isMounted = true;
    async function loadComparativo() {
      setLoading(true);
      try {
        const [dataA, dataB] = await Promise.all([
          ElectionService.getSecaoDetails(
            secaoA.uf,
            secaoA.municipio,
            secaoA.zona,
            secaoA.local,
            secaoA.secao,
            selectedAno
          ),
          ElectionService.getSecaoDetails(
            secaoB.uf,
            secaoB.municipio,
            secaoB.zona,
            secaoB.local,
            secaoB.secao,
            selectedAno
          )
        ]);

        if (isMounted) {
          setSecaoAData(dataA);
          setSecaoBData(dataB);
        }
      } catch (err) {
        console.error('Erro ao carregar comparativo:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadComparativo();
    return () => {
      isMounted = false;
    };
  }, [secaoA, secaoB, selectedAno]);

  // Atalho 1: Porto Alegre (RS) vs Manaus (AM)
  const aplicarPresetPoaVsManaus = () => {
    setSelectedAno(2026);
    setTurnoSelecionado(1);
    setSecaoA({
      uf: 'RS',
      municipio: '88013',
      zona: '0001',
      local: '',
      secao: '0001'
    });
    setSecaoB({
      uf: 'AM',
      municipio: '02550',
      zona: '0001',
      local: '',
      secao: '0001'
    });
  };

  // Atalho 2: Presidente Prudente (SP) - Seções 0018 x 0019 (mesma zona)
  const aplicarPresetPrudente = () => {
    setSelectedAno(2026);
    setTurnoSelecionado(1);
    setSecaoA({
      uf: 'SP',
      municipio: '69299',
      zona: '0402',
      local: '1015',
      secao: '0018'
    });
    setSecaoB({
      uf: 'SP',
      municipio: '69299',
      zona: '0402',
      local: '1015',
      secao: '0019'
    });
  };

  // Copiar localização de A para B (para testar seções próximas rapidamente)
  const copiarAparaB = () => {
    setSecaoB({
      ...secaoA
    });
  };

  const turnoA: TurnoResult | undefined =
    turnoSelecionado === 1 ? secaoAData?.primeiroTurno : secaoAData?.segundoTurno;
  const turnoB: TurnoResult | undefined =
    turnoSelecionado === 1 ? secaoBData?.primeiroTurno : secaoBData?.segundoTurno;

  // Unificação dos candidatos para a tabela comparativa
  const candidatosMap = new Map<
    string,
    { candidato: CandidateVote; votosA: number; pctA: number; votosB: number; pctB: number }
  >();

  if (turnoA?.candidatos) {
    for (const c of turnoA.candidatos) {
      candidatosMap.set(c.numero, {
        candidato: c,
        votosA: c.votos,
        pctA: c.percentual,
        votosB: 0,
        pctB: 0
      });
    }
  }

  if (turnoB?.candidatos) {
    for (const c of turnoB.candidatos) {
      if (candidatosMap.has(c.numero)) {
        const item = candidatosMap.get(c.numero)!;
        item.votosB = c.votos;
        item.pctB = c.percentual;
      } else {
        candidatosMap.set(c.numero, {
          candidato: c,
          votosA: 0,
          pctA: 0,
          votosB: c.votos,
          pctB: c.percentual
        });
      }
    }
  }

  const candidatosComparados = Array.from(candidatosMap.values()).sort(
    (a, b) => b.votosA + b.votosB - (a.votosA + a.votosB)
  );

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Atalhos */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-sm font-bold text-slate-800">
            Comparativo Nacional e Interestadual entre Seções Eleitorais
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={aplicarPresetPoaVsManaus}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Confrontar Seção em Porto Alegre (RS) vs Manaus (AM)"
          >
            <span>🌎 Porto Alegre (RS) x Manaus (AM)</span>
          </button>
          <button
            type="button"
            onClick={aplicarPresetPrudente}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Carregar Seção 0018 vs Seção 0019 (Presidente Prudente / SP)"
          >
            <span>⚡ Prudente: 0018 x 0019</span>
          </button>
          {onVoltarParaConsulta && (
            <button
              type="button"
              onClick={onVoltarParaConsulta}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              ← Voltar para Consulta Simples
            </button>
          )}
        </div>
      </div>

      {/* Painel de Filtros e Seleção com Painéis de Urnas Independentes */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <span>⚙️ Configuração do Comparativo</span>
            </h2>
            <p className="text-xs text-slate-500">
              Escolha livremente o estado, município, zona e seção de cada urna para comparar
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Seletor de Ano */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Ano Eleitoral:</label>
              <select
                value={selectedAno}
                onChange={(e) => setSelectedAno(Number(e.target.value))}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ANOS_ELEICAO.map((a) => (
                  <option key={a.ano} value={a.ano}>
                    {a.ano} ({a.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Alternância de Turno */}
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
              <button
                type="button"
                onClick={() => setTurnoSelecionado(1)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  turnoSelecionado === 1
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1º Turno
              </button>
              <button
                type="button"
                onClick={() => setTurnoSelecionado(2)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  turnoSelecionado === 2
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2º Turno
              </button>
            </div>
          </div>
        </div>

        {/* Grade com Seletores Lado a Lado (Urna A e Urna B) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seletor Urna A */}
          <SecaoSelector
            label="Urna A (Referência)"
            badge="🗳️ Seção A"
            badgeColorClass="bg-emerald-100 text-emerald-800 border border-emerald-300"
            borderColorClass="border-emerald-500/80"
            ringFocusClass="focus:ring-emerald-500"
            estados={estados}
            value={secaoA}
            onChange={setSecaoA}
            fonteInfo={secaoAData?.fonte === 'BOLETIM_URNA_INDIVIDUAL' ? '✓ BU Oficial' : 'Consolidado'}
          />

          {/* Seletor Urna B */}
          <SecaoSelector
            label="Urna B (Comparada)"
            badge="🗳️ Seção B"
            badgeColorClass="bg-amber-100 text-amber-800 border border-amber-300"
            borderColorClass="border-amber-500/80"
            ringFocusClass="focus:ring-amber-500"
            estados={estados}
            value={secaoB}
            onChange={setSecaoB}
            fonteInfo={secaoBData?.fonte === 'BOLETIM_URNA_INDIVIDUAL' ? '✓ BU Oficial' : 'Consolidado'}
            onCopyFromOther={copiarAparaB}
            copyButtonLabel="Copiar Local de A"
          />
        </div>
      </div>

      {/* Resultados do Comparativo */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3"></div>
          <p className="text-sm font-semibold">Consultando Boletins de Urna no SQLite e TSE...</p>
        </div>
      ) : turnoA && turnoB ? (
        <div className="space-y-6">
          {/* Cartões Comparativos de Métricas Chave */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Eleitores Aptos */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Eleitores Aptos
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-emerald-700 font-semibold">A:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoA.eleitoresAptos.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-amber-700 font-semibold">B:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoB.eleitoresAptos.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Dif:{' '}
                <span className={turnoA.eleitoresAptos >= turnoB.eleitoresAptos ? 'text-emerald-700' : 'text-amber-700'}>
                  {turnoA.eleitoresAptos - turnoB.eleitoresAptos > 0 ? '+' : ''}
                  {turnoA.eleitoresAptos - turnoB.eleitoresAptos}
                </span>
              </div>
            </div>

            {/* Votos Válidos */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Votos Válidos
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-emerald-700 font-semibold">A:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoA.votosValidos.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-amber-700 font-semibold">B:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoB.votosValidos.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Dif:{' '}
                <span className={turnoA.votosValidos >= turnoB.votosValidos ? 'text-emerald-700' : 'text-amber-700'}>
                  {turnoA.votosValidos - turnoB.votosValidos > 0 ? '+' : ''}
                  {turnoA.votosValidos - turnoB.votosValidos}
                </span>
              </div>
            </div>

            {/* Comparecimento */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Comparecimento
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-emerald-700 font-semibold">A:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoA.totalVotosApurados.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-amber-700 font-semibold">B:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoB.totalVotosApurados.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Dif:{' '}
                <span className={turnoA.totalVotosApurados >= turnoB.totalVotosApurados ? 'text-emerald-700' : 'text-amber-700'}>
                  {turnoA.totalVotosApurados - turnoB.totalVotosApurados > 0 ? '+' : ''}
                  {turnoA.totalVotosApurados - turnoB.totalVotosApurados}
                </span>
              </div>
            </div>

            {/* Abstenções */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Abstenções
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-emerald-700 font-semibold">A:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoA.abstencoes.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-amber-700 font-semibold">B:</span>{' '}
                  <span className="text-base font-bold text-slate-800">
                    {turnoB.abstencoes.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Dif:{' '}
                <span className={turnoA.abstencoes >= turnoB.abstencoes ? 'text-amber-700' : 'text-emerald-700'}>
                  {turnoA.abstencoes - turnoB.abstencoes > 0 ? '+' : ''}
                  {turnoA.abstencoes - turnoB.abstencoes}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela Comparativa de Candidatos */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-amber-400">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>Confronto de Votação por Candidato</span>
                  <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded">
                    {turnoA.cargo || 'Cargo Disputado'} • {turnoSelecionado}º Turno
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Comparação direta: <strong className="text-emerald-400">{secaoAData?.nomeMunicipio || secaoA.uf} (Seção {secaoA.secao})</strong> vs <strong className="text-amber-400">{secaoBData?.nomeMunicipio || secaoB.uf} (Seção {secaoB.secao})</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {secaoAData?.nomeMunicipio || secaoA.uf} ({secaoA.secao})
                </span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> {secaoBData?.nomeMunicipio || secaoB.uf} ({secaoB.secao})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Candidato / Legenda</th>
                    <th className="py-3 px-4 text-right bg-emerald-50/70 border-l border-emerald-200 text-emerald-950">
                      Votos ({secaoAData?.nomeMunicipio || secaoA.uf} - {secaoA.secao})
                    </th>
                    <th className="py-3 px-4 text-right bg-emerald-50/70 text-emerald-950">% Urna A</th>
                    <th className="py-3 px-4 text-right bg-amber-50/70 border-l border-amber-200 text-amber-950">
                      Votos ({secaoBData?.nomeMunicipio || secaoB.uf} - {secaoB.secao})
                    </th>
                    <th className="py-3 px-4 text-right bg-amber-50/70 text-amber-950">% Urna B</th>
                    <th className="py-3 px-4 text-right border-l border-slate-300 font-black">
                      Diferença (A - B)
                    </th>
                    <th className="py-3 px-4 text-center">Vantagem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidatosComparados.map((item) => {
                    const diffVotos = item.votosA - item.votosB;
                    const diffPct = (item.pctA - item.pctB).toFixed(2);
                    const liderA = item.votosA > item.votosB;
                    const liderB = item.votosB > item.votosA;

                    return (
                      <tr key={item.candidato.numero} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                              {item.candidato.numero}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block text-sm">
                                {item.candidato.nome}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {item.candidato.siglaPartido} • {item.candidato.partido}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Colunas Seção A */}
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-bold text-sm bg-emerald-50/30 border-l border-emerald-100 ${
                            liderA ? 'text-emerald-800 font-black' : 'text-slate-700'
                          }`}
                        >
                          {item.votosA.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-600 bg-emerald-50/30">
                          {item.pctA.toFixed(2)}%
                        </td>

                        {/* Colunas Seção B */}
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-bold text-sm bg-amber-50/30 border-l border-amber-100 ${
                            liderB ? 'text-amber-800 font-black' : 'text-slate-700'
                          }`}
                        >
                          {item.votosB.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-600 bg-amber-50/30">
                          {item.pctB.toFixed(2)}%
                        </td>

                        {/* Diferença */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-xs border-l border-slate-200">
                          <span
                            className={
                              diffVotos > 0
                                ? 'text-emerald-700 font-bold'
                                : diffVotos < 0
                                ? 'text-amber-700 font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {diffVotos > 0 ? `+${diffVotos}` : diffVotos} ({diffVotos > 0 ? `+${diffPct}` : diffPct}%)
                          </span>
                        </td>

                        {/* Tag de Vantagem */}
                        <td className="py-3.5 px-4 text-center">
                          {diffVotos > 0 ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              + Urna A ({secaoAData?.nomeMunicipio || secaoA.uf})
                            </span>
                          ) : diffVotos < 0 ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              + Urna B ({secaoBData?.nomeMunicipio || secaoB.uf})
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              Empate
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé da Tabela com Brancos e Nulos */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">⚪ Votos em Branco</span>
                <div className="flex justify-between items-center text-xs">
                  <span>
                    {secaoAData?.nomeMunicipio || secaoA.uf} ({secaoA.secao}): <strong>{turnoA.votosBrancos}</strong>
                  </span>
                  <span>
                    {secaoBData?.nomeMunicipio || secaoB.uf} ({secaoB.secao}): <strong>{turnoB.votosBrancos}</strong>
                  </span>
                  <span className="font-bold text-slate-700">
                    Dif: {turnoA.votosBrancos - turnoB.votosBrancos}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">❌ Votos Nulos</span>
                <div className="flex justify-between items-center text-xs">
                  <span>
                    {secaoAData?.nomeMunicipio || secaoA.uf} ({secaoA.secao}): <strong>{turnoA.votosNulos}</strong>
                  </span>
                  <span>
                    {secaoBData?.nomeMunicipio || secaoB.uf} ({secaoB.secao}): <strong>{turnoB.votosNulos}</strong>
                  </span>
                  <span className="font-bold text-slate-700">
                    Dif: {turnoA.votosNulos - turnoB.votosNulos}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-700">
            Nenhum dado retornado para o turno selecionado entre as seções escolhidas.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verifique se ambas as seções estão cadastradas e possuem apuração apurada para o ano {selectedAno}.
          </p>
        </div>
      )}
    </div>
  );
}
