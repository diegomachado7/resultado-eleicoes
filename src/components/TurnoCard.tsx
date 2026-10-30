import React from 'react';
import { TurnoResult } from '../types/election';

interface TurnoCardProps {
  titulo: string;
  subtitulo: string;
  data?: TurnoResult;
  corDestaque?: 'blue' | 'indigo';
}

export const TurnoCard: React.FC<TurnoCardProps> = ({
  titulo,
  subtitulo,
  data,
  corDestaque = 'blue',
}) => {
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <p className="text-base font-medium">Sem dados para este turno</p>
      </div>
    );
  }

  const badgeColor = corDestaque === 'blue' 
    ? 'bg-blue-50 text-blue-700 border-blue-200' 
    : 'bg-indigo-50 text-indigo-700 border-indigo-200';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
          <div>
            <span className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
              {titulo}
            </span>
            <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Apurado</span>
            <span className="text-lg font-bold text-slate-800">{data.totalVotosApurados}</span>
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
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition"
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white font-mono font-bold text-slate-700 text-xs border border-slate-200 shadow-xs">
                    {cand.numero}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block leading-tight">
                      {cand.nome}
                    </span>
                    <span className="text-xs text-slate-500">
                      {cand.siglaPartido}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800">
                    {cand.votos} <span className="text-xs font-normal text-slate-500">votos</span>
                  </div>
                  <div className="text-xs font-semibold text-blue-600">
                    {cand.percentual.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${cand.percentual}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas Gerais da Seção */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 bg-slate-50 rounded">
          <span className="text-slate-400 block">Válidos</span>
          <span className="font-semibold text-slate-700">{data.votosValidos}</span>
        </div>
        <div className="p-2 bg-slate-50 rounded">
          <span className="text-slate-400 block">Brancos</span>
          <span className="font-semibold text-slate-700">{data.votosBrancos}</span>
        </div>
        <div className="p-2 bg-slate-50 rounded">
          <span className="text-slate-400 block">Nulos</span>
          <span className="font-semibold text-slate-700">{data.votosNulos}</span>
        </div>
        <div className="p-2 bg-slate-50 rounded">
          <span className="text-slate-400 block">Abstenções</span>
          <span className="font-semibold text-slate-700">{data.abstencoes}</span>
        </div>
      </div>
    </div>
  );
};
