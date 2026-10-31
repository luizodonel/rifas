import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Ticket,
  Trophy,
  ShieldCheck,
  Radio,
  Zap,
  HelpCircle,
  MessageCircle,
  Clock,
  ArrowUp
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { RifaCard } from './components/RifaCard';
import { CompraModal } from './components/CompraModal';
import { SorteioAoVivoModal } from './components/SorteioAoVivoModal';
import { HistoricoSorteios } from './components/HistoricoSorteios';
import { PainelAdmin } from './components/PainelAdmin';
import { AuthModal } from './components/AuthModal';
import { MeusPedidosModal } from './components/MeusPedidosModal';
import { Rifa, SorteioPublico, Usuario } from './types';
import { api, getSavedUser, removeToken, setSavedUser } from './services/api';
import { subscribeToTodosSorteios } from './services/websocket';

export default function App() {
  const [user, setUser] = useState<Usuario | null>(getSavedUser());
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modais
  const [selectedRifaParaCompra, setSelectedRifaParaCompra] = useState<Rifa | null>(null);
  const [selectedRifaParaSorteio, setSelectedRifaParaSorteio] = useState<Rifa | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMeusPedidosOpen, setIsMeusPedidosOpen] = useState(false);

  // Notificação Toast de Sorteio Ao Vivo
  const [liveToast, setLiveToast] = useState<SorteioPublico | null>(null);

  // Carregar Rifas
  const carregarRifas = async () => {
    try {
      const data = await api.rifas.listarPublicas();
      setRifas(data);
    } catch (err) {
      console.error('Erro ao carregar rifas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarRifas();

    // Valida sessão atual
    api.auth
      .me()
      .then((u) => {
        setUser(u);
        setSavedUser(u);
      })
      .catch(() => {
        // Token expirado ou inválido
        setUser(null);
      });

    // Ouve todos os sorteios da plataforma via WebSocket
    const unsubscribe = subscribeToTodosSorteios((sorteio) => {
      setLiveToast(sorteio);
      carregarRifas();
      setTimeout(() => setLiveToast(null), 10000);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setIsAdminOpen(false);
  };

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === 'sorteio-ao-vivo') {
      const aoVivoOuAtiva = rifas.find((r) => r.status === 'AO_VIVO' || r.status === 'ATIVA');
      if (aoVivoOuAtiva) {
        setSelectedRifaParaSorteio(aoVivoOuAtiva);
      } else if (rifas.length > 0) {
        setSelectedRifaParaSorteio(rifas[0]);
      }
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      {/* Navbar Fixa */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMeusPedidos={() => setIsMeusPedidosOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
        onNavigateSection={handleNavigateSection}
        isAdminOpen={isAdminOpen}
      />

      {/* TOAST DE NOTIFICAÇÃO DE SORTEIO AO VIVO */}
      {liveToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xl border-2 border-white/40 flex items-center gap-3 animate-bounce">
          <Trophy className="w-8 h-8 shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block">
              SORTEIO REALIZADO AGORA!
            </span>
            <p className="text-xs font-bold leading-tight line-clamp-1">
              {liveToast.rifaTitulo}
            </p>
            <span className="text-[11px] block mt-0.5">
              Ganhador: <strong>{liveToast.nomeGanhador}</strong> ({liveToast.numeroSorteado})
            </span>
          </div>
        </div>
      )}

      {/* Hero Carrossel de Itens */}
      <main className="flex-1">
        <HeroCarousel
          rifas={rifas}
          onSelectRifa={(r) => setSelectedRifaParaCompra(r)}
          onOpenSorteioAoVivo={(r) => setSelectedRifaParaSorteio(r)}
        />

        {/* Faixa de Vantagens e Confiança */}
        <section className="border-y border-slate-800/80 bg-slate-900/40 py-6 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center justify-center p-2">
              <ShieldCheck className="w-6 h-6 text-brand-400 mb-1" />
              <span className="text-xs font-bold text-white">Sorteios Auditáveis</span>
              <span className="text-[10px] text-slate-400">Hash criptográfico SHA-256</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <Zap className="w-6 h-6 text-amber-400 mb-1" />
              <span className="text-xs font-bold text-white">Liberação Imediata</span>
              <span className="text-[10px] text-slate-400">Pix com bilhetes na hora</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <Radio className="w-6 h-6 text-rose-400 mb-1 animate-pulse" />
              <span className="text-xs font-bold text-white">Ao Vivo via WebSocket</span>
              <span className="text-[10px] text-slate-400">Cronômetro em tempo real</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <Trophy className="w-6 h-6 text-emerald-400 mb-1" />
              <span className="text-xs font-bold text-white">Entrega Garantida</span>
              <span className="text-[10px] text-slate-400">Prêmio ou Pix na conta</span>
            </div>
          </div>
        </section>

        {/* Vitrine de Rifas Ativas */}
        <section id="vitrine" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">
                <Ticket className="w-4 h-4" />
                <span>Escolha Sua Sorte</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Ações e Rifas Disponíveis
              </h2>
            </div>
            <span className="text-xs text-slate-400 mt-2 sm:mt-0 font-medium">
              Selecione uma cota a partir de <strong className="text-emerald-400">R$ 0,15</strong>
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-slate-500 font-medium animate-pulse">
              Carregando vitrine oficial de prêmios...
            </div>
          ) : rifas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              Nenhuma ação disponível no momento. Novas edições serão publicadas em breve!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rifas.map((rifa) => (
                <RifaCard
                  key={rifa.id}
                  rifa={rifa}
                  onSelect={(r) => setSelectedRifaParaCompra(r)}
                  onOpenSorteio={(r) => setSelectedRifaParaSorteio(r)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Histórico Público dos Últimos 10 Sorteios */}
        <HistoricoSorteios />
      </main>

      {/* Rodapé Moderno */}
      <footer className="border-t border-slate-800 bg-[#080b11] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-slate-950 font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-white">
                RIFAS<span className="text-brand-500">ONLINE</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Plataforma líder em ações entre amigos e sorteios com tecnologia de ponta, auditabilidade criptográfica e transmissão ao vivo para todo o Brasil.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">Links e Suporte</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigateSection('vitrine')} className="hover:text-white">
                  Rifas Disponíveis
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateSection('historico')} className="hover:text-white">
                  Ganhadores e Comprovantes
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/5561985823912?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20no%20Rifas%20Online."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Suporte Oficial WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">Segurança & Legalidade</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Todos os pagamentos são protegidos por criptografia de ponta a ponta. Os dados dos participantes são mascarados publicamente em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>© 2026 Rifas Online • Todos os direitos reservados. Produção: clube.logistadigital.com.br</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1 hover:text-white"
          >
            <span>Voltar ao Topo</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* MODAIS GLOBAIS */}
      {selectedRifaParaCompra && (
        <CompraModal
          rifa={selectedRifaParaCompra}
          currentUser={user}
          onClose={() => {
            setSelectedRifaParaCompra(null);
            carregarRifas();
          }}
          onUserAuthenticated={(u) => {
            setUser(u);
            setSavedUser(u);
          }}
        />
      )}

      {selectedRifaParaSorteio && (
        <SorteioAoVivoModal
          rifa={selectedRifaParaSorteio}
          onClose={() => setSelectedRifaParaSorteio(null)}
          onComprarCotas={(r) => {
            setSelectedRifaParaSorteio(null);
            setSelectedRifaParaCompra(r);
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => {
            setUser(u);
            setSavedUser(u);
          }}
        />
      )}

      {isAdminOpen && (
        <PainelAdmin
          onClose={() => {
            setIsAdminOpen(false);
            carregarRifas();
          }}
          onSorteioExecutado={() => {
            carregarRifas();
          }}
        />
      )}

      {isMeusPedidosOpen && (
        <MeusPedidosModal onClose={() => setIsMeusPedidosOpen(false)} />
      )}
    </div>
  );
}
