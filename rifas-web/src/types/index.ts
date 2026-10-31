export type StatusRifa = 'EM_BREVE' | 'ATIVA' | 'AO_VIVO' | 'ENCERRADA';
export type RegraSorteioTipo = 'ALEATORIO' | 'DIRECIONADO';
export type StatusPagamento = 'PENDENTE' | 'PAGO' | 'CANCELADO';
export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export interface Usuario {
  id: number;
  nome: string;
  cpf: string;
  cpfFormatado?: string;
  telefone: string;
  dataNascimento?: string;
  role: Role;
}

export interface GanhadorPublico {
  nome: string;
  cpfMascarado: string;
  telefoneMascarado: string;
  numeroSorteado: string;
}

export interface Rifa {
  id: number;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  precoCota: number;
  totalCotas: number;
  cotasVendidas: number;
  cotasDisponiveis: number;
  porcentagemVendida: number;
  status: StatusRifa;
  dataHoraSorteio: string;
  numeroSorteado?: string;
  imagens: string[];
  imagemPrincipal: string;
  ganhador?: GanhadorPublico;
}

export interface GanhadorAdmin {
  id: number;
  nome: string;
  cpfCompleto: string;
  cpfFormatado: string;
  telefoneCompleto: string;
  telefoneFormatado: string;
  dataNascimento: string;
  numeroSorteado: string;
  totalCotasCompradas: number;
}

export interface RifaAdmin extends Rifa {
  totalArrecadado: number;
  regraSorteioTipo: RegraSorteioTipo;
  cpfDirecionado?: string;
  cpfDirecionadoFormatado?: string;
  createdAt: string;
  ganhadorCompleto?: GanhadorAdmin;
}

export interface Pedido {
  id: number;
  codigoPedido: string;
  rifaId: number;
  rifaTitulo: string;
  rifaImagemPrincipal: string;
  quantidade: number;
  valorTotal: number;
  statusPagamento: StatusPagamento;
  qrCodePix?: string;
  chavePixCopiaCola?: string;
  dataCompra: string;
  dataPagamento?: string;
  numerosCotas: string[];
}

export interface SorteioPublico {
  rifaId: number;
  rifaTitulo: string;
  rifaImagemPrincipal?: string;
  status: string;
  numeroSorteado?: string;
  dataHoraExecucao?: string;
  nomeGanhador?: string;
  cpfMascarado?: string;
  telefoneMascarado?: string;
  hashComprovante?: string;
  totalCotasRifa?: number;
  totalCotasVendidas?: number;
}

export interface SorteioAdmin {
  id?: number;
  rifaId: number;
  rifaTitulo: string;
  numeroSorteado: string;
  dataHoraExecucao: string;
  regraUtilizada: RegraSorteioTipo;
  hashComprovante: string;
  usuarioGanhadorId: number;
  nomeGanhador: string;
  cpfCompleto: string;
  cpfFormatado: string;
  telefoneCompleto: string;
  telefoneFormatado: string;
  dataNascimento: string;
  cotasAdquiridasPeloGanhador: number;
}

export interface HistoricoSorteio {
  id: number;
  rifaId: number;
  rifaTitulo: string;
  rifaImagem: string;
  precoCota: number;
  totalCotas: number;
  numeroSorteado: string;
  dataHoraExecucao: string;
  nomeGanhador: string;
  cpfMascarado: string;
  telefoneMascarado: string;
  hashComprovante: string;
}

export interface CheckCpfResponse {
  cadastrado: boolean;
  cpf: string;
  nome?: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

