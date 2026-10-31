import React from 'react';
import { Sparkles, Trophy, Ticket, ShieldCheck, LogOut, User as UserIcon, Radio, MessageSquare } from 'lucide-react';
import { Usuario } from '../types';

interface NavbarProps {
  user: Usuario | null;
  onOpenAuth: () => void;
  onOpenMeusPedidos: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onNavigateSection: (sectionId: string) => void;
  isAdminOpen: boolean;
  onOpenChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onOpenMeusPedidos,
  onOpenAdmin,
  onLogout,
  onNavigateSection,
  isAdminOpen,
  onOpenChat
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0b0f17]/90 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => onNavigateSection('vitrine')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              RIFAS<span className="text-brand-500">ONLINE</span>
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase block -mt-1">
              Prêmios & Sorteios Ao Vivo
            </span>
          </div>
        </div>

        {/* Links Centrais (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigateSection('vitrine')}
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Ticket className="w-4 h-4 text-brand-500" />
            <span>Rifas Ativas</span>
          </button>

          <button
            onClick={() => onNavigateSection('sorteio-ao-vivo')}
            className="hover:text-white transition-colors flex items-center gap-1.5 text-amber-400"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <Radio className="w-4 h-4" />
            <span>Sorteio Ao Vivo</span>
          </button>

          <button
            onClick={() => onNavigateSection('historico')}
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Últimos Ganhadores</span>
          </button>
        </nav>

        {/* Ações da Direita */}
        <div className="flex items-center gap-3">
          {/* Suporte Chat Interno */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 transition-colors"
              title="Abrir Chat de Atendimento Online"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Suporte Online</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              {/* Botão Painel Admin (Apenas ROLE_ADMIN) */}
              {user.role === 'ROLE_ADMIN' && (
                <button
                  onClick={onOpenAdmin}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isAdminOpen
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                  }`}
                  title="Painel Administrativo com controle de sorteio livre ou direcionado"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Painel Admin</span>
                </button>
              )}

              {/* Botão Meus Bilhetes */}
              <button
                onClick={onOpenMeusPedidos}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Ticket className="w-3.5 h-3.5 text-brand-500" />
                <span className="hidden sm:inline">Meus Pedidos</span>
              </button>

              {/* Chip do Usuário */}
              <div className="flex items-center gap-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-brand-400">
                  {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-slate-200 leading-tight truncate max-w-[110px]">
                    {user.nome.split(' ')[0]}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {user.cpf ? `${user.cpf.slice(0, 3)}...` : ''}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white shadow-lg shadow-brand-500/25 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Navegação Rápida Mobile */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 bg-slate-900/90 text-xs font-medium text-slate-400">
        <button
          onClick={() => onNavigateSection('vitrine')}
          className="flex flex-col items-center gap-0.5 hover:text-white"
        >
          <Ticket className="w-4 h-4 text-brand-500" />
          <span>Rifas</span>
        </button>
        <button
          onClick={() => onNavigateSection('sorteio-ao-vivo')}
          className="flex flex-col items-center gap-0.5 text-amber-400"
        >
          <Radio className="w-4 h-4" />
          <span>Ao Vivo</span>
        </button>
        <button
          onClick={() => onNavigateSection('historico')}
          className="flex flex-col items-center gap-0.5 hover:text-white"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Ganhadores</span>
        </button>
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex flex-col items-center gap-0.5 text-brand-400 hover:text-brand-300"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Suporte</span>
          </button>
        )}
      </div>
    </header>
  );
};
