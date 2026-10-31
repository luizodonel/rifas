import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, ShieldCheck, User, Minimize2 } from 'lucide-react';
import { api } from '../services/api';
import { subscribeToChat } from '../services/websocket';
import { MensagemChat, Usuario } from '../types';

interface ChatSuporteWidgetProps {
  currentUser: Usuario | null;
}

export const ChatSuporteWidget: React.FC<ChatSuporteWidgetProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessaoId, setSessaoId] = useState<string>('');
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [inputTexto, setInputTexto] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializa ou recupera o ID da sessão do chat
  useEffect(() => {
    let storedId = localStorage.getItem('rifas_chat_sessao_id');
    if (!storedId) {
      storedId = 'SESS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('rifas_chat_sessao_id', storedId);
    }
    setSessaoId(storedId);
  }, []);

  // Carrega histórico e conecta ao WebSocket
  useEffect(() => {
    if (!sessaoId) return;

    const carregarMensagens = async () => {
      try {
        const data = await api.chat.obterMensagens(sessaoId);
        setMensagens(data);
      } catch (err) {
        console.error('Erro ao carregar mensagens do chat:', err);
      }
    };

    carregarMensagens();

    // Inscrição no WebSocket para atualizações em tempo real
    const unsubscribe = subscribeToChat(sessaoId, (novaMsg) => {
      setMensagens((prev) => {
        if (prev.some((m) => m.id === novaMsg.id)) return prev;
        return [...prev, novaMsg];
      });

      if (!isOpen && novaMsg.remetenteAdmin) {
        setUnreadCount((count) => count + 1);
      }
    });

    // Polling de fallback a cada 4s
    const interval = setInterval(carregarMensagens, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [sessaoId, isOpen]);

  // Auto scroll para a última mensagem
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [mensagens, isOpen]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTexto.trim() || isSending) return;

    const texto = inputTexto.trim();
    setInputTexto('');
    setIsSending(true);

    try {
      const novaMsg = await api.chat.enviar({
        sessaoId,
        conteudo: texto,
        nomeRemetente: currentUser ? currentUser.nome : undefined,
        cpf: currentUser ? currentUser.cpf : undefined,
      });

      setMensagens((prev) => {
        if (prev.some((m) => m.id === novaMsg.id)) return prev;
        return [...prev, novaMsg];
      });
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      alert(err.message || 'Não foi possível enviar a mensagem no chat.');
    } finally {
      setIsSending(false);
    }
  };

  const formatHora = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Botão Flutuante de Abertura do Chat (Substitui o WhatsApp) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="fixed bottom-5 right-5 z-40 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-brand-500/40 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group border border-brand-300/40"
          title="Falar com o Suporte Online"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline text-xs uppercase tracking-wider">
            Suporte ao Vivo
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
        </button>
      )}

      {/* Janela do Chat Aberta */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-slate-900 border border-brand-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Cabeçalho */}
          <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  Suporte Rifas Online
                </h3>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Atendentes online agora
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              title="Fechar Janela"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0a0e17]/80">
            {/* Mensagem Inicial de Boas-vindas */}
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-sm p-3 text-xs text-slate-200 shadow-md">
                <p className="font-semibold text-brand-400 text-[10px] uppercase tracking-wider mb-1">
                  Atendimento Oficial
                </p>
                <p>
                  Olá! Bem-vindo ao canal oficial de suporte do Rifas Online.
                  Como podemos ajudar você com suas cotas ou sorteios hoje?
                </p>
                <span className="text-[9px] text-slate-500 block text-right mt-1.5">
                  Agora mesmo
                </span>
              </div>
            </div>

            {/* Lista de Mensagens */}
            {mensagens.map((msg) => {
              const isAdmin = msg.remetenteAdmin;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isAdmin ? 'justify-start max-w-[88%]' : 'justify-end ml-auto max-w-[88%]'
                  }`}
                >
                  {isAdmin && (
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-3 text-xs shadow-md ${
                      isAdmin
                        ? 'bg-slate-800 border border-amber-500/30 text-white rounded-tl-sm'
                        : 'bg-brand-500 text-slate-950 font-medium rounded-tr-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isAdmin ? 'text-amber-400' : 'text-slate-900'
                        }`}
                      >
                        {isAdmin ? 'Suporte' : msg.nomeRemetente || 'Você'}
                      </span>
                      <span
                        className={`text-[9px] ${
                          isAdmin ? 'text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {formatHora(msg.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.conteudo}
                    </p>
                  </div>

                  {!isAdmin && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Campo de Entrada de Mensagem */}
          <form onSubmit={handleEnviar} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Digite sua dúvida aqui..."
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!inputTexto.trim() || isSending}
              className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 transition-all font-black"
              title="Enviar Mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
