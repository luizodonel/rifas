import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Pencil,
  Trash2,
  Search,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { UsuarioAdmin, Role } from '../../types';
import { formatCpf, formatPhone, cleanDigits } from '../../utils/formatters';

export const GestaoUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Novo Usuário
  const [showCriarModal, setShowCriarModal] = useState(false);
  const [novoCpf, setNovoCpf] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novaDataNascimento, setNovaDataNascimento] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoRole, setNovoRole] = useState<Role>('ROLE_USER');

  // Modal Trocar Senha
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [usuarioAlvoSenha, setUsuarioAlvoSenha] = useState<UsuarioAdmin | null>(null);
  const [senhaNovaInput, setSenhaNovaInput] = useState('');

  // Modal Editar Usuário
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [usuarioAlvoEditar, setUsuarioAlvoEditar] = useState<UsuarioAdmin | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDataNascimento, setEditDataNascimento] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editRole, setEditRole] = useState<Role>('ROLE_USER');

  const carregarUsuarios = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.usuarios.listar();
      setUsuarios(data);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao carregar usuários.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackMsg(null);

    try {
      await api.admin.usuarios.criar({
        cpf: cleanDigits(novoCpf),
        nome: novoNome.trim(),
        dataNascimento: novaDataNascimento,
        telefone: cleanDigits(novoTelefone),
        senha: novaSenha.trim(),
        role: novoRole,
      });

      setFeedbackMsg({ type: 'success', text: `Usuário ${novoNome} cadastrado com sucesso!` });
      setShowCriarModal(false);
      setNovoCpf('');
      setNovoNome('');
      setNovaDataNascimento('');
      setNovoTelefone('');
      setNovaSenha('');
      setNovoRole('ROLE_USER');
      await carregarUsuarios();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao criar usuário.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioAlvoSenha || !senhaNovaInput.trim()) return;

    setIsLoading(true);
    setFeedbackMsg(null);

    try {
      await api.admin.usuarios.trocarSenha(usuarioAlvoSenha.id, senhaNovaInput.trim());
      setFeedbackMsg({
        type: 'success',
        text: `Senha de ${usuarioAlvoSenha.nome} alterada com sucesso!`,
      });
      setShowSenhaModal(false);
      setUsuarioAlvoSenha(null);
      setSenhaNovaInput('');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao trocar senha.' });
    } finally {
      setIsLoading(false);
    }
  };

  const abrirEditar = (u: UsuarioAdmin) => {
    setUsuarioAlvoEditar(u);
    setEditNome(u.nome);
    setEditDataNascimento(u.dataNascimento || '');
    setEditTelefone(u.telefone || '');
    setEditRole(u.role);
    setShowEditarModal(true);
  };

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioAlvoEditar) return;

    setIsLoading(true);
    setFeedbackMsg(null);

    try {
      await api.admin.usuarios.atualizar(usuarioAlvoEditar.id, {
        nome: editNome.trim(),
        dataNascimento: editDataNascimento,
        telefone: cleanDigits(editTelefone),
        role: editRole,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Dados de ${editNome} atualizados com sucesso!`,
      });
      setShowEditarModal(false);
      setUsuarioAlvoEditar(null);
      await carregarUsuarios();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao atualizar dados.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluirUsuario = async (u: UsuarioAdmin) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${u.nome} (CPF: ${u.cpfFormatado})?`)) {
      return;
    }

    setIsLoading(true);
    setFeedbackMsg(null);

    try {
      await api.admin.usuarios.excluir(u.id);
      setFeedbackMsg({ type: 'success', text: `Usuário ${u.nome} excluído com sucesso!` });
      await carregarUsuarios();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao excluir usuário.' });
    } finally {
      setIsLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = filtro.toLowerCase();
    return (
      u.nome.toLowerCase().includes(termo) ||
      u.cpf.includes(cleanDigits(termo)) ||
      u.telefone.includes(cleanDigits(termo))
    );
  });

  return (
    <div className="space-y-6">
      {/* Alertas de Status */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra Superior de Ações e Filtro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar usuário por nome, CPF ou telefone..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <button
          onClick={() => setShowCriarModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nome / Usuário</th>
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                    {isLoading ? 'Carregando lista de usuários...' : 'Nenhum usuário encontrado.'}
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const isAdmin = u.role === 'ROLE_ADMIN';
                  return (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div>{u.nome}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Nasc: {u.dataNascimento || 'Não informado'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                        {u.cpfFormatado}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {u.telefoneFormatado || u.telefone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isAdmin ? 'ADMIN' : 'CLIENTE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setUsuarioAlvoSenha(u);
                              setSenhaNovaInput('');
                              setShowSenhaModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-colors"
                            title="Trocar Senha"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => abrirEditar(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Editar Dados"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExcluirUsuario(u)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR NOVO USUÁRIO */}
      {showCriarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-brand-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                Cadastrar Novo Usuário
              </h3>
              <button onClick={() => setShowCriarModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCriarUsuario} className="space-y-3.5 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">CPF Oficial:</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={formatCpf(novoCpf)}
                  onChange={(e) => setNovoCpf(e.target.value)}
                  maxLength={14}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Nome Completo:</label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Data Nascimento:</label>
                  <input
                    type="date"
                    value={novaDataNascimento}
                    onChange={(e) => setNovaDataNascimento(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Telefone / Whats:</label>
                  <input
                    type="text"
                    placeholder="(61) 99999-9999"
                    value={formatPhone(novoTelefone)}
                    onChange={(e) => setNovoTelefone(e.target.value)}
                    maxLength={15}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Senha de Acesso:</label>
                <input
                  type="password"
                  placeholder="Defina a senha do usuário"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Perfil de Acesso:</label>
                <select
                  value={novoRole}
                  onChange={(e) => setNovoRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="ROLE_USER">Participante (ROLE_USER)</option>
                  <option value="ROLE_ADMIN">Administrador (ROLE_ADMIN)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCriarModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  {isLoading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TROCAR SENHA */}
      {showSenhaModal && usuarioAlvoSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Trocar Senha
              </h3>
              <button onClick={() => setShowSenhaModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrocarSenha} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="text-slate-400">Usuário selecionado:</div>
                <div className="font-bold text-white mt-0.5">{usuarioAlvoSenha.nome}</div>
                <div className="font-mono text-slate-500 text-[11px] mt-0.5">
                  CPF: {usuarioAlvoSenha.cpfFormatado}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Nova Senha:</label>
                <input
                  type="password"
                  placeholder="Digite a nova senha"
                  value={senhaNovaInput}
                  onChange={(e) => setSenhaNovaInput(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSenhaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !senhaNovaInput.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  {isLoading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DADOS */}
      {showEditarModal && usuarioAlvoEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-brand-400" />
                Editar Dados do Usuário
              </h3>
              <button onClick={() => setShowEditarModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditarUsuario} className="space-y-3.5 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Data Nascimento:</label>
                  <input
                    type="date"
                    value={editDataNascimento}
                    onChange={(e) => setEditDataNascimento(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Telefone:</label>
                  <input
                    type="text"
                    value={formatPhone(editTelefone)}
                    onChange={(e) => setEditTelefone(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Perfil de Acesso:</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="ROLE_USER">Participante (ROLE_USER)</option>
                  <option value="ROLE_ADMIN">Administrador (ROLE_ADMIN)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditarModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
