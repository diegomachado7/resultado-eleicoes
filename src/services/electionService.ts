import { SecaoData, Municipio, AnoEleicao } from '../types/election';
import { ELEICAO_DATA, ESTADOS_BRASIL } from '../data/mockElections';

export const ANOS_ELEICAO: AnoEleicao[] = [
  {
    ano: 2024,
    label: '2024 - Eleições Municipais (Prefeito e Vereador)',
    tipo: 'Municipal',
    dataPrimeiroTurno: '06/10/2024',
    dataSegundoTurno: '27/10/2024'
  },
  {
    ano: 2022,
    label: '2022 - Eleições Gerais (Presidente e Governador)',
    tipo: 'Geral',
    dataPrimeiroTurno: '02/10/2022',
    dataSegundoTurno: '30/10/2022'
  },
  {
    ano: 2020,
    label: '2020 - Eleições Municipais (Prefeito e Vereador)',
    tipo: 'Municipal',
    dataPrimeiroTurno: '15/11/2020',
    dataSegundoTurno: '29/11/2020'
  }
];

export interface SqliteStats {
  database: string;
  estados: number;
  municipios: number;
  zonas: number;
  secoes: number;
  resultados_salvos: number;
}

export class ElectionService {
  /**
   * Retorna lista de Estados disponíveis (SQLite / TSE ou fallback)
   */
  static async getEstados(): Promise<{ sigla: string; nome: string }[]> {
    try {
      const res = await fetch('/api/estados');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend offline, usa mock
    }
    return ESTADOS_BRASIL;
  }

  /**
   * Retorna os municípios daquele Estado via SQLite
   */
  static async getMunicipios(siglaUf: string): Promise<Municipio[]> {
    try {
      const res = await fetch(`/api/municipios?uf=${encodeURIComponent(siglaUf)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Falha ao obter municípios via SQLite API, utilizando fallback local:', err);
    }

    const estado = ELEICAO_DATA[siglaUf.toUpperCase()];
    if (estado) {
      return estado.municipios;
    }

    return [];
  }

  /**
   * Retorna os detalhes de um município com Zonas e Locais via SQLite
   */
  static async getMunicipioDetails(siglaUf: string, codigoTse: string): Promise<Municipio | null> {
    try {
      const res = await fetch(`/api/municipios/${codigoTse}?uf=${encodeURIComponent(siglaUf)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const estado = ELEICAO_DATA[siglaUf.toUpperCase()];
    if (estado) {
      const found = estado.municipios.find((m) => m.codigoTse === codigoTse);
      if (found) return found;
    }

    return null;
  }

  /**
   * Retorna os detalhes e votos de uma seção eleitoral
   */
  static async getSecaoDetails(
    uf: string,
    codigoMunicipio: string,
    zonaId: string,
    localId: string,
    secaoId: string,
    ano: number = 2024
  ): Promise<SecaoData | null> {
    try {
      const query = new URLSearchParams({
        uf,
        codigoMunicipio,
        zonaId,
        localId,
        secaoId,
        ano: String(ano)
      });
      const res = await fetch(`/api/resultado-secao?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.primeiroTurno) {
          return data;
        }
      }
    } catch {
      // Fallback
    }

    const estado = ELEICAO_DATA[uf.toUpperCase()];
    if (estado) {
      const muni = estado.municipios.find((m) => m.codigoTse === codigoMunicipio);
      const zona = muni?.zonas.find((z) => z.id === zonaId);
      const local = zona?.locais.find((l) => l.id === localId);
      const secao = local?.secoes.find((s) => s.id === secaoId);
      if (secao) return secao;
    }

    return null;
  }

  /**
   * Retorna estatísticas da base local SQLite
   */
  static async getStats(): Promise<SqliteStats | null> {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend offline
    }
    return null;
  }
}
