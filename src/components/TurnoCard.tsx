import React from 'react';
import { TurnoResult } from '../types/election';

interface TurnoCardProps {
  titulo: string;
  subtitulo: string;
  data?: TurnoResult;
  dataEleicao?: string;
  corDestaque?: 'emerald' | 'amber' | 'blue';
}

export const TurnoCard: React.FC<TurnoCardProps> = ({
  titulo,
  subtitulo,
  data,
  dataEleicao,
  corDestaque = 'emerald',
}) => {
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <p className="text-base font-medium">Sem dados para este turno</p>
      </div>
    );
  }

  const badgeColor = corDestaque === 'amber'
    ? 'bg-amber-100 text-amber-900 border-amber-300'
    : 'bg-emerald-100 text-emerald-900 border-emerald-300';

  const progressBg = corDestaque === 'amber' ? 'bg-amber-500' : 'bg-emerald-600';
  const textPercentColor = corDestaque === 'amber' ? 'text-amber-700' : 'text-emerald-700';

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border ${badgeColor}`}>
                {titulo}
              </span>
              {(dataEleicao || data.dataEleicao) && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                  📅 {dataEleicao || data.dataEleicao}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Apurado</span>
            <span className="text-lg font-bold text-slate-900">
              {data.totalVotosApurados.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Lista de Candidatos */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Votação por Candidato
          </h4>
          {data.candidatos.map((cand) => (
            <div
              key={cand.numero}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition"
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white font-mono font-bold text-emerald-950 text-xs border border-emerald-200 shadow-xs">
                    {cand.numero}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block leading-tight">
                      {cand.nome}
                    </span>
                    <span className="text-xs text-slate-500">
                      {cand.siglaPartido}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {cand.votos.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500">votos</span>
                  </div>
                  <div className={`text-xs font-bold ${textPercentColor}`}>
                    {cand.percentual.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Barra de Progresso com verde/amarelo */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`${progressBg} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(cand.percentual, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas Gerais da Seção */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100">
          <span className="text-emerald-800 block text-[11px] font-medium">Válidos</span>
          <span className="font-bold text-emerald-950">{data.votosValidos.toLocaleString('pt-BR')}</span>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-100">
          <span className="text-slate-500 block text-[11px] font-medium">Brancos</span>
          <span className="font-semibold text-slate-800">{data.votosBrancos.toLocaleString('pt-BR')}</span>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-100">
          <span className="text-slate-500 block text-[11px] font-medium">Nulos</span>
          <span className="font-semibold text-slate-800">{data.votosNulos.toLocaleString('pt-BR')}</span>
        </div>
        <div className="p-2 bg-amber-50/60 rounded border border-amber-100">
          <span className="text-amber-800 block text-[11px] font-medium">Abstenções</span>
          <span className="font-bold text-amber-950">{data.abstencoes.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
};
