import { useState, useEffect } from 'react';
import { FilterSelector } from './components/FilterSelector';
import { TurnoCard } from './components/TurnoCard';
import { ElectionService, ANOS_ELEICAO, SqliteStats } from './services/electionService';
import { Municipio, ZonaEleitoral, LocalVotacao, SecaoData } from './types/election';

export function App() {
  const [selectedAno, setSelectedAno] = useState<number>(2024);
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>('SP');

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  // Inicia com Presidente Prudente (69299) ou São Paulo (71072)
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('69299');

  const [zonas, setZonas] = useState<ZonaEleitoral[]>([]);
  const [selectedZona, setSelectedZona] = useState<string>('0101');

  const [locais, setLocais] = useState<LocalVotacao[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<string>('');

  const [secoes, setSecoes] = useState<SecaoData[]>([]);
  const [selectedSecao, setSelectedSecao] = useState<string>('');

  const [activeSecaoData, setActiveSecaoData] = useState<SecaoData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dbStats, setDbStats] = useState<SqliteStats | null>(null);

  const currentAnoObj = ANOS_ELEICAO.find((a) => a.ano === selectedAno) || ANOS_ELEICAO[0];

  // 1. Carregar Estados e Stats do SQLite
  useEffect(() => {
    async function loadInitial() {
      const ufs = await ElectionService.getEstados();
      setEstados(ufs);
      const stats = await ElectionService.getStats();
      setDbStats(stats);
    }
    loadInitial();
  }, []);

  // 2. Quando muda Estado -> Carrega Lista de Municípios
  useEffect(() => {
    if (!selectedEstado) {
      setMunicipios([]);
      setSelectedMunicipio('');
      return;
    }
    async function loadMunicipios() {
      setLoading(true);
      const munis = await ElectionService.getMunicipios(selectedEstado);
      setMunicipios(munis);

      if (munis.length > 0) {
        // Se Presidente Prudente ou o selecionado existir na lista, mantém
        const exists = munis.find((m) => m.codigoTse === selectedMunicipio);
        const novoMuni = exists
          ? selectedMunicipio
          : munis.find((m) => m.codigoTse === '69299')?.codigoTse || munis[0].codigoTse;
        setSelectedMunicipio(novoMuni);
      } else {
        setSelectedMunicipio('');
      }
      setLoading(false);

      // Atualiza stats
      const stats = await ElectionService.getStats();
      setDbStats(stats);
    }
    loadMunicipios();
  }, [selectedEstado]);

  // 3. Quando muda Município -> Carrega Zonas, Locais e Seções detalhadas daquele Município
  useEffect(() => {
    if (!selectedMunicipio) {
      setZonas([]);
      setSelectedZona('');
      setLocais([]);
      setSelectedLocal('');
      setSecoes([]);
      setSelectedSecao('');
      return;
    }

    async function loadMunicipioHierarchy() {
      setLoading(true);
      const details = await ElectionService.getMunicipioDetails(selectedEstado, selectedMunicipio);
      if (details && Array.isArray(details.zonas) && details.zonas.length > 0) {
        setZonas(details.zonas);
        const firstZona = details.zonas.find((z) => z.id === selectedZona) || details.zonas[0];
        setSelectedZona(firstZona.id);

        if (firstZona.locais && firstZona.locais.length > 0) {
          setLocais(firstZona.locais);
          const firstLocal = firstZona.locais[0];
          setSelectedLocal(firstLocal.id);

          if (firstLocal.secoes && firstLocal.secoes.length > 0) {
            setSecoes(firstLocal.secoes);
            setSelectedSecao(firstLocal.secoes[0].id);
          } else {
            setSecoes([]);
            setSelectedSecao('');
          }
        } else {
          setLocais([]);
          setSelectedLocal('');
        }
      } else {
        setZonas([]);
        setSelectedZona('');
      }
      setLoading(false);
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
        const nextSecao = nextLocal.secoes.find((s) => s.id === selectedSecao) || nextLocal.secoes[0];
        setSelectedSecao(nextSecao.id);
      } else {
        setSecoes([]);
        setSelectedSecao('');
      }
    } else {
      setLocais([]);
      setSelectedLocal('');
    }
  }, [selectedZona, zonas]);

  // 5. Quando muda Local
  useEffect(() => {
    const currentLocal = locais.find((l) => l.id === selectedLocal);
    if (currentLocal && currentLocal.secoes.length > 0) {
      setSecoes(currentLocal.secoes);
      const nextSecao = currentLocal.secoes.find((s) => s.id === selectedSecao) || currentLocal.secoes[0];
      setSelectedSecao(nextSecao.id);
    } else {
      setSecoes([]);
      setSelectedSecao('');
    }
  }, [selectedLocal, locais]);

  // 6. Quando muda Seção ou Ano -> Carrega resultado detalhado da apuração
  useEffect(() => {
    if (!selectedSecao || !selectedMunicipio) {
      setActiveSecaoData(null);
      return;
    }

    async function loadSecaoVotacao() {
      setLoading(true);
      const data = await ElectionService.getSecaoDetails(
        selectedEstado,
        selectedMunicipio,
        selectedZona,
        selectedLocal,
        selectedSecao,
        selectedAno
      );
      setActiveSecaoData(data);
      setLoading(false);
    }

    loadSecaoVotacao();
  }, [selectedSecao, selectedMunicipio, selectedZona, selectedLocal, selectedEstado, selectedAno]);

  const currentLocalInfo = locais.find((l) => l.id === selectedLocal);
  const currentMuniInfo = municipios.find((m) => m.codigoTse === selectedMunicipio);
  const currentZonaInfo = zonas.find((z) => z.id === selectedZona);

  return (
    <div className="min-h-screen bg-emerald-950/5 text-slate-800">
      {/* Topo / Header Oficial nas cores Verde e Amarelo do Brasil / Justiça Eleitoral */}
      <header className="bg-emerald-900 text-white border-b-4 border-amber-400 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400 text-emerald-950 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs mb-1">
                BRASIL • TSE / TRE • JUSTIÇA ELEITORAL
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Divulgação de Resultados Oficiais
              </h1>
              <p className="text-xs text-emerald-100/80">
                Consulta granular por Ano, Estado, Município, Zona, Local e Seção (Boletim de Urna - BU)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {dbStats && (
                <div className="bg-emerald-950/60 px-3.5 py-2 rounded-lg border border-emerald-700/60 text-right">
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">
                    ● Banco Local SQLite Conectado
                  </span>
                  <span className="text-xs font-semibold text-emerald-100">
                    {dbStats.municipios} cidades • {dbStats.secoes.toLocaleString('pt-BR')} seções
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Seletor em Cascata */}
        <FilterSelector
          anos={ANOS_ELEICAO}
          selectedAno={selectedAno}
          onSelectAno={setSelectedAno}
          estados={estados}
          selectedEstado={selectedEstado}
          onSelectEstado={setSelectedEstado}
          municipios={municipios}
          selectedMunicipio={selectedMunicipio}
          onSelectMunicipio={setSelectedMunicipio}
          zonas={zonas}
          selectedZona={selectedZona}
          onSelectZona={setSelectedZona}
          locais={locais}
          selectedLocal={selectedLocal}
          onSelectLocal={setSelectedLocal}
          secoes={secoes}
          selectedSecao={selectedSecao}
          onSelectSecao={setSelectedSecao}
          loading={loading}
        />

        {/* Resumo da Localização e Identificação da Urna */}
        {activeSecaoData && currentLocalInfo && (
          <div className="bg-white rounded-xl shadow-xs border-l-4 border-l-emerald-600 border border-slate-200 p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Eleição {selectedAno} • {currentAnoObj.tipo}
                  </span>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {activeSecaoData.fonte === 'CONSOLIDADO_MUNICIPAL' ? 'Consolidado Municipal' : 'Boletim de Urna (BU Oficial)'}
                  </span>
                  {activeSecaoData.fonte === 'BOLETIM_URNA_INDIVIDUAL' && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-300">
                      ✓ Votação Real da Urna
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {currentLocalInfo.nome} — Seção nº {activeSecaoData.numero}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentLocalInfo.endereco} - {currentLocalInfo.bairro} • {currentMuniInfo?.nome}/{selectedEstado} • {currentZonaInfo?.numero}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Modelo da Urna</span>
                  <span className="font-mono font-semibold text-slate-800">{activeSecaoData.urnaEletronica}</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div>
                  <span className="text-slate-400 block font-medium">Eleitores Aptos</span>
                  <span className="font-semibold text-slate-800">
                    {activeSecaoData.primeiroTurno?.eleitoresAptos?.toLocaleString('pt-BR') || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparativo de 1º e 2º Turno */}
        {activeSecaoData?.primeiroTurno ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <span>Votação Apurada • {currentMuniInfo?.nome} (Seção {activeSecaoData.numero})</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Dados Oficiais: Tribunal Superior Eleitoral (TSE)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1º Turno */}
              <TurnoCard
                titulo="1º Turno"
                subtitulo={`Eleição Oficial ${selectedAno} • ${currentMuniInfo?.nome}`}
                data={activeSecaoData.primeiroTurno}
                dataEleicao={currentAnoObj.dataPrimeiroTurno}
                corDestaque="emerald"
              />

              {/* 2º Turno */}
              {activeSecaoData.segundoTurno ? (
                <TurnoCard
                  titulo="2º Turno"
                  subtitulo={`Eleição Oficial ${selectedAno} • ${currentMuniInfo?.nome}`}
                  data={activeSecaoData.segundoTurno}
                  dataEleicao={currentAnoObj.dataSegundoTurno}
                  corDestaque="amber"
                />
              ) : (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3">
                    <span className="font-bold text-lg">1T</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">Pleito Definido em 1º Turno</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Nesta localidade o pleito foi encerrado em 1º turno em {currentAnoObj.dataPrimeiroTurno} ou o município possui menos de 200 mil eleitores.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-500">
            {selectedAno === 2026 ? (
              <div className="max-w-md mx-auto flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold mb-4 shadow-xs border border-amber-300">
                  ⚖️
                </div>
                <h4 className="text-lg font-bold text-emerald-950 mb-2">Eleições Gerais 2026</h4>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  O ano eleitoral de <strong>2026</strong> já está mapeado no sistema. Os arquivos oficiais e boletins de urna (BU) consolidados por seção são disponibilizados pelo TSE após a homologação e fechamento dos relatórios oficiais do pleito.
                </p>
                <div className="inline-flex items-center gap-2 text-xs bg-emerald-50 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-lg font-medium">
                  <span>🗳️ <strong>1º Turno:</strong> {currentAnoObj.dataPrimeiroTurno}</span>
                  <span>•</span>
                  <span><strong>2º Turno:</strong> {currentAnoObj.dataSegundoTurno}</span>
                </div>
              </div>
            ) : (
              <p className="text-base font-medium">
                {loading ? 'Consultando base local SQLite / TSE...' : 'Selecione uma Seção Eleitoral acima para visualizar os votos computados.'}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

