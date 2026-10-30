import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import { TurnoResult, CandidateVote } from '../types/election';

interface ComparativoAnalyticsProps {
  turnoA: TurnoResult;
  turnoB: TurnoResult;
  nomeA: string;
  nomeB: string;
  candidatosComparados: {
    candidato: CandidateVote;
    votosA: number;
    pctA: number;
    votosB: number;
    pctB: number;
  }[];
}

export const ComparativoAnalytics: React.FC<ComparativoAnalyticsProps> = ({
  turnoA,
  turnoB,
  nomeA,
  nomeB,
  candidatosComparados
}) => {
  const [metricMode, setMetricMode] = useState<'votos' | 'percentual'>('percentual');

  // Preparar dados para o gráfico comparativo de candidatos
  const chartDataCandidatos = candidatosComparados.map((item) => ({
    name: item.candidato.nome.length > 14 ? item.candidato.nome.substring(0, 13) + '…' : item.candidato.nome,
    nomeCompleto: item.candidato.nome,
    partido: item.candidato.siglaPartido,
    numero: item.candidato.numero,
    urnaA: metricMode === 'percentual' ? Number(item.pctA.toFixed(2)) : item.votosA,
    urnaB: metricMode === 'percentual' ? Number(item.pctB.toFixed(2)) : item.votosB,
    votosReaisA: item.votosA,
    votosReaisB: item.votosB,
    pctA: item.pctA,
    pctB: item.pctB
  }));

  // Preparar dados para métricas de participação eleitoral (Comparecimento e Abstenção)
  const pctComparecimentoA = Number(((turnoA.totalVotosApurados / (turnoA.eleitoresAptos || 1)) * 100).toFixed(1));
  const pctComparecimentoB = Number(((turnoB.totalVotosApurados / (turnoB.eleitoresAptos || 1)) * 100).toFixed(1));
  const pctAbstencaoA = Number(((turnoA.abstencoes / (turnoA.eleitoresAptos || 1)) * 100).toFixed(1));
  const pctAbstencaoB = Number(((turnoB.abstencoes / (turnoB.eleitoresAptos || 1)) * 100).toFixed(1));

  const participacaoData = [
    {
      categoria: 'Comparecimento',
      urnaA: pctComparecimentoA,
      urnaB: pctComparecimentoB,
      totalA: turnoA.totalVotosApurados,
      totalB: turnoB.totalVotosApurados
    },
    {
      categoria: 'Abstenções',
      urnaA: pctAbstencaoA,
      urnaB: pctAbstencaoB,
      totalA: turnoA.abstencoes,
      totalB: turnoB.abstencoes
    },
    {
      categoria: 'Votos Brancos',
      urnaA: Number(((turnoA.votosBrancos / (turnoA.totalVotosApurados || 1)) * 100).toFixed(1)),
      urnaB: Number(((turnoB.votosBrancos / (turnoB.totalVotosApurados || 1)) * 100).toFixed(1)),
      totalA: turnoA.votosBrancos,
      totalB: turnoB.votosBrancos
    },
    {
      categoria: 'Votos Nulos',
      urnaA: Number(((turnoA.votosNulos / (turnoA.totalVotosApurados || 1)) * 100).toFixed(1)),
      urnaB: Number(((turnoB.votosNulos / (turnoB.totalVotosApurados || 1)) * 100).toFixed(1)),
      totalA: turnoA.votosNulos,
      totalB: turnoB.votosNulos
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
      {/* Cabeçalho do Analytics Comparativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg text-sm">📈</span>
            <h3 className="text-base font-bold text-slate-900">
              Analytics Visual Comparativo
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Confronto direto de desempenho eleitoral e perfil de participação das duas seções
          </p>
        </div>

        {/* Toggle para Votos Absolutos vs Percentual */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('percentual')}
            className={`px-3 py-1.5 rounded-md transition ${
              metricMode === 'percentual'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            % Percentual
          </button>
          <button
            onClick={() => setMetricMode('votos')}
            className={`px-3 py-1.5 rounded-md transition ${
              metricMode === 'votos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Votos Nominais
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Votação dos Candidatos Lado a Lado (Urna A x Urna B) */}
        <div className="lg:col-span-8 bg-slate-50/60 rounded-xl p-4 border border-slate-200/70">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
              {nomeA}
              <span className="text-slate-400 font-normal">vs</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
              {nomeB}
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Métrica: {metricMode === 'percentual' ? '% dos votos válidos' : 'Total de votos'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataCandidatos}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  unit={metricMode === 'percentual' ? '%' : ''}
                />
                <Tooltip
                  formatter={(_val: any, name: any, item: any) => {
                    const isUrnaA = name === 'Urna A';
                    const rotulo = isUrnaA ? nomeA : nomeB;
                    const votos = isUrnaA ? item.payload.votosReaisA : item.payload.votosReaisB;
                    const pct = isUrnaA ? item.payload.pctA : item.payload.pctB;
                    return [
                      `${Number(votos).toLocaleString('pt-BR')} votos (${pct.toFixed(2)}%)`,
                      rotulo
                    ];
                  }}
                  labelFormatter={(_label, payload) => {
                    if (payload && payload[0]) {
                      const p = payload[0].payload;
                      return `${p.nomeCompleto} (${p.numero} - ${p.partido})`;
                    }
                    return '';
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px' }}
                  formatter={(value: string) => {
                    return (
                      <span className="text-xs font-semibold text-slate-700">
                        {value === 'urnaA' ? nomeA : nomeB}
                      </span>
                    );
                  }}
                />
                <Bar
                  name="urnaA"
                  dataKey="urnaA"
                  fill="#059669" // Verde TSE
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  name="urnaB"
                  dataKey="urnaB"
                  fill="#f59e0b" // Amarelo/Âmbar TSE
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Comparativo de Perfil de Participação */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Perfil de Participação (%)
              </h4>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={participacaoData}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    width={95}
                  />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => {
                      const isUrnaA = name === 'urnaA';
                      const rotulo = isUrnaA ? nomeA : nomeB;
                      const qtd = isUrnaA ? item.payload.totalA : item.payload.totalB;
                      return [`${val}% (${Number(qtd).toLocaleString('pt-BR')} eleitores)`, rotulo];
                    }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="urnaA" name="urnaA" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  <Bar dataKey="urnaB" name="urnaB" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 mt-2 flex justify-between">
            <span className="text-emerald-800 font-semibold">● {nomeA}</span>
            <span className="text-amber-700 font-semibold">● {nomeB}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
