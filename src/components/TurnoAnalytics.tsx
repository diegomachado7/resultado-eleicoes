import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { TurnoResult } from '../types/election';

interface TurnoAnalyticsProps {
  turno1?: TurnoResult;
  turno2?: TurnoResult;
  secaoNumero?: string;
  municipioNome?: string;
}

export const TurnoAnalytics: React.FC<TurnoAnalyticsProps> = ({
  turno1,
  turno2,
  secaoNumero,
  municipioNome
}) => {
  const [activeTurnoTab, setActiveTurnoTab] = useState<1 | 2>(turno1 ? 1 : 2);

  const activeTurno = activeTurnoTab === 1 ? turno1 : turno2;

  if (!activeTurno) return null;

  // 1. Dados para o gráfico de barras de candidatos (top candidatos)
  const candidatosData = (activeTurno.candidatos || []).map((c) => ({
    name: c.nome.length > 16 ? c.nome.substring(0, 15) + '…' : c.nome,
    nomeCompleto: c.nome,
    numero: c.numero,
    partido: c.siglaPartido,
    votos: c.votos,
    percentual: c.percentual
  }));

  // 2. Dados para a composição dos votos (Donut Chart)
  const totalComparecimento = activeTurno.totalVotosApurados;
  const composicaoVotos = [
    { name: 'Votos Válidos', value: activeTurno.votosValidos, color: '#059669' }, // emerald-600
    { name: 'Votos Nulos', value: activeTurno.votosNulos, color: '#94a3b8' },    // slate-400
    { name: 'Votos Brancos', value: activeTurno.votosBrancos, color: '#cbd5e1' }, // slate-300
    { name: 'Abstenções', value: activeTurno.abstencoes, color: '#f59e0b' }      // amber-500
  ].filter((item) => item.value > 0);

  // Paleta verde e amarela para candidatos
  const CANDIDATE_COLORS = ['#047857', '#059669', '#10b981', '#34d399', '#f59e0b', '#d97706', '#b45309', '#64748b'];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 mt-6">
      {/* Cabeçalho do Analytics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-sm">📊</span>
            <h3 className="text-base font-bold text-slate-900">
              Analytics Visual da Seção {secaoNumero ? `nº ${secaoNumero}` : ''}
            </h3>
            {municipioNome && (
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {municipioNome}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Distribuição gráfica detalhada de votos válidos e participação do eleitorado
          </p>
        </div>

        {/* Alternador de Turno se houver 2º Turno */}
        {turno1 && turno2 && (
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTurnoTab(1)}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTurnoTab === 1
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1º Turno
            </button>
            <button
              onClick={() => setActiveTurnoTab(2)}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTurnoTab === 2
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2º Turno
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Votação por Candidato (Barras Horizontais) */}
        <div className="lg:col-span-7 bg-slate-50/60 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Votação por Candidato ({activeTurno.cargo || 'Cargo'})
              </h4>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {activeTurno.votosValidos.toLocaleString('pt-BR')} válidos
              </span>
            </div>

            <div className="h-64 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={candidatosData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: any, _name: any, item: any) => [
                      `${Number(value).toLocaleString('pt-BR')} votos (${item.payload.percentual.toFixed(2)}%)`,
                      `${item.payload.nomeCompleto} (${item.payload.partido || ''})`
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                    {candidatosData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
            <span>Ordem decrescente de votos apurados</span>
            <span className="font-medium text-slate-700">Total apurado: {totalComparecimento.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Gráfico 2: Composição do Eleitorado (Donut Chart) */}
        <div className="lg:col-span-5 bg-slate-50/60 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Participação & Composição
              </h4>
              <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeTurno.eleitoresAptos.toLocaleString('pt-BR')} aptos
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={composicaoVotos}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {composicaoVotos.map((entry, index) => (
                      <Cell key={`donut-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString('pt-BR')} eleitores (${((Number(val) / (activeTurno.eleitoresAptos || 1)) * 100).toFixed(1)}%)`,
                      ''
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={10}
                    iconType="circle"
                    formatter={(val: string) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 mt-2 text-center text-xs">
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Comparecimento</span>
              <span className="font-bold text-emerald-800">
                {(((totalComparecimento) / (activeTurno.eleitoresAptos || 1)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Abstenção</span>
              <span className="font-bold text-amber-700">
                {(((activeTurno.abstencoes) / (activeTurno.eleitoresAptos || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
