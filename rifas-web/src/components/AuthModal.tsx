import React, { useState } from 'react';
import { X, Lock, Phone, User, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api, setSavedUser, setToken } from '../services/api';
import { Usuario } from '../types';
import { formatCpf, formatPhone, cleanDigits } from '../utils/formatters';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: Usuario) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login
  const [loginCpf, setLoginCpf] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Register
  const [regCpf, setRegCpf] = useState('');
  const [regNome, setRegNome] = useState('');
  const [regNascimento, setRegNascimento] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirma, setRegConfirma] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanDigits(loginCpf);
    if (clean.length !== 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.auth.login(clean, loginSenha);
      setToken(res.token);
      setSavedUser(res.usuario);
      onSuccess(res.usuario);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'CPF ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanDigits(regCpf);
    if (clean.length !== 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }
    if (!regNome.trim()) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    if (!regNascimento) {
      setErrorMsg('Informe sua data de nascimento.');
      return;
    }
    if (cleanDigits(regTelefone).length < 10) {
      setErrorMsg('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (regSenha.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 dígitos.');
      return;
    }
    if (regSenha !== regConfirma) {
      setErrorMsg('As senhas não conferem.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.auth.register({
        cpf: clean,
        nome: regNome.trim(),
        dataNascimento: regNascimento,
        telefone: cleanDigits(regTelefone),
        senha: regSenha,
      });

      setToken(res.token);
      setSavedUser(res.usuario);
      onSuccess(res.usuario);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tabs Login / Cadastro */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('LOGIN');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'LOGIN' ? 'bg-brand-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Acessar Minha Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('REGISTER');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'REGISTER' ? 'bg-brand-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cadastrar Novo
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {tab === 'LOGIN' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">CPF:</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={formatCpf(loginCpf)}
                onChange={(e) => setLoginCpf(cleanDigits(e.target.value))}
                maxLength={14}
                required
                className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Senha:</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm shadow-lg transition-all"
            >
              {isLoading ? 'Entrando...' : 'ENTRAR NA CONTA'}
            </button>

            {/* Atalho Rápido de Acesso Administrador */}
            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setLoginCpf('00000000000');
                  setLoginSenha('admin123');
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Preencher Acesso Admin (000.000.000-00 / admin123)</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">CPF Oficial:</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={formatCpf(regCpf)}
                onChange={(e) => setRegCpf(cleanDigits(e.target.value))}
                maxLength={14}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Nome Completo:</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={regNome}
                  onChange={(e) => setRegNome(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Nascimento:</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="date"
                    value={regNascimento}
                    onChange={(e) => setRegNascimento(e.target.value)}
                    required
                    className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">WhatsApp:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="(XX) XXXXX-XXXX"
                    value={formatPhone(regTelefone)}
                    onChange={(e) => setRegTelefone(cleanDigits(e.target.value))}
                    maxLength={15}
                    required
                    className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Senha:</label>
                <input
                  type="password"
                  placeholder="Mín. 6 dígitos"
                  value={regSenha}
                  onChange={(e) => setRegSenha(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Confirmar Senha:</label>
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={regConfirma}
                  onChange={(e) => setRegConfirma(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm shadow-lg transition-all"
            >
              {isLoading ? 'Cadastrando...' : 'CRIAR MINHA CONTA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
