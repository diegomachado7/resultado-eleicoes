import { SecaoData, Municipio } from '../types/election';
import { ELEICAO_DATA, ESTADOS_BRASIL } from '../data/mockElections';

export class ElectionService {
  /**
   * Retorna lista de Estados disponíveis
   */
  static async getEstados(): Promise<{ sigla: string; nome: string }[]> {
    return ESTADOS_BRASIL;
  }

  /**
   * Retorna os municípios daquele Estado
   */
  static async getMunicipios(siglaUf: string): Promise<Municipio[]> {
    const estado = ELEICAO_DATA[siglaUf.toUpperCase()];
    if (estado) {
      return estado.municipios;
    }
    // Fallback gerador padrão caso o usuário selecione outros estados
    return [
      {
        codigoTse: '00001',
        nome: `Capital / Principal de ${siglaUf.toUpperCase()}`,
        zonas: [
          {
            id: '0001',
            numero: `001ª Zona Eleitoral (${siglaUf})`,
            locais: [
              {
                id: '1001',
                numero: '1001',
                nome: `Escola Estadual Central de ${siglaUf}`,
                endereco: 'Av. Brasil, 1000',
                bairro: 'Centro',
                secoes: [
                  {
                    id: '0001',
                    numero: '0001',
                    urnaEletronica: 'UE2020 - Mod. Oficial',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 400,
                      totalVotosApurados: 345,
                      votosValidos: 335,
                      votosBrancos: 5,
                      votosNulos: 5,
                      abstencoes: 55,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 170, percentual: 50.75 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 145, percentual: 43.28 },
                        { numero: '15', nome: 'Candidato 15', partido: 'MDB', siglaPartido: 'MDB', votos: 12, percentual: 3.58 },
                        { numero: '12', nome: 'Candidato 12', partido: 'PDT', siglaPartido: 'PDT', votos: 8, percentual: 2.39 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 400,
                      totalVotosApurados: 350,
                      votosValidos: 342,
                      votosBrancos: 4,
                      votosNulos: 4,
                      abstencoes: 50,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 180, percentual: 52.63 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 162, percentual: 47.37 },
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Retorna os detalhes de uma seção eleitoral
   */
  static async getSecaoDetails(
    uf: string,
    codigoMunicipio: string,
    zonaId: string,
    localId: string,
    secaoId: string
  ): Promise<SecaoData | null> {
    const estado = ELEICAO_DATA[uf.toUpperCase()];
    if (estado) {
      const muni = estado.municipios.find(m => m.codigoTse === codigoMunicipio);
      const zona = muni?.zonas.find(z => z.id === zonaId);
      const local = zona?.locais.find(l => l.id === localId);
      const secao = local?.secoes.find(s => s.id === secaoId);
      if (secao) return secao;
    }

    const fallbacks = await this.getMunicipios(uf);
    const m = fallbacks.find(x => x.codigoTse === codigoMunicipio) || fallbacks[0];
    const z = m?.zonas.find(x => x.id === zonaId) || m?.zonas[0];
    const l = z?.locais.find(x => x.id === localId) || z?.locais[0];
    const s = l?.secoes.find(x => x.id === secaoId) || l?.secoes[0];

    return s || null;
  }
}
