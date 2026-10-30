import React, { useState, useEffect } from 'react';
import { Municipio, ZonaEleitoral, LocalVotacao, SecaoData } from '../types/election';
import { ElectionService } from '../services/electionService';

export interface SecaoSelectorValue {
  uf: string;
  municipio: string;
  zona: string;
  local: string;
  secao: string;
}

interface SecaoSelectorProps {
  label: string;
  badge: string;
  badgeColorClass: string;
  borderColorClass: string;
  ringFocusClass: string;
  estados: { sigla: string; nome: string }[];
  value: SecaoSelectorValue;
  onChange: (value: SecaoSelectorValue) => void;
  fonteInfo?: string;
  onCopyFromOther?: () => void;
  copyButtonLabel?: string;
}

export const SecaoSelector: React.FC<SecaoSelectorProps> = ({
  label,
  badge,
  badgeColorClass,
  borderColorClass,
  ringFocusClass,
  estados,
  value,
  onChange,
  fonteInfo,
  onCopyFromOther,
  copyButtonLabel
}) => {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [zonas, setZonas] = useState<ZonaEleitoral[]>([]);
  const [locais, setLocais] = useState<LocalVotacao[]>([]);
  const [secoes, setSecoes] = useState<SecaoData[]>([]);
  const [loadingMunis, setLoadingMunis] = useState<boolean>(false);
  const [loadingHierarchy, setLoadingHierarchy] = useState<boolean>(false);

  // 1. Quando o estado da urna muda, carrega municípios da UF
  useEffect(() => {
    if (!value.uf) {
      setMunicipios([]);
      return;
    }

    let isMounted = true;
    async function fetchMunicipios() {
      setLoadingMunis(true);
      try {
        const data = await ElectionService.getMunicipios(value.uf);
        if (isMounted) {
          setMunicipios(data);
          // Se o município atual não existe na nova UF, seleciona o primeiro
          if (data.length > 0 && !data.some((m) => m.codigoTse === value.municipio)) {
            onChange({
              ...value,
              municipio: data[0].codigoTse,
              zona: '',
              local: '',
              secao: ''
            });
          }
        }
      } finally {
        if (isMounted) setLoadingMunis(false);
      }
    }

    fetchMunicipios();
    return () => {
      isMounted = false;
    };
  }, [value.uf]);

  // 2. Quando o município muda, carrega Zonas, Locais e Seções
  useEffect(() => {
    if (!value.uf || !value.municipio) {
      setZonas([]);
      setLocais([]);
      setSecoes([]);
      return;
    }

    let isMounted = true;
    async function fetchHierarchy() {
      setLoadingHierarchy(true);
      try {
        const details = await ElectionService.getMunicipioDetails(value.uf, value.municipio);
        if (!isMounted || !details || !Array.isArray(details.zonas) || details.zonas.length === 0) {
          if (isMounted) {
            setZonas([]);
            setLocais([]);
            setSecoes([]);
          }
          return;
        }

        const zonList = details.zonas;
        setZonas(zonList);

        const currentZona = zonList.find((z) => z.id === value.zona) || zonList[0];
        const nextZonaId = currentZona.id;

        const locList = currentZona.locais || [];
        setLocais(locList);

        const currentLocal = locList.find((l) => l.id === value.local) || locList[0];
        const nextLocalId = currentLocal ? currentLocal.id : '';

        const secList = currentLocal ? currentLocal.secoes || [] : [];
        setSecoes(secList);

        const currentSecao = secList.find((s) => s.id === value.secao) || secList[0];
        const nextSecaoId = currentSecao ? currentSecao.id : '';

        if (
          value.zona !== nextZonaId ||
          value.local !== nextLocalId ||
          value.secao !== nextSecaoId
        ) {
          onChange({
            ...value,
            zona: nextZonaId,
            local: nextLocalId,
            secao: nextSecaoId
          });
        }
      } finally {
        if (isMounted) setLoadingHierarchy(false);
      }
    }

    fetchHierarchy();
    return () => {
      isMounted = false;
    };
  }, [value.uf, value.municipio]);

  // 3. Quando o usuário altera a Zona manualmente
  const handleZonaChange = (newZonaId: string) => {
    const currentZona = zonas.find((z) => z.id === newZonaId);
    const locList = currentZona?.locais || [];
    setLocais(locList);

    const firstLocal = locList[0];
    const secList = firstLocal?.secoes || [];
    setSecoes(secList);

    onChange({
      ...value,
      zona: newZonaId,
      local: firstLocal ? firstLocal.id : '',
      secao: secList[0] ? secList[0].id : ''
    });
  };

  // 4. Quando o usuário altera o Local de votação
  const handleLocalChange = (newLocalId: string) => {
    const currentLocal = locais.find((l) => l.id === newLocalId);
    const secList = currentLocal?.secoes || [];
    setSecoes(secList);

    onChange({
      ...value,
      local: newLocalId,
      secao: secList[0] ? secList[0].id : ''
    });
  };

  const currentMuniObj = municipios.find((m) => m.codigoTse === value.municipio);

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColorClass} shadow-xs p-4 flex flex-col justify-between space-y-3`}>
      {/* Header do Seletor */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColorClass}`}>
            {badge}
          </span>
          <span className="text-xs font-bold text-slate-800">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {fonteInfo && (
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              {fonteInfo}
            </span>
          )}
          {onCopyFromOther && (
            <button
              type="button"
              onClick={onCopyFromOther}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
              title="Copiar configurações de localização da outra urna"
            >
              {copyButtonLabel || 'Copiar da outra'}
            </button>
          )}
        </div>
      </div>

      {/* Grid de Seletores da Urna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Estado (UF) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Estado (TRE)
          </label>
          <select
            value={value.uf}
            onChange={(e) =>
              onChange({
                ...value,
                uf: e.target.value
              })
            }
            className={`w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 ${ringFocusClass}`}
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
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Município {loadingMunis && '⏳'}
          </label>
          <select
            value={value.municipio}
            onChange={(e) =>
              onChange({
                ...value,
                municipio: e.target.value
              })
            }
            disabled={loadingMunis || municipios.length === 0}
            className={`w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 ${ringFocusClass} disabled:opacity-50`}
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
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Zona Eleitoral {loadingHierarchy && '⏳'}
          </label>
          <select
            value={value.zona}
            onChange={(e) => handleZonaChange(e.target.value)}
            disabled={loadingHierarchy || zonas.length === 0}
            className={`w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 ${ringFocusClass} disabled:opacity-50`}
          >
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.numero}
              </option>
            ))}
          </select>
        </div>

        {/* Local de Votação (Colégio) */}
        {locais.length > 1 && (
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Local de Votação (Colégio)
            </label>
            <select
              value={value.local}
              onChange={(e) => handleLocalChange(e.target.value)}
              disabled={loadingHierarchy || locais.length === 0}
              className={`w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 ${ringFocusClass} disabled:opacity-50`}
            >
              {locais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome} ({l.bairro || 'Zona'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Seção Eleitoral / Urna */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Seção / Urna
          </label>
          <select
            value={value.secao}
            onChange={(e) =>
              onChange({
                ...value,
                secao: e.target.value
              })
            }
            disabled={loadingHierarchy || secoes.length === 0}
            className={`w-full text-xs font-black bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 ${ringFocusClass} disabled:opacity-50`}
          >
            {secoes.map((s) => (
              <option key={s.id} value={s.id}>
                Seção {s.numero} {s.urnaEletronica ? `(${s.urnaEletronica})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detalhe da Localização Selecionada */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div>
          <span className="font-bold text-slate-700">
            {currentMuniObj?.nome || 'Município'} / {value.uf}
          </span>
          {locais.length > 0 && value.local && (
            <span className="ml-1 text-slate-400 truncate max-w-[200px] inline-block align-bottom">
              • {locais.find((l) => l.id === value.local)?.nome || 'Polo de Votação'}
            </span>
          )}
        </div>
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
          Seção {value.secao || '—'}
        </span>
      </div>
    </div>
  );
};
