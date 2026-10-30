import { useState, useEffect } from 'react';
import { ElectionService, ANOS_ELEICAO } from '../services/electionService';
import { Municipio, ZonaEleitoral, LocalVotacao, SecaoData, CandidateVote, TurnoResult } from '../types/election';

interface ComparativoPageProps {
  onVoltarParaConsulta?: () => void;
}

export function ComparativoPage({ onVoltarParaConsulta }: ComparativoPageProps) {
  const [selectedAno, setSelectedAno] = useState<number>(2026);
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>('SP');

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('69299');

  const [zonas, setZonas] = useState<ZonaEleitoral[]>([]);
  const [selectedZona, setSelectedZona] = useState<string>('0402');

  const [locais, setLocais] = useState<LocalVotacao[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<string>('');

  const [secoes, setSecoes] = useState<SecaoData[]>([]);
  const [secaoAId, setSecaoAId] = useState<string>('0018');
  const [secaoBId, setSecaoBId] = useState<string>('0019');

  const [turnoSelecionado, setTurnoSelecionado] = useState<1 | 2>(1);

  const [secaoAData, setSecaoAData] = useState<SecaoData | null>(null);
  const [secaoBData, setSecaoBData] = useState<SecaoData | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  // 1. Carrega Estados
  useEffect(() => {
    async function loadEstados() {
      const ufs = await ElectionService.getEstados();
      setEstados(ufs);
    }
    loadEstados();
  }, []);

  // 2. Quando muda Estado
  useEffect(() => {
    if (!selectedEstado) {
      setMunicipios([]);
      setSelectedMunicipio('');
      return;
    }
    async function loadMunicipios() {
      const munis = await ElectionService.getMunicipios(selectedEstado);
      setMunicipios(munis);

      if (munis.length > 0) {
        const exists = munis.find((m) => m.codigoTse === selectedMunicipio);
        const novoMuni = exists
          ? selectedMunicipio
          : munis.find((m) => m.codigoTse === '69299')?.codigoTse || munis[0].codigoTse;
        setSelectedMunicipio(novoMuni);
      } else {
        setSelectedMunicipio('');
      }
    }
    loadMunicipios();
  }, [selectedEstado]);

  // 3. Quando muda Município
  useEffect(() => {
    if (!selectedMunicipio) {
      setZonas([]);
      setSelectedZona('');
      setLocais([]);
      setSelectedLocal('');
      setSecoes([]);
      return;
    }

    async function loadMunicipioHierarchy() {
      const details = await ElectionService.getMunicipioDetails(selectedEstado, selectedMunicipio);
      if (details && Array.isArray(details.zonas) && details.zonas.length > 0) {
        setZonas(details.zonas);
        const targetZona = details.zonas.find((z) => z.id === selectedZona) || details.zonas[0];
        setSelectedZona(targetZona.id);

        if (targetZona.locais && targetZona.locais.length > 0) {
          setLocais(targetZona.locais);
          const firstLocal = targetZona.locais[0];
          setSelectedLocal(firstLocal.id);

          if (firstLocal.secoes && firstLocal.secoes.length > 0) {
            setSecoes(firstLocal.secoes);
            // Preserva 0018 e 0019 se existirem, senão pega primeiras
            const has18 = firstLocal.secoes.find((s) => s.id === '0018' || s.numero === '0018');
            const has19 = firstLocal.secoes.find((s) => s.id === '0019' || s.numero === '0019');

            setSecaoAId(has18 ? has18.id : firstLocal.secoes[0]?.id || '');
            setSecaoBId(has19 ? has19.id : firstLocal.secoes[1]?.id || firstLocal.secoes[0]?.id || '');
          }
        }
      }
    }

    loadMunicipioHierarchy();
  }, [selectedMunicipio, selectedEstado]);

  // 4. Quando muda Zona
  useEffect(() => {
    const currentZona = zonas.find((z) => z.id === selectedZona);
    if (currentZona && currentZona.locais.length > 0) {
      setLocais(currentZona.locais);
      const nextLocal = currentZona.locais.find((l) => l.id === selectedLocal) || currentZona.locais[0];
      setSelectedLocal(nextLocal.id);

      if (nextLocal.secoes.length > 0) {
        setSecoes(nextLocal.secoes);
        const has18 = nextLocal.secoes.find((s) => s.id === '0018' || s.numero === '0018');
        const has19 = nextLocal.secoes.find((s) => s.id === '0019' || s.numero === '0019');

        if (has18 && has19 && selectedZona === '0402') {
          setSecaoAId(has18.id);
          setSecaoBId(has19.id);
        } else {
          setSecaoAId(nextLocal.secoes[0]?.id || '');
          setSecaoBId(nextLocal.secoes[1]?.id || nextLocal.secoes[0]?.id || '');
        }
      }
    }
  }, [selectedZona, zonas]);

  // 5. Carregar dados comparativos das Seções A e B
  useEffect(() => {
    if (!secaoAId || !secaoBId || !selectedMunicipio) {
      setSecaoAData(null);
      setSecaoBData(null);
      return;
    }

    async function loadComparativo() {
      setLoading(true);
      try {
        const [dataA, dataB] = await Promise.all([
          ElectionService.getSecaoDetails(
            selectedEstado,
            selectedMunicipio,
            selectedZona,
            selectedLocal,
            secaoAId,
            selectedAno
          ),
          ElectionService.getSecaoDetails(
            selectedEstado,
            selectedMunicipio,
            selectedZona,
            selectedLocal,
            secaoBId,
            selectedAno
          )
        ]);
        setSecaoAData(dataA);
        setSecaoBData(dataB);
      } catch (err) {
        console.error('Erro ao carregar comparativo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadComparativo();
  }, [selectedEstado, selectedMunicipio, selectedZona, selectedLocal, secaoAId, secaoBId, selectedAno]);

  // Exemplo rápido: Presidente Prudente / Zona 402 / Seções 0018 vs 0019 (2026)
  const aplicarExemploPrudente2026 = () => {
    setSelectedAno(2026);
    setSelectedEstado('SP');
    setSelectedMunicipio('69299');
    setSelectedZona('0402');
    setSecaoAId('0018');
    setSecaoBId('0019');
    setTurnoSelecionado(1);
  };

  const currentMuniInfo = municipios.find((m) => m.codigoTse === selectedMunicipio);
  const currentZonaInfo = zonas.find((z) => z.id === selectedZona);

  const turnoA: TurnoResult | undefined =
    turnoSelecionado === 1 ? secaoAData?.primeiroTurno : secaoAData?.segundoTurno;
  const turnoB: TurnoResult | undefined =
    turnoSelecionado === 1 ? secaoBData?.primeiroTurno : secaoBData?.segundoTurno;

  // Unificação dos candidatos para a tabela comparativa
  const candidatosMap = new Map<string, { candidato: CandidateVote; votosA: number; pctA: number; votosB: number; pctB: number }>();

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
            Comparativo Oficial entre Seções Eleitorais (Urna A vs Urna B)
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={aplicarExemploPrudente2026}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Carregar Seção 0018 vs Seção 0019 (2026 - Presidente Prudente / Zona 402)"
          >
            <span>⚡ Exemplo Real: Seção 0018 x 0019 (Pres. Prudente / 2026)</span>
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

      {/* Painel de Filtros e Seleção */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="border-b border-slate-200 pb-3 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
            <span>⚙️ Configuração do Comparativo</span>
          </h2>
          <p className="text-xs text-slate-500">
            Selecione a eleição, localidade e as duas seções eleitorais que deseja confrontar
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Ano */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ano da Eleição</label>
            <select
              value={selectedAno}
              onChange={(e) => setSelectedAno(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ANOS_ELEICAO.map((a) => (
                <option key={a.ano} value={a.ano}>
                  {a.ano} ({a.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* UF */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Estado (TRE)</label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {estados.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>
                  {uf.sigla} - {uf.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Município */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Município</label>
            <select
              value={selectedMunicipio}
              onChange={(e) => setSelectedMunicipio(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {municipios.map((m) => (
                <option key={m.codigoTse} value={m.codigoTse}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Zona Eleitoral */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Zona Eleitoral</label>
            <select
              value={selectedZona}
              onChange={(e) => setSelectedZona(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.numero}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Seleção Lado a Lado das Seções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          {/* Seção A */}
          <div className="bg-white p-3.5 rounded-lg border-2 border-emerald-500/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                🗳️ Seção A (Referência)
              </span>
              <span className="text-[11px] text-slate-500">
                {secaoAData?.fonte === 'BOLETIM_URNA_INDIVIDUAL' ? '✓ BU Individual' : 'Consolidado'}
              </span>
            </div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Seção / Urna A</label>
            <select
              value={secaoAId}
              onChange={(e) => setSecaoAId(e.target.value)}
              className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {secoes.map((s) => (
                <option key={`a-${s.id}`} value={s.id}>
                  Seção {s.numero} {s.urnaEletronica ? `(${s.urnaEletronica})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Seção B */}
          <div className="bg-white p-3.5 rounded-lg border-2 border-amber-500/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                🗳️ Seção B (Comparada)
              </span>
              <span className="text-[11px] text-slate-500">
                {secaoBData?.fonte === 'BOLETIM_URNA_INDIVIDUAL' ? '✓ BU Individual' : 'Consolidado'}
              </span>
            </div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Seção / Urna B</label>
            <select
              value={secaoBId}
              onChange={(e) => setSecaoBId(e.target.value)}
              className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {secoes.map((s) => (
                <option key={`b-${s.id}`} value={s.id}>
                  Seção {s.numero} {s.urnaEletronica ? `(${s.urnaEletronica})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alternância de Turno */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-600">
            Localidade:{' '}
            <strong className="text-slate-800">
              {currentMuniInfo?.nome} / {selectedEstado}
            </strong>{' '}
            • {currentZonaInfo?.numero}
            {locais.length > 0 && selectedLocal && (
              <span className="text-slate-500 block sm:inline sm:ml-1">
                • {locais.find((l) => l.id === selectedLocal)?.nome || 'Polo de Votação'}
              </span>
            )}
          </div>

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
                  Comparação direta entre Seção {secaoAId} e Seção {secaoBId}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Seção {secaoAId}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Seção {secaoBId}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Candidato / Legenda</th>
                    <th className="py-3 px-4 text-right bg-emerald-50/70 border-l border-emerald-200 text-emerald-950">
                      Votos (Seção {secaoAId})
                    </th>
                    <th className="py-3 px-4 text-right bg-emerald-50/70 text-emerald-950">% Seção {secaoAId}</th>
                    <th className="py-3 px-4 text-right bg-amber-50/70 border-l border-amber-200 text-amber-950">
                      Votos (Seção {secaoBId})
                    </th>
                    <th className="py-3 px-4 text-right bg-amber-50/70 text-amber-950">% Seção {secaoBId}</th>
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
                              + Seção {secaoAId}
                            </span>
                          ) : diffVotos < 0 ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              + Seção {secaoBId}
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
                    Seção {secaoAId}: <strong>{turnoA.votosBrancos}</strong>
                  </span>
                  <span>
                    Seção {secaoBId}: <strong>{turnoB.votosBrancos}</strong>
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
                    Seção {secaoAId}: <strong>{turnoA.votosNulos}</strong>
                  </span>
                  <span>
                    Seção {secaoBId}: <strong>{turnoB.votosNulos}</strong>
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
            Nenhum dado retornado para o turno selecionado nas seções {secaoAId} e {secaoBId}.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verifique se ambas as seções estão cadastradas e possuem apuração apurada para o ano {selectedAno}.
          </p>
        </div>
      )}
    </div>
  );
}
