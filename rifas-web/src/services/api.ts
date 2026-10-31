import {
  AuthResponse,
  CheckCpfResponse,
  HistoricoSorteio,
  Pedido,
  Rifa,
  RifaAdmin,
  SorteioAdmin,
  SorteioPublico,
  Usuario
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getToken(): string | null {
  return localStorage.getItem('rifas_token');
}

export function setToken(token: string): void {
  localStorage.setItem('rifas_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('rifas_token');
  localStorage.removeItem('rifas_user');
}

export function getSavedUser(): Usuario | null {
  try {
    const raw = localStorage.getItem('rifas_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSavedUser(user: Usuario): void {
  localStorage.setItem('rifas_user', JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = '';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errData.error || '';
    } catch {
      // resposta sem corpo JSON
    }

    if (!errorMsg) {
      if (response.status === 403) {
        errorMsg = 'Acesso restrito: Para cadastrar e gerenciar sorteios, é necessário estar conectado como Administrador (CPF 000.000.000-00, Senha admin123).';
      } else if (response.status === 401) {
        errorMsg = 'Credenciais inválidas ou sessão expirada. Por favor, entre novamente.';
      } else if (response.status === 404) {
        errorMsg = 'Item ou sorteio não encontrado no servidor.';
      } else if (response.status >= 500) {
        errorMsg = 'Instabilidade temporária no servidor. Tente novamente em instantes.';
      } else {
        errorMsg = `Não foi possível processar a solicitação (código ${response.status}).`;
      }
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  auth: {
    checkCpf: (cpf: string) =>
      request<CheckCpfResponse>('/api/auth/check-cpf', {
        method: 'POST',
        body: JSON.stringify({ cpf }),
      }),

    login: (cpf: string, senha: string) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cpf, senha }),
      }),

    register: (data: {
      cpf: string;
      nome: string;
      dataNascimento: string;
      telefone: string;
      senha: string;
    }) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<Usuario>('/api/auth/me'),
  },

  rifas: {
    listarPublicas: () => request<Rifa[]>('/api/public/rifas'),
    obterPublica: (id: number) => request<Rifa>(`/api/public/rifas/${id}`),
    listarHistorico: () => request<HistoricoSorteio[]>('/api/public/historico-sorteios'),
    obterSorteioAoVivo: (id: number) => request<SorteioPublico>(`/api/public/sorteio-ao-vivo/${id}`),
  },

  pedidos: {
    comprar: (rifaId: number, quantidade: number) =>
      request<Pedido>('/api/pedidos/comprar', {
        method: 'POST',
        body: JSON.stringify({ rifaId, quantidade }),
      }),

    obter: (id: number) => request<Pedido>(`/api/pedidos/${id}`),

    simularPagamento: (id: number) =>
      request<Pedido>(`/api/pedidos/${id}/simular-pagamento`, {
        method: 'POST',
      }),

    listarMeusPedidos: () => request<Pedido[]>('/api/pedidos/meus-pedidos'),
  },

  admin: {
    listarRifas: () => request<RifaAdmin[]>('/api/admin/rifas'),
    obterRifa: (id: number) => request<RifaAdmin>(`/api/admin/rifas/${id}`),
    criarRifa: (data: {
      titulo: string;
      subtitulo?: string;
      descricao: string;
      precoCota: number;
      totalCotas: number;
      dataHoraSorteio: string;
      imagensUrls: string[];
    }) =>
      request<RifaAdmin>('/api/admin/rifas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    atualizarRifa: (
      id: number,
      data: {
        titulo: string;
        subtitulo?: string;
        descricao: string;
        precoCota: number;
        totalCotas: number;
        dataHoraSorteio: string;
        imagensUrls: string[];
      }
    ) =>
      request<RifaAdmin>(`/api/admin/rifas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    excluirRifa: (id: number) =>
      request<{ success: boolean; message: string }>(`/api/admin/rifas/${id}`, {
        method: 'DELETE',
      }),

    parametrizarSorteio: (
      rifaId: number,
      data: { regraSorteioTipo: 'ALEATORIO' | 'DIRECIONADO'; cpfDirecionado?: string }
    ) =>
      request<RifaAdmin>(`/api/admin/rifas/${rifaId}/parametrizar-sorteio`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    listarParticipantesAptos: (rifaId: number) =>
      request<Usuario[]>(`/api/admin/rifas/${rifaId}/participantes-aptos`),

    sortearAgora: (rifaId: number) =>
      request<SorteioPublico>(`/api/admin/rifas/${rifaId}/sortear`, {
        method: 'POST',
      }),

    obterDadosCompletosSorteio: (rifaId: number) =>
      request<SorteioAdmin>(`/api/admin/sorteio/${rifaId}`),
  },
};
