import React from 'react';
import { Municipio, ZonaEleitoral, LocalVotacao, SecaoData, AnoEleicao } from '../types/election';

interface FilterSelectorProps {
  anos: AnoEleicao[];
  selectedAno: number;
  onSelectAno: (ano: number) => void;

  estados: { sigla: string; nome: string }[];
  selectedEstado: string;
  onSelectEstado: (uf: string) => void;

  municipios: Municipio[];
  selectedMunicipio: string;
  onSelectMunicipio: (cod: string) => void;

  zonas: ZonaEleitoral[];
  selectedZona: string;
  onSelectZona: (zonaId: string) => void;

  locais: LocalVotacao[];
  selectedLocal: string;
  onSelectLocal: (localId: string) => void;

  secoes: SecaoData[];
  selectedSecao: string;
  onSelectSecao: (secaoId: string) => void;

  loading?: boolean;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  anos,
  selectedAno,
  onSelectAno,
  estados,
  selectedEstado,
  onSelectEstado,
  municipios,
  selectedMunicipio,
  onSelectMunicipio,
  zonas,
  selectedZona,
  onSelectZona,
  locais,
  selectedLocal,
  onSelectLocal,
  secoes,
  selectedSecao,
  onSelectSecao,
  loading = false,
}) => {
  const [buscaMuni, setBuscaMuni] = React.useState('');

  const municipiosFiltrados = React.useMemo(() => {
    if (!buscaMuni.trim()) return municipios;
    const termo = buscaMuni.toLowerCase().trim();
    return municipios.filter((m) => m.nome.toLowerCase().includes(termo));
  }, [municipios, buscaMuni]);

  const currentAnoObj = anos.find((a) => a.ano === selectedAno);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-emerald-900/10 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-100/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse"></div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
            Estrutura Oficial de Votação (TSE)
          </h2>
        </div>
        
        {currentAnoObj && (
          <div className="inline-flex items-center gap-2 text-xs bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300 font-medium">
            <span>📅 Datas Oficiais:</span>
            <span><strong>1º Turno:</strong> {currentAnoObj.dataPrimeiroTurno}</span>
            <span>•</span>
            <span><strong>2º Turno:</strong> {currentAnoObj.dataSegundoTurno}</span>
          </div>
        )}

        {loading && <span className="text-xs text-emerald-700 font-medium ml-auto">Consultando dados...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 1. Ano da Eleição */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5 flex items-center justify-between">
            <span>1. Ano da Eleição</span>
            <span className="text-[10px] text-amber-600 font-semibold">{currentAnoObj?.tipo || ''}</span>
          </label>
          <select
            value={selectedAno}
            onChange={(e) => onSelectAno(Number(e.target.value))}
            className="w-full bg-emerald-50/50 border border-emerald-200 text-emerald-950 text-sm font-semibold rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 transition"
          >
            {anos.map((a) => (
              <option key={a.ano} value={a.ano}>
                {a.ano} - {a.tipo}
              </option>
            ))}
          </select>
        </div>

        {/* 2. TRE / Estado */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            2. Estado (TRE)
          </label>
          <select
            value={selectedEstado}
            onChange={(e) => onSelectEstado(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 transition"
          >
            <option value="">Selecione o Estado</option>
            {estados.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.sigla} - {uf.nome}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Município */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              3. Município {municipios.length > 0 && `(${municipios.length})`}
            </label>
          </div>
          {municipios.length > 10 && (
            <input
              type="text"
              placeholder="🔍 Filtrar cidade..."
              value={buscaMuni}
              onChange={(e) => setBuscaMuni(e.target.value)}
              className="w-full mb-1.5 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 text-slate-700"
            />
          )}
          <select
            disabled={!selectedEstado}
            value={selectedMunicipio}
            onChange={(e) => onSelectMunicipio(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 transition disabled:opacity-50 disabled:bg-slate-100"
          >
            <option value="">Selecione o Município</option>
            {municipiosFiltrados.map((m) => (
              <option key={m.codigoTse} value={m.codigoTse}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Zona Eleitoral */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            4. Zona Eleitoral
          </label>
          <select
            disabled={!selectedMunicipio}
            value={selectedZona}
            onChange={(e) => onSelectZona(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 transition disabled:opacity-50 disabled:bg-slate-100"
          >
            <option value="">Selecione a Zona</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.numero}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Local de Votação (Colégio) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            5. Local de Votação
          </label>
          <select
            disabled={!selectedZona}
            value={selectedLocal}
            onChange={(e) => onSelectLocal(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 transition disabled:opacity-50 disabled:bg-slate-100"
          >
            <option value="">Selecione o Local</option>
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Seção Eleitoral (Urna) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            6. Seção (Urna)
          </label>
          <select
            disabled={!selectedLocal}
            value={selectedSecao}
            onChange={(e) => onSelectSecao(e.target.value)}
            className="w-full bg-emerald-50/70 border border-emerald-300 text-emerald-950 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 transition disabled:opacity-50 disabled:bg-slate-100 font-semibold"
          >
            <option value="">Selecione a Seção</option>
            {secoes.map((s) => (
              <option key={s.id} value={s.id}>
                Seção {s.numero}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

