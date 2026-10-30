import { useState, useEffect } from 'react';
import { FilterSelector } from './components/FilterSelector';
import { TurnoCard } from './components/TurnoCard';
import { ElectionService, SqliteStats } from './services/electionService';
import { Municipio, ZonaEleitoral, LocalVotacao, SecaoData } from './types/election';

export function App() {
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

  // 6. Quando muda Seção -> Carrega resultado detalhado da apuração
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
        selectedSecao
      );
      setActiveSecaoData(data);
      setLoading(false);
    }

    loadSecaoVotacao();
  }, [selectedSecao, selectedMunicipio, selectedZona, selectedLocal, selectedEstado]);

  const currentLocalInfo = locais.find((l) => l.id === selectedLocal);
  const currentMuniInfo = municipios.find((m) => m.codigoTse === selectedMunicipio);
  const currentZonaInfo = zonas.find((z) => z.id === selectedZona);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Topo / Header Oficial */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30 mb-1">
                TSE • Justiça Eleitoral
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Divulgação de Resultados • Dados Oficiais do TSE
              </h1>
              <p className="text-xs text-slate-400">
                Consulta granular de Boletim de Urna (BU) e apuração com persistência em SQLite Local
              </p>
            </div>

            <div className="flex items-center gap-3">
              {dbStats && (
                <div className="bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-700 text-right">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">
                    ● SQLite Conectado
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
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
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Boletim de Urna • Detalhes da Seção
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Votação Apurada • {currentMuniInfo?.nome} (Seção {activeSecaoData.numero})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Fonte: Tribunal Superior Eleitoral (TSE)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1º Turno */}
              <TurnoCard
                titulo="1º Turno"
                subtitulo={`Eleição Oficial • ${currentMuniInfo?.nome}`}
                data={activeSecaoData.primeiroTurno}
                corDestaque="blue"
              />

              {/* 2º Turno */}
              {activeSecaoData.segundoTurno ? (
                <TurnoCard
                  titulo="2º Turno"
                  subtitulo={`Eleição Oficial • ${currentMuniInfo?.nome}`}
                  data={activeSecaoData.segundoTurno}
                  corDestaque="indigo"
                />
              ) : (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <span className="font-bold text-lg">1T</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">Eleição Definida em 1º Turno</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Nesta localidade o pleito foi decidido no 1º turno ou o município possui menos de 200 mil eleitores.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-400">
            <p className="text-base font-medium">
              {loading ? 'Consultando base local SQLite / TSE...' : 'Selecione uma Seção Eleitoral acima para visualizar os votos computados.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
