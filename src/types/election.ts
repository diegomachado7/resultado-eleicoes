export interface CandidateVote {
  numero: string;
  nome: string;
  partido: string;
  siglaPartido: string;
  votos: number;
  percentual: number;
  fotoUrl?: string;
}

export interface TurnoResult {
  turno: 1 | 2;
  dataEleicao?: string;
  totalVotosApurados: number;
  votosValidos: number;
  votosBrancos: number;
  votosNulos: number;
  abstencoes: number;
  eleitoresAptos: number;
  candidatos: CandidateVote[];
}

export interface SecaoData {
  id: string; // Ex: '0015'
  numero: string;
  urnaEletronica: string;
  anoEleicao?: number;
  primeiroTurno: TurnoResult;
  segundoTurno?: TurnoResult;
}

export interface LocalVotacao {
  id: string;
  numero: string;
  nome: string;
  endereco: string;
  bairro: string;
  secoes: SecaoData[];
}

export interface ZonaEleitoral {
  id: string;
  numero: string;
  locais: LocalVotacao[];
}

export interface Municipio {
  codigoTse: string; // Ex: 71072 para SP
  nome: string;
  zonas: ZonaEleitoral[];
}

export interface Estado {
  sigla: string; // SP, RJ, MG...
  nome: string;
  municipios: Municipio[];
}

export interface AnoEleicao {
  ano: number;
  label: string;
  tipo: 'Municipal' | 'Geral';
  dataPrimeiroTurno: string;
  dataSegundoTurno: string;
}

