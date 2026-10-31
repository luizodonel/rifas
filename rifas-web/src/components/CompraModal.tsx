import React, { useState } from 'react';
import {
  X,
  Ticket,
  QrCode,
  Copy,
  Check,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  User as UserIcon,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Pedido, Rifa, Usuario } from '../types';
import { api, setSavedUser, setToken } from '../services/api';
import { formatCurrency, formatCpf, formatPhone, cleanDigits } from '../utils/formatters';

interface CompraModalProps {
  rifa: Rifa;
  currentUser: Usuario | null;
  onClose: () => void;
  onUserAuthenticated: (user: Usuario) => void;
}

type Step = 'QUANTIDADE' | 'IDENTIFICACAO_CPF' | 'LOGIN_SENHA' | 'CADASTRO_COMPLETO' | 'PAGAMENTO_PIX' | 'SUCESSO_COTAS';

export const CompraModal: React.FC<CompraModalProps> = ({
  rifa,
  currentUser,
  onClose,
  onUserAuthenticated,
}) => {
  const [step, setStep] = useState<Step>(currentUser ? 'QUANTIDADE' : 'QUANTIDADE');
  const [quantidade, setQuantidade] = useState<number>(10);
  const [cpfInput, setCpfInput] = useState<string>('');
  const [senhaInput, setSenhaInput] = useState<string>('');
  const [userNomeExistente, setUserNomeExistente] = useState<string>('');

  // Formulário de Cadastro Novo
  const [nomeInput, setNomeInput] = useState<string>('');
  const [nascimentoInput, setNascimentoInput] = useState<string>('');
  const [telefoneInput, setTelefoneInput] = useState<string>('');
  const [confirmaSenhaInput, setConfirmaSenhaInput] = useState<string>('');

  // Estado do Pedido e Pagamento
  const [pedidoGerado, setPedidoGerado] = useState<Pedido | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const valorTotal = rifa.precoCota * quantidade;

  // Pacotes Rápidos de Cotas (+10, +25, +50, +100, +200)
  const quickQuantities = [5, 10, 25, 50, 100];

  // 1. Ao clicar em Prosseguir na seleção de quantidade
  const handleProsseguirQuantidade = () => {
    if (quantidade < 1) {
      setErrorMsg('Escolha ao menos 1 cota para participar.');
      return;
    }
    setErrorMsg(null);

    if (currentUser) {
      gerarPedido(currentUser);
    } else {
      setStep('IDENTIFICACAO_CPF');
    }
  };

  // 2. Consulta CPF no backend
  const handleConsultarCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanDigits(cpfInput);
    if (clean.length !== 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.auth.checkCpf(clean);
      if (res.cadastrado) {
        setUserNomeExistente(res.nome || 'Concorrente');
        setStep('LOGIN_SENHA');
      } else {
        setStep('CADASTRO_COMPLETO');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao consultar CPF.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Login do Usuário Já Cadastrado
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaInput) {
      setErrorMsg('Digite sua senha para continuar.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.auth.login(cleanDigits(cpfInput), senhaInput);
      setToken(res.token);
      setSavedUser(res.usuario);
      onUserAuthenticated(res.usuario);
      gerarPedido(res.usuario);
    } catch (err: any) {
      setErrorMsg(err.message || 'Senha incorreta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Cadastro de Novo Usuário (com CPF fixado e bloqueado)
  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeInput.trim()) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    if (!nascimentoInput) {
      setErrorMsg('Informe sua data de nascimento.');
      return;
    }
    if (cleanDigits(telefoneInput).length < 10) {
      setErrorMsg('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }
    if (senhaInput.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 dígitos.');
      return;
    }
    if (senhaInput !== confirmaSenhaInput) {
      setErrorMsg('A confirmação da senha não confere.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.auth.register({
        cpf: cleanDigits(cpfInput),
        nome: nomeInput.trim(),
        dataNascimento: nascimentoInput,
        telefone: cleanDigits(telefoneInput),
        senha: senhaInput,
      });

      setToken(res.token);
      setSavedUser(res.usuario);
      onUserAuthenticated(res.usuario);
      gerarPedido(res.usuario);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Geração do Pedido PIX
  const gerarPedido = async (_user: Usuario) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const pedido = await api.pedidos.comprar(rifa.id, quantidade);
      setPedidoGerado(pedido);
      setStep('PAGAMENTO_PIX');
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível gerar o pedido de compra.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Simular Pagamento Instantâneo (para testes e aprovação imediata)
  const handleSimularPagamento = async () => {
    if (!pedidoGerado) return;
    setIsLoading(true);

    try {
      const pago = await api.pedidos.simularPagamento(pedidoGerado.id);
      setPedidoGerado(pago);
      setStep('SUCESSO_COTAS');

      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24'],
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao simular pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pedidoGerado?.chavePixCopiaCola) return;
    navigator.clipboard.writeText(pedidoGerado.chavePixCopiaCola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Resumo do Produto no Topo */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
          <img
            src={rifa.imagemPrincipal}
            alt={rifa.titulo}
            className="w-16 h-16 rounded-2xl object-cover bg-slate-800 shrink-0 border border-slate-700"
          />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Comprar Cotas Oficiais
            </span>
            <h3 className="text-base font-bold text-white line-clamp-1 leading-snug">
              {rifa.titulo}
            </h3>
            <span className="text-xs text-slate-400">
              Valor por cota: <strong className="text-white">{formatCurrency(rifa.precoCota)}</strong>
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* --- PASSO 1: ESCOLHA DE QUANTIDADE --- */}
        {step === 'QUANTIDADE' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                1. Selecione a quantidade de números:
              </label>

              {/* Botões Rápidos */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {quickQuantities.map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidade(qtd)}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                      quantidade === qtd
                        ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/30 scale-105'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    +{qtd}
                  </button>
                ))}
              </div>

              {/* Seletor com Botões + e - */}
              <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuantidade((prev) => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={rifa.cotasDisponiveis || 100000}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent text-center text-xl font-black text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantidade((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Resumo do Valor */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total a pagar:</span>
                <span className="text-2xl font-black text-emerald-400">
                  {formatCurrency(valorTotal)}
                </span>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>{quantidade} {quantidade === 1 ? 'cota' : 'cotas'} selecionadas</span>
              </div>
            </div>

            <button
              onClick={handleProsseguirQuantidade}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <span>CONTINUAR PARA PAGAMENTO</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* --- PASSO 2: IDENTIFICAÇÃO POR CPF --- */}
        {step === 'IDENTIFICACAO_CPF' && (
          <form onSubmit={handleConsultarCpf} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Identificação Segura</span>
              </div>
              <h4 className="text-lg font-black text-white mb-1">Informe seu CPF</h4>
              <p className="text-xs text-slate-400 mb-4">
                Seus bilhetes premiados serão vinculados diretamente ao seu CPF para garantia do prêmio.
              </p>

              <div className="relative">
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={formatCpf(cpfInput)}
                  onChange={(e) => setCpfInput(cleanDigits(e.target.value))}
                  maxLength={14}
                  autoFocus
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || cleanDigits(cpfInput).length !== 11}
              className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-black text-base shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <span>{isLoading ? 'Verificando...' : 'AVANÇAR'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setStep('QUANTIDADE')}
              className="w-full text-xs text-slate-500 hover:text-slate-300"
            >
              Voltar e alterar quantidade
            </button>
          </form>
        )}

        {/* --- PASSO 2A: LOGIN COM SENHA (SE JÁ CADASTRADO) --- */}
        {step === 'LOGIN_SENHA' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                Bem-vindo de volta!
              </span>
              <h4 className="text-lg font-black text-white mb-1">
                Olá, {userNomeExistente}!
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                CPF: <strong className="font-mono text-slate-300">{formatCpf(cpfInput)}</strong>. Digite sua senha cadastrada:
              </p>

              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  placeholder="Sua senha de acesso"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-base shadow-lg transition-all"
            >
              {isLoading ? 'Autenticando...' : 'ENTRAR E PAGAR'}
            </button>

            <button
              type="button"
              onClick={() => setStep('IDENTIFICACAO_CPF')}
              className="w-full text-xs text-slate-500 hover:text-slate-300"
            >
              Trocar CPF informado
            </button>
          </form>
        )}

        {/* --- PASSO 2B: FORMULÁRIO DE CADASTRO NOVO (CPF BLOQUEADO) --- */}
        {step === 'CADASTRO_COMPLETO' && (
          <form onSubmit={handleCadastrar} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                Novo Concorrente
              </span>
              <h4 className="text-base font-black text-white">Complete seu cadastro rápido</h4>
              <p className="text-xs text-slate-400 mb-3">
                Preencha os dados oficiais para emissão dos bilhetes e validação de prêmios.
              </p>
            </div>

            {/* CPF Bloqueado e Imutável */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                CPF (bloqueado para segurança):
              </label>
              <input
                type="text"
                disabled
                value={formatCpf(cpfInput)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-sm text-slate-300 cursor-not-allowed"
              />
            </div>

            {/* Nome Completo */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Nome Completo:</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo da Silva"
                  value={nomeInput}
                  onChange={(e) => setNomeInput(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Data de Nascimento e Telefone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Nascimento:</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="date"
                    value={nascimentoInput}
                    onChange={(e) => setNascimentoInput(e.target.value)}
                    required
                    className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">WhatsApp / Tel:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="(XX) XXXXX-XXXX"
                    value={formatPhone(telefoneInput)}
                    onChange={(e) => setTelefoneInput(cleanDigits(e.target.value))}
                    maxLength={15}
                    required
                    className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Senha e Confirmação */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Crie sua Senha:</label>
                <input
                  type="password"
                  placeholder="Mín. 6 dígitos"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Confirme a Senha:</label>
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmaSenhaInput}
                  onChange={(e) => setConfirmaSenhaInput(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm shadow-lg transition-all"
            >
              {isLoading ? 'Cadastrando...' : 'CONCLUIR CADASTRO E PAGAR'}
            </button>
          </form>
        )}

        {/* --- PASSO 3: PAGAMENTO PIX DINÂMICO --- */}
        {step === 'PAGAMENTO_PIX' && pedidoGerado && (
          <div className="space-y-5 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-brand-500/20 text-brand-400 border border-brand-500/40">
              <QrCode className="w-4 h-4" />
              PAGAMENTO INSTANTÂNEO VIA PIX
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Valor do Pedido:</span>
              <span className="text-3xl font-black text-emerald-400">
                {formatCurrency(pedidoGerado.valorTotal)}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                Quantidade: <strong className="text-white">{pedidoGerado.quantidade} cotas</strong>
              </span>
            </div>

            {/* Imagem do QR Code Dinâmico */}
            <div className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-center">
              <img
                src={pedidoGerado.qrCodePix}
                alt="QR Code Pix"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Código Pix Copia e Cola */}
            <div>
              <button
                type="button"
                onClick={handleCopyPix}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-black">CÓDIGO PIX COPIADO!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-brand-400" />
                    <span>COPIAR CÓDIGO PIX (COPIA E COLA)</span>
                  </>
                )}
              </button>
            </div>

            {/* Botão de Simulação Instantânea */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSimularPagamento}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simular Aprovação Instantânea de Pix</span>
              </button>
              <span className="text-[10px] text-slate-500 block mt-1.5">
                * Para teste imediato da plataforma e liberação dos números da sorte em tempo real.
              </span>
            </div>
          </div>
        )}

        {/* --- PASSO 4: SUCESSO E EXIBIÇÃO DAS COTAS GERADAS --- */}
        {step === 'SUCESSO_COTAS' && pedidoGerado && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                PAGAMENTO CONFIRMADO COM SUCESSO!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                Seus Números da Sorte Foram Gerados
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Você já está concorrendo ao prêmio oficial. Boa sorte!
              </p>
            </div>

            {/* Lista dos Números */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {pedidoGerado.numerosCotas?.map((num, i) => (
                  <span
                    key={i}
                    className="py-1.5 px-2 bg-slate-900 border border-brand-500/40 rounded-lg font-mono font-bold text-xs text-brand-400 text-center shadow-sm"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm transition-all"
              >
                FECHAR E ACOMPANHAR SORTEIO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
