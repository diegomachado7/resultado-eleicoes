import { Estado } from '../types/election';

export const ESTADOS_BRASIL: { sigla: string; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
  { sigla: 'ZZ', nome: 'Exterior' }
];

export const ELEICAO_DATA: Record<string, Estado> = {
  SP: {
    sigla: 'SP',
    nome: 'São Paulo',
    municipios: [
      {
        codigoTse: '71072',
        nome: 'São Paulo',
        zonas: [
          {
            id: '0001',
            numero: '001ª Bela Vista',
            locais: [
              {
                id: '1015',
                numero: '1015',
                nome: 'Colégio Sion - Higienópolis',
                endereco: 'Av. Higienópolis, 983',
                bairro: 'Higienópolis',
                secoes: [
                  {
                    id: '0001',
                    numero: '0001',
                    urnaEletronica: 'UE2020 - Mod. 19.823.111',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 410,
                      totalVotosApurados: 350,
                      votosValidos: 338,
                      votosBrancos: 6,
                      votosNulos: 6,
                      abstencoes: 60,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 172, percentual: 50.89 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 135, percentual: 39.94 },
                        { numero: '15', nome: 'Candidato 15', partido: 'Movimento Democrático Brasileiro', siglaPartido: 'MDB', votos: 18, percentual: 5.33 },
                        { numero: '12', nome: 'Candidato 12', partido: 'Partido Democrático Trabalhista', siglaPartido: 'PDT', votos: 13, percentual: 3.84 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 410,
                      totalVotosApurados: 355,
                      votosValidos: 345,
                      votosBrancos: 4,
                      votosNulos: 6,
                      abstencoes: 55,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 195, percentual: 56.52 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 150, percentual: 43.48 },
                      ]
                    }
                  },
                  {
                    id: '0002',
                    numero: '0002',
                    urnaEletronica: 'UE2020 - Mod. 19.823.112',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 395,
                      totalVotosApurados: 330,
                      votosValidos: 318,
                      votosBrancos: 7,
                      votosNulos: 5,
                      abstencoes: 65,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 155, percentual: 48.74 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 138, percentual: 43.40 },
                        { numero: '15', nome: 'Candidato 15', partido: 'Movimento Democrático Brasileiro', siglaPartido: 'MDB', votos: 15, percentual: 4.72 },
                        { numero: '12', nome: 'Candidato 12', partido: 'Partido Democrático Trabalhista', siglaPartido: 'PDT', votos: 10, percentual: 3.14 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 395,
                      totalVotosApurados: 340,
                      votosValidos: 332,
                      votosBrancos: 3,
                      votosNulos: 5,
                      abstencoes: 55,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 178, percentual: 53.61 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 154, percentual: 46.39 },
                      ]
                    }
                  }
                ]
              },
              {
                id: '1023',
                numero: '1023',
                nome: 'Universidade Presbiteriana Mackenzie',
                endereco: 'Rua da Consolação, 930',
                bairro: 'Consolação',
                secoes: [
                  {
                    id: '0015',
                    numero: '0015',
                    urnaEletronica: 'UE2020 - Mod. 19.824.001',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 430,
                      totalVotosApurados: 375,
                      votosValidos: 362,
                      votosBrancos: 8,
                      votosNulos: 5,
                      abstencoes: 55,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 180, percentual: 49.72 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 152, percentual: 41.99 },
                        { numero: '15', nome: 'Candidato 15', partido: 'Movimento Democrático Brasileiro', siglaPartido: 'MDB', votos: 20, percentual: 5.52 },
                        { numero: '12', nome: 'Candidato 12', partido: 'Partido Democrático Trabalhista', siglaPartido: 'PDT', votos: 10, percentual: 2.76 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 430,
                      totalVotosApurados: 382,
                      votosValidos: 373,
                      votosBrancos: 4,
                      votosNulos: 5,
                      abstencoes: 48,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 201, percentual: 53.89 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 172, percentual: 46.11 },
                      ]
                    }
                  }
                ]
              }
            ]
          },
          {
            id: '0258',
            numero: '258ª Indianópolis',
            locais: [
              {
                id: '1104',
                numero: '1104',
                nome: 'E.E. Maria Montessori',
                endereco: 'Av. Ibirapuera, 1200',
                bairro: 'Moema',
                secoes: [
                  {
                    id: '0101',
                    numero: '0101',
                    urnaEletronica: 'UE2020 - Mod. 19.825.405',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 380,
                      totalVotosApurados: 335,
                      votosValidos: 325,
                      votosBrancos: 6,
                      votosNulos: 4,
                      abstencoes: 45,
                      candidatos: [
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 198, percentual: 60.92 },
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 102, percentual: 31.38 },
                        { numero: '15', nome: 'Candidato 15', partido: 'Movimento Democrático Brasileiro', siglaPartido: 'MDB', votos: 18, percentual: 5.54 },
                        { numero: '12', nome: 'Candidato 12', partido: 'Partido Democrático Trabalhista', siglaPartido: 'PDT', votos: 7, percentual: 2.15 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 380,
                      totalVotosApurados: 342,
                      votosValidos: 335,
                      votosBrancos: 3,
                      votosNulos: 4,
                      abstencoes: 38,
                      candidatos: [
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 215, percentual: 64.18 },
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 120, percentual: 35.82 },
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        codigoTse: '62910',
        nome: 'Campinas',
        zonas: [
          {
            id: '0033',
            numero: '033ª Campinas',
            locais: [
              {
                id: '1001',
                numero: '1001',
                nome: 'Colégio Culto à Ciência',
                endereco: 'Rua Culto à Ciência, 422',
                bairro: 'Botafogo',
                secoes: [
                  {
                    id: '0020',
                    numero: '0020',
                    urnaEletronica: 'UE2020 - Mod. 19.827.881',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 400,
                      totalVotosApurados: 340,
                      votosValidos: 328,
                      votosBrancos: 7,
                      votosNulos: 5,
                      abstencoes: 60,
                      candidatos: [
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 175, percentual: 53.35 },
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 130, percentual: 39.63 },
                        { numero: '15', nome: 'Candidato 15', partido: 'Movimento Democrático Brasileiro', siglaPartido: 'MDB', votos: 15, percentual: 4.57 },
                        { numero: '12', nome: 'Candidato 12', partido: 'Partido Democrático Trabalhista', siglaPartido: 'PDT', votos: 8, percentual: 2.44 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 400,
                      totalVotosApurados: 348,
                      votosValidos: 340,
                      votosBrancos: 3,
                      votosNulos: 5,
                      abstencoes: 52,
                      candidatos: [
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 190, percentual: 55.88 },
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 150, percentual: 44.12 },
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  RJ: {
    sigla: 'RJ',
    nome: 'Rio de Janeiro',
    municipios: [
      {
        codigoTse: '60011',
        nome: 'Rio de Janeiro',
        zonas: [
          {
            id: '0004',
            numero: '004ª Botafogo/Copacabana',
            locais: [
              {
                id: '1082',
                numero: '1082',
                nome: 'Colégio Santo Inácio',
                endereco: 'Rua São Clemente, 226',
                bairro: 'Botafogo',
                secoes: [
                  {
                    id: '0055',
                    numero: '0055',
                    urnaEletronica: 'UE2020 - Mod. 19.821.500',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 420,
                      totalVotosApurados: 360,
                      votosValidos: 348,
                      votosBrancos: 6,
                      votosNulos: 6,
                      abstencoes: 60,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 188, percentual: 54.02 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 136, percentual: 39.08 },
                        { numero: '15', nome: 'Candidato 15', partido: 'Movimento Democrático Brasileiro', siglaPartido: 'MDB', votos: 16, percentual: 4.60 },
                        { numero: '12', nome: 'Candidato 12', partido: 'Partido Democrático Trabalhista', siglaPartido: 'PDT', votos: 8, percentual: 2.30 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 420,
                      totalVotosApurados: 368,
                      votosValidos: 360,
                      votosBrancos: 3,
                      votosNulos: 5,
                      abstencoes: 52,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 210, percentual: 58.33 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 150, percentual: 41.67 },
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  MG: {
    sigla: 'MG',
    nome: 'Minas Gerais',
    municipios: [
      {
        codigoTse: '41238',
        nome: 'Belo Horizonte',
        zonas: [
          {
            id: '0026',
            numero: '026ª Savassi / Funcionários',
            locais: [
              {
                id: '1040',
                numero: '1040',
                nome: 'Colégio Arnaldo',
                endereco: 'Praça João Pessoa, 200',
                bairro: 'Funcionários',
                secoes: [
                  {
                    id: '0012',
                    numero: '0012',
                    urnaEletronica: 'UE2020 - Mod. 19.829.100',
                    primeiroTurno: {
                      turno: 1,
                      eleitoresAptos: 405,
                      totalVotosApurados: 350,
                      votosValidos: 339,
                      votosBrancos: 5,
                      votosNulos: 6,
                      abstencoes: 55,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 171, percentual: 50.44 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 147, percentual: 43.36 },
                        { numero: '15', nome: 'Candidato 15', partido: 'Movimento Democrático Brasileiro', siglaPartido: 'MDB', votos: 14, percentual: 4.13 },
                        { numero: '12', nome: 'Candidato 12', partido: 'Partido Democrático Trabalhista', siglaPartido: 'PDT', votos: 7, percentual: 2.06 },
                      ]
                    },
                    segundoTurno: {
                      turno: 2,
                      eleitoresAptos: 405,
                      totalVotosApurados: 358,
                      votosValidos: 350,
                      votosBrancos: 3,
                      votosNulos: 5,
                      abstencoes: 47,
                      candidatos: [
                        { numero: '13', nome: 'Candidato 13', partido: 'Partido dos Trabalhadores', siglaPartido: 'PT', votos: 182, percentual: 52.00 },
                        { numero: '22', nome: 'Candidato 22', partido: 'Partido Liberal', siglaPartido: 'PL', votos: 168, percentual: 48.00 },
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};
