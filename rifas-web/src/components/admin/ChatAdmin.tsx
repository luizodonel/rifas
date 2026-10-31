import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Clock,
  RefreshCw,
  Search,
  CheckCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { subscribeToAdminChat, subscribeToChat } from '../../services/websocket';
import { MensagemChat, SessaoChat } from '../../types';

export const ChatAdmin: React.FC = () => {
  const [sessoes, setSessoes] = useState<SessaoChat[]>([]);
  const [sessaoSelecionada, setSessaoSelecionada] = useState<SessaoChat | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [inputResposta, setInputResposta] = useState('');
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const carregarSessoes = async (manterSessaoId?: string) => {
    try {
      const data = await api.admin.chat.listarSessoes();
      setSessoes(data);

      if (data.length > 0) {
        const idAlvo = manterSessaoId || sessaoSelecionada?.sessaoId || data[0].sessaoId;
        const encontrada = data.find((s) => s.sessaoId === idAlvo) || data[0];
        setSessaoSelecionada(encontrada);
      } else {
        setSessaoSelecionada(null);
        setMensagens([]);
      }
    } catch (err) {
      console.error('Erro ao carregar sessões de chat:', err);
    }
  };

  const carregarMensagensSessao = async (sessaoId: string) => {
    try {
      const msgs = await api.admin.chat.obterMensagens(sessaoId);
      setMensagens(msgs);
    } catch (err) {
      console.error('Erro ao carregar mensagens da sessão:', err);
    }
  };

  useEffect(() => {
    carregarSessoes();

    // Inscrição no canal geral do admin para receber novas mensagens de clientes
    const unsubscribeAdmin = subscribeToAdminChat((novaMsg) => {
      carregarSessoes(sessaoSelecionada?.sessaoId);
      if (sessaoSelecionada && sessaoSelecionada.sessaoId === novaMsg.sessaoId) {
        setMensagens((prev) => {
          if (prev.some((m) => m.id === novaMsg.id)) return prev;
          return [...prev, novaMsg];
        });
      }
    });

    const interval = setInterval(() => {
      carregarSessoes(sessaoSelecionada?.sessaoId);
    }, 4000);

    return () => {
      unsubscribeAdmin();
      clearInterval(interval);
    };
  }, [sessaoSelecionada?.sessaoId]);

  useEffect(() => {
    if (sessaoSelecionada) {
      carregarMensagensSessao(sessaoSelecionada.sessaoId);
    }
  }, [sessaoSelecionada?.sessaoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessaoSelecionada || !inputResposta.trim() || isSending) return;

    const texto = inputResposta.trim();
    setInputResposta('');
    setIsSending(true);

    try {
      const novaMsg = await api.admin.chat.responder(sessaoSelecionada.sessaoId, texto);
      setMensagens((prev) => {
        if (prev.some((m) => m.id === novaMsg.id)) return prev;
        return [...prev, novaMsg];
      });
      await carregarSessoes(sessaoSelecionada.sessaoId);
    } catch (err: any) {
      console.error('Erro ao enviar resposta:', err);
      alert(err.message || 'Erro ao enviar resposta.');
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

  const sessoesFiltradas = sessoes.filter((s) => {
    const termo = filtro.toLowerCase();
    return (
      s.nomeCliente.toLowerCase().includes(termo) ||
      (s.cpfCliente && s.cpfCliente.includes(termo)) ||
      s.sessaoId.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[640px] max-h-[75vh]">
      {/* Coluna da Esquerda: Lista de Conversas / Sessões */}
      <div className="lg:col-span-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              Atendimentos ({sessoes.length})
            </span>
            <button
              onClick={() => carregarSessoes(sessaoSelecionada?.sessaoId)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Atualizar conversas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por cliente ou CPF..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {sessoesFiltradas.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              Nenhuma conversa de suporte ativa no momento.
            </div>
          ) : (
            sessoesFiltradas.map((s) => {
              const isSelected = sessaoSelecionada?.sessaoId === s.sessaoId;
              return (
                <div
                  key={s.sessaoId}
                  onClick={() => setSessaoSelecionada(s)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-slate-800/90 border-l-4 border-brand-500'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{s.nomeCliente}</span>
                      </div>
                      {s.cpfCliente && (
                        <div className="text-[10px] font-mono text-slate-400">
                          {s.cpfCliente}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {s.ultimaMensagem}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatHora(s.dataUltimaMensagem)}
                    </span>
                    {s.naoLidas > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] animate-pulse">
                        {s.naoLidas}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Coluna da Direita: Janela de Conversa e Resposta */}
      <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
        {sessaoSelecionada ? (
          <>
            {/* Cabeçalho da Conversa */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center font-black">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {sessaoSelecionada.nomeCliente}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                    <span>Sessão: {sessaoSelecionada.sessaoId}</span>
                    {sessaoSelecionada.cpfCliente && (
                      <span>• CPF: {sessaoSelecionada.cpfCliente}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0a0e17]/60">
              {mensagens.map((msg) => {
                const isAdmin = msg.remetenteAdmin;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      isAdmin ? 'justify-end ml-auto max-w-[80%]' : 'justify-start max-w-[80%]'
                    }`}
                  >
                    {!isAdmin && (
                      <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl p-3 text-xs shadow-md ${
                        isAdmin
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-sm'
                          : 'bg-slate-800 border border-slate-700 text-white rounded-tl-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin ? 'text-slate-900' : 'text-brand-400'
                          }`}
                        >
                          {isAdmin ? 'Você (Suporte)' : msg.nomeRemetente}
                        </span>
                        <span
                          className={`text-[9px] ${
                            isAdmin ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {formatHora(msg.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.conteudo}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Barra de Resposta */}
            <form onSubmit={handleEnviarResposta} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Responder para ${sessaoSelecionada.nomeCliente}...`}
                value={inputResposta}
                onChange={(e) => setInputResposta(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!inputResposta.trim() || isSending}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Responder</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3 stroke-[1.5] text-slate-600" />
            <h4 className="text-sm font-bold text-slate-400">Nenhuma conversa selecionada</h4>
            <p className="text-xs text-slate-500 mt-1">
              Selecione um cliente na lista ao lado para responder e prestar atendimento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
