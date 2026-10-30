import { useState, useEffect } from 'react';
import { FilterSelector } from './components/FilterSelector';
import { TurnoCard } from './components/TurnoCard';
import { ElectionService } from './services/electionService';
import { Municipio, ZonaEleitoral, LocalVotacao, SecaoData } from './types/election';

export function App() {
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>('SP');

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('71072');

  const [zonas, setZonas] = useState<ZonaEleitoral[]>([]);
  const [selectedZona, setSelectedZona] = useState<string>('0001');

  const [locais, setLocais] = useState<LocalVotacao[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<string>('1015');

  const [secoes, setSecoes] = useState<SecaoData[]>([]);
  const [selectedSecao, setSelectedSecao] = useState<string>('0001');

  const [activeSecaoData, setActiveSecaoData] = useState<SecaoData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar Estados
  useEffect(() => {
    async function loadEstados() {
      const ufs = await ElectionService.getEstados();
      setEstados(ufs);
    }
    loadEstados();
  }, []);

  // Quando muda Estado
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
        // Se o município atual pertencer ao estado mantém, senão seleciona o primeiro
        const exists = munis.find((m) => m.codigoTse === selectedMunicipio);
        const novoMuni = exists ? selectedMunicipio : munis[0].codigoTse;
        setSelectedMunicipio(novoMuni);
      } else {
        setSelectedMunicipio('');
      }
      setLoading(false);
    }
    loadMunicipios();
  }, [selectedEstado]);

  // Quando muda Município
  useEffect(() => {
    const currentMuni = municipios.find((m) => m.codigoTse === selectedMunicipio);
    if (currentMuni && currentMuni.zonas.length > 0) {
      setZonas(currentMuni.zonas);
      const exists = currentMuni.zonas.find((z) => z.id === selectedZona);
      setSelectedZona(exists ? selectedZona : currentMuni.zonas[0].id);
    } else {
      setZonas([]);
      setSelectedZona('');
    }
  }, [selectedMunicipio, municipios]);

  // Quando muda Zona
  useEffect(() => {
    const currentZona = zonas.find((z) => z.id === selectedZona);
    if (currentZona && currentZona.locais.length > 0) {
      setLocais(currentZona.locais);
      const exists = currentZona.locais.find((l) => l.id === selectedLocal);
      setSelectedLocal(exists ? selectedLocal : currentZona.locais[0].id);
    } else {
      setLocais([]);
      setSelectedLocal('');
    }
  }, [selectedZona, zonas]);

  // Quando muda Local
  useEffect(() => {
    const currentLocal = locais.find((l) => l.id === selectedLocal);
    if (currentLocal && currentLocal.secoes.length > 0) {
      setSecoes(currentLocal.secoes);
      const exists = currentLocal.secoes.find((s) => s.id === selectedSecao);
      setSelectedSecao(exists ? selectedSecao : currentLocal.secoes[0].id);
    } else {
      setSecoes([]);
      setSelectedSecao('');
    }
  }, [selectedLocal, locais]);

  // Quando muda a Seção Selecionada
  useEffect(() => {
    if (!selectedSecao) {
      setActiveSecaoData(null);
      return;
    }
    const currentSecao = secoes.find((s) => s.id === selectedSecao);
    setActiveSecaoData(currentSecao || null);
  }, [selectedSecao, secoes]);

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
                Divulgação de Resultados • Eleições 2026
              </h1>
              <p className="text-xs text-slate-400">
                Consulta granular de Boletim de Urna (BU) por Estado, Município, Zona, Local e Seção
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-700 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Pleito</span>
                <span className="text-sm font-bold text-slate-200">Presidente da República</span>
              </div>
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
                  <span className="font-semibold text-slate-800">{activeSecaoData.primeiroTurno.eleitoresAptos}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparativo de 1º e 2º Turno */}
        {activeSecaoData ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Votação Apurada na Seção {activeSecaoData.numero}
              </h3>
              <span className="text-xs text-slate-500">
                Comparativo de Turnos
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1º Turno */}
              <TurnoCard
                titulo="1º Turno"
                subtitulo="Eleição Geral Ordinária 2026"
                data={activeSecaoData.primeiroTurno}
                corDestaque="blue"
              />

              {/* 2º Turno */}
              <TurnoCard
                titulo="2º Turno"
                subtitulo="Eleição Geral Ordinária 2026"
                data={activeSecaoData.segundoTurno}
                corDestaque="indigo"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-400">
            <p className="text-base font-medium">Selecione uma Seção Eleitoral acima para visualizar os votos computados.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
