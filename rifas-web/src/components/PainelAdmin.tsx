import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Trophy,
  Play,
  Settings2,
  Users,
  Plus,
  Radio,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { RifaAdmin, SorteioAdmin, SorteioPublico, Usuario } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatCpf, formatPhone } from '../utils/formatters';

interface PainelAdminProps {
  onClose: () => void;
  onSorteioExecutado?: (sorteio: SorteioPublico) => void;
}

export const PainelAdmin: React.FC<PainelAdminProps> = ({ onClose, onSorteioExecutado }) => {
  const [rifas, setRifas] = useState<RifaAdmin[]>([]);
  const [selectedRifa, setSelectedRifa] = useState<RifaAdmin | null>(null);
  const [participantesAptos, setParticipantesAptos] = useState<Usuario[]>([]);
  const [sorteioCompleto, setSorteioCompleto] = useState<SorteioAdmin | null>(null);

  // Formulário de Parametrização
  const [modoEscolhido, setModoEscolhido] = useState<'ALEATORIO' | 'DIRECIONADO'>('ALEATORIO');
  const [cpfAlvo, setCpfAlvo] = useState<string>('');

  // Formulário de Nova Rifa
  const [showCriarModal, setShowCriarModal] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoSubtitulo, setNovoSubtitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoPreco, setNovoPreco] = useState('0.50');
  const [novoTotalCotas, setNovoTotalCotas] = useState('10000');
  const [novaDataHora, setNovaDataHora] = useState('');
  const [novaImagemUrl, setNovaImagemUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar lista de rifas do Admin
  const carregarRifas = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.listarRifas();
      setRifas(data);
      if (data.length > 0 && !selectedRifa) {
        selecionarRifa(data[0]);
      } else if (selectedRifa) {
        const atualizada = data.find((r) => r.id === selectedRifa.id);
        if (atualizada) selecionarRifa(atualizada);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao carregar rifas no painel admin.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarRifas();
  }, []);

  const selecionarRifa = async (rifa: RifaAdmin) => {
    setSelectedRifa(rifa);
    setModoEscolhido(rifa.regraSorteioTipo);
    setCpfAlvo(rifa.cpfDirecionado || '');
    setStatusMsg(null);

    // Carrega participantes aptos
    try {
      const aptos = await api.admin.listarParticipantesAptos(rifa.id);
      setParticipantesAptos(aptos);
    } catch {
      setParticipantesAptos([]);
    }

    // Se já estiver encerrada, busca os dados completos irrestritos do sorteio
    if (rifa.status === 'ENCERRADA') {
      try {
        const dados = await api.admin.obterDadosCompletosSorteio(rifa.id);
        setSorteioCompleto(dados);
      } catch {
        setSorteioCompleto(null);
      }
    } else {
      setSorteioCompleto(null);
    }
  };

  // Salvar Regra de Sorteio (Livre vs Direcionado)
  const handleSalvarRegra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRifa) return;

    if (modoEscolhido === 'DIRECIONADO' && !cpfAlvo) {
      setStatusMsg({ type: 'error', text: 'Selecione ou digite o CPF do participante para o modo direcionado.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const atualizada = await api.admin.parametrizarSorteio(selectedRifa.id, {
        regraSorteioTipo: modoEscolhido,
        cpfDirecionado: modoEscolhido === 'DIRECIONADO' ? cpfAlvo : undefined,
      });

      setSelectedRifa(atualizada);
      setStatusMsg({
        type: 'success',
        text: `Regra de sorteio atualizada para: ${
          modoEscolhido === 'ALEATORIO' ? 'MODO LIVRE (ALEATÓRIO)' : `MODO DIRECIONADO (CPF: ${formatCpf(cpfAlvo)})`
        }`,
      });
      carregarRifas();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao salvar parametrização.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Disparar Sorteio Agora
  const handleSortearAgora = async () => {
    if (!selectedRifa) return;
    if (
      !window.confirm(
        `CONFIRMAÇÃO EXCLUSIVA DE ADMIN:\n\nDeseja disparar o sorteio AGORA para a rifa:\n"${selectedRifa.titulo}"?\n\nModo configurado: ${selectedRifa.regraSorteioTipo}`
      )
    ) {
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const resultado = await api.admin.sortearAgora(selectedRifa.id);
      setStatusMsg({
        type: 'success',
        text: `Sorteio concluído com sucesso! Número sorteado: ${resultado.numeroSorteado}`,
      });

      if (onSorteioExecutado) {
        onSorteioExecutado(resultado);
      }

      await carregarRifas();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao executar sorteio.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar Nova Rifa
  const handleCriarRifa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);

    try {
      await api.admin.criarRifa({
        titulo: novoTitulo,
        subtitulo: novoSubtitulo,
        descricao: novaDescricao,
        precoCota: parseFloat(novoPreco),
        totalCotas: parseInt(novoTotalCotas),
        dataHoraSorteio: novaDataHora,
        imagensUrls: novaImagemUrl ? [novaImagemUrl] : [],
      });

      setShowCriarModal(false);
      setNovoTitulo('');
      setNovoSubtitulo('');
      setNovaDescricao('');
      setNovaImagemUrl('');
      setStatusMsg({ type: 'success', text: 'Nova rifa criada com sucesso e publicada na vitrine!' });
      carregarRifas();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao criar nova rifa.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Painel Admin */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">PAINEL ADMINISTRATIVO</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                  ACESSO RESTRITO ROLE_ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Controle integral de sorteios, escolha de modo livre vs. direcionado por CPF e auditoria de ganhadores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCriarModal(true)}
              className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Rifa</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shrink-0 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Layout do Painel (2 Colunas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1 overflow-y-auto pr-1">
          {/* Coluna da Esquerda: Seletor de Rifas (4 colunas) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Selecione a Rifa para Gerenciar:
            </span>

            <div className="space-y-2">
              {rifas.map((r) => (
                <div
                  key={r.id}
                  onClick={() => selecionarRifa(r)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedRifa?.id === r.id
                      ? 'bg-slate-800 border-amber-500/80 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        r.status === 'ENCERRADA'
                          ? 'bg-slate-800 text-slate-400'
                          : r.status === 'AO_VIVO'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      Modo: {r.regraSorteioTipo}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white line-clamp-1">{r.titulo}</h4>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-mono">
                    <span>{r.cotasVendidas} / {r.totalCotas} cotas</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(r.totalArrecadado)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna da Direita: Painel de Controle da Rifa Selecionada (8 colunas) */}
          {selectedRifa && (
            <div className="lg:col-span-8 space-y-6">
              {/* Card Resumo e Botão "Sortear Agora" */}
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">{selectedRifa.titulo}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data do Sorteio: {formatDate(selectedRifa.dataHoraSorteio)} • Total Arrecadado:{' '}
                    <strong className="text-emerald-400 font-bold">
                      {formatCurrency(selectedRifa.totalArrecadado)}
                    </strong>
                  </p>
                </div>

                {/* BOTÃO EXCLUSIVO DE ADMIN: "SORTEAR AGORA" */}
                {selectedRifa.status !== 'ENCERRADA' ? (
                  <button
                    onClick={handleSortearAgora}
                    disabled={isLoading || selectedRifa.cotasVendidas === 0}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
                    title={
                      selectedRifa.cotasVendidas === 0
                        ? 'Nenhuma cota foi comprada ainda'
                        : 'Disparar sorteio agora seguindo a regra configurada'
                    }
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>SORTEAR AGORA (ADMIN)</span>
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                    Sorteio Já Realizado
                  </div>
                )}
              </div>

              {/* SEÇÃO 1: PARAMETRIZAÇÃO DO MODO DE SORTEIO */}
              {selectedRifa.status !== 'ENCERRADA' ? (
                <form
                  onSubmit={handleSalvarRegra}
                  className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Settings2 className="w-4 h-4" />
                    <span>Parametrização do Mecanismo de Sorteio</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Modo 1: Livre (Aleatório) */}
                    <div
                      onClick={() => setModoEscolhido('ALEATORIO')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        modoEscolhido === 'ALEATORIO'
                          ? 'bg-brand-500/10 border-brand-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-white">Modo Livre (Aleatório)</span>
                        <input
                          type="radio"
                          name="modo"
                          checked={modoEscolhido === 'ALEATORIO'}
                          onChange={() => setModoEscolhido('ALEATORIO')}
                          className="accent-brand-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        O sistema sorteia 100% aleatoriamente entre todas as cotas pagas no momento do sorteio.
                      </p>
                    </div>

                    {/* Modo 2: Direcionado (Controle Admin) */}
                    <div
                      onClick={() => setModoEscolhido('DIRECIONADO')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        modoEscolhido === 'DIRECIONADO'
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-white">Modo Direcionado (Admin)</span>
                        <input
                          type="radio"
                          name="modo"
                          checked={modoEscolhido === 'DIRECIONADO'}
                          onChange={() => setModoEscolhido('DIRECIONADO')}
                          className="accent-amber-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        O administrador pré-define qual CPF concorrente será o contemplado pelo sorteador.
                      </p>
                    </div>
                  </div>

                  {/* Seletor de Participante Alvo (quando DIRECIONADO) */}
                  {modoEscolhido === 'DIRECIONADO' && (
                    <div className="pt-2 border-t border-slate-800 space-y-3">
                      <label className="text-xs font-bold text-slate-300 block">
                        Escolha o Participante Alvo (com cotas pagas):
                      </label>

                      {participantesAptos.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={cpfAlvo}
                            onChange={(e) => setCpfAlvo(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Selecione um participante apto...</option>
                            {participantesAptos.map((p) => (
                              <option key={p.id} value={p.cpf}>
                                {p.nome} — CPF: {formatCpf(p.cpf)} ({formatPhone(p.telefone)})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                          Nenhum participante comprou cotas pagas nesta rifa ainda. Você também pode digitar o CPF manualmente:
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Ou digite o CPF: 000.000.000-00"
                          value={cpfAlvo}
                          onChange={(e) => setCpfAlvo(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <SaveIcon className="w-4 h-4 text-brand-400" />
                    <span>Salvar Parâmetros do Sorteio</span>
                  </button>
                </form>
              ) : (
                /* SEÇÃO 2: AUDITORIA IRRESTRITA DO GANHADOR (APENAS ROLE_ADMIN) */
                <div className="bg-slate-950 rounded-2xl p-6 border border-amber-500/50 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest">
                    <Trophy className="w-4 h-4" />
                    <span>Auditoria Completa do Ganhador (Visualização Irrestrita de Admin)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-900 p-4 rounded-2xl border border-slate-800 font-medium">
                    <div>
                      <span className="text-slate-400 block font-normal">Nome Completo:</span>
                      <strong className="text-base text-white block">
                        {sorteioCompleto?.nomeGanhador || selectedRifa.ganhadorCompleto?.nome || 'N/A'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-normal">Cota Sorteada:</span>
                      <strong className="text-base font-mono text-amber-400 block">
                        {sorteioCompleto?.numeroSorteado || selectedRifa.numeroSorteado}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-normal">CPF Completo (Irrestrito):</span>
                      <strong className="font-mono text-sm text-slate-200 block">
                        {sorteioCompleto?.cpfFormatado ||
                          formatCpf(sorteioCompleto?.cpfCompleto || '') ||
                          '000.000.000-00'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-normal">Telefone / WhatsApp Real:</span>
                      <strong className="font-mono text-sm text-slate-200 block">
                        {sorteioCompleto?.telefoneFormatado ||
                          formatPhone(sorteioCompleto?.telefoneCompleto || '') ||
                          '(XX) XXXXX-XXXX'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-normal">Data de Nascimento:</span>
                      <strong className="font-mono text-slate-300 block">
                        {sorteioCompleto?.dataNascimento || 'N/A'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-normal">Regra de Sorteio Utilizada:</span>
                      <strong className="text-slate-300 block">
                        {sorteioCompleto?.regraUtilizada || selectedRifa.regraSorteioTipo}
                      </strong>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block font-normal">Hash Criptográfico SHA-256:</span>
                      <span className="font-mono text-[11px] text-brand-400 break-all select-all">
                        {sorteioCompleto?.hashComprovante}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista dos Participantes Aptos */}
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-brand-400" />
                    <span>Participantes com Cotas Pagas ({participantesAptos.length})</span>
                  </div>
                </div>

                {participantesAptos.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Nenhum participante comprou cotas pagas nesta rifa até o momento.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {participantesAptos.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                      >
                        <div>
                          <strong className="text-slate-200 block">{p.nome}</strong>
                          <span className="text-[11px] font-mono text-slate-400">
                            CPF: {formatCpf(p.cpf)} • {formatPhone(p.telefone)}
                          </span>
                        </div>
                        {selectedRifa.status !== 'ENCERRADA' && (
                          <button
                            type="button"
                            onClick={() => {
                              setModoEscolhido('DIRECIONADO');
                              setCpfAlvo(p.cpf);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold text-[11px] transition-colors"
                          >
                            Definir Alvo
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL CRIAR NOVA RIFA */}
        {showCriarModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowCriarModal(false)}
          >
            <div
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCriarModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" />
                Criar Nova Ação / Rifa
              </h3>

              <form onSubmit={handleCriarRifa} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Título da Rifa:</label>
                  <input
                    type="text"
                    placeholder="Ex: Porsche 911 Carrera S 0km ou R$ 800.000 no PIX"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subtítulo / Chamada:</label>
                  <input
                    type="text"
                    placeholder="Ex: O maior prêmio da história da plataforma!"
                    value={novoSubtitulo}
                    onChange={(e) => setNovoSubtitulo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Descrição Vendedora:</label>
                  <textarea
                    rows={3}
                    placeholder="Detalhes completos do veículo ou premiação..."
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Preço da Cota (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.35"
                      value={novoPreco}
                      onChange={(e) => setNovoPreco(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Total de Cotas:</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="100000"
                      value={novoTotalCotas}
                      onChange={(e) => setNovoTotalCotas(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Data e Hora do Sorteio:</label>
                  <input
                    type="datetime-local"
                    value={novaDataHora}
                    onChange={(e) => setNovaDataHora(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">URL da Imagem em Alta Resolução:</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={novaImagemUrl}
                    onChange={(e) => setNovaImagemUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm transition-all"
                  >
                    {isLoading ? 'Salvando...' : 'CRIAR E PUBLICAR RIFA'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function SaveIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

