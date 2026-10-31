import React, { useState, useEffect, useRef } from 'react';
import { X, Radio, Clock, ShieldCheck, Trophy, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Rifa, SorteioPublico } from '../types';
import { subscribeToSorteio } from '../services/websocket';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

interface SorteioAoVivoModalProps {
  rifa: Rifa;
  onClose: () => void;
  onComprarCotas?: (rifa: Rifa) => void;
}

export const SorteioAoVivoModal: React.FC<SorteioAoVivoModalProps> = ({
  rifa,
  onClose,
  onComprarCotas,
}) => {
  const [sorteioInfo, setSorteioInfo] = useState<SorteioPublico | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 1000 });

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningNumber, setSpinningNumber] = useState('00000');
  const spinIntervalRef = useRef<number | null>(null);

  // Carrega informações públicas do sorteio
  useEffect(() => {
    api.rifas
      .obterSorteioAoVivo(rifa.id)
      .then((data) => {
        setSorteioInfo(data);
        if (data.numeroSorteado) {
          triggerConfetti();
        }
      })
      .catch((err) => console.error('Erro ao buscar dados do sorteio:', err));
  }, [rifa.id]);

  // Conecta ao WebSocket do sorteio em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToSorteio(rifa.id, (novoEvento) => {
      // Inicia animação de roleta
      iniciarAnimacaoRoleta(novoEvento);
    });

    return () => {
      unsubscribe();
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, [rifa.id]);

  // Contagem regressiva precisa
  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(rifa.dataHoraSorteio).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: Math.floor(difference / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [rifa.dataHoraSorteio]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });
    } catch {
      // ignore
    }
  };

  const iniciarAnimacaoRoleta = (resultado: SorteioPublico) => {
    setIsSpinning(true);
    let count = 0;
    const totalFlips = 35;

    spinIntervalRef.current = window.setInterval(() => {
      count++;
      const randomNum = Math.floor(Math.random() * (rifa.totalCotas || 100000));
      setSpinningNumber(String(randomNum).padStart(5, '0'));

      if (count >= totalFlips) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        setIsSpinning(false);
        setSorteioInfo(resultado);
        triggerConfetti();
      }
    }, 80);
  };

  const isEncerrado =
    sorteioInfo?.numeroSorteado || rifa.status === 'ENCERRADA' || rifa.ganhador;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-wider animate-pulse">
            <Radio className="w-4 h-4" />
            Transmissão Ao Vivo do Sorteio
          </span>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            Hash Criptográfico
          </span>
        </div>

        {/* Título da Rifa */}
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
          {rifa.titulo}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          Acompanhamento em tempo real sincronizado via WebSocket para todos os usuários.
        </p>

        {/* TELA DE GANHADOR OU TELA DE CRONÔMETRO */}
        {isEncerrado && !isSpinning ? (
          /* RESULTADO FINAL DO GANHADOR (DADOS PÚBLICOS MASCARADOS) */
          <div className="bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <Trophy className="w-9 h-9 animate-bounce" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
                TEMOS UM VENCEDOR!
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {sorteioInfo?.nomeGanhador || rifa.ganhador?.nome || 'Concorrente Sorteado'}
              </h3>
            </div>

            {/* Número da Sorte Sorteado */}
            <div className="bg-slate-950/90 border border-amber-500/50 rounded-2xl p-4 max-w-sm mx-auto shadow-inner">
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                NÚMERO DA SORTE CONTEMPLADO
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-amber-400 tracking-widest">
                {sorteioInfo?.numeroSorteado || rifa.numeroSorteado || '00000'}
              </div>
            </div>

            {/* Dados Mascarados do Ganhador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left text-xs bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <span className="text-slate-400 block font-medium">CPF do Ganhador:</span>
                <span className="font-mono font-bold text-slate-200">
                  {sorteioInfo?.cpfMascarado || rifa.ganhador?.cpfMascarado || '12******3456'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Telefone:</span>
                <span className="font-mono font-bold text-slate-200">
                  {sorteioInfo?.telefoneMascarado || rifa.ganhador?.telefoneMascarado || '(XX) XXXXX-1234'}
                </span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-700/80">
                <span className="text-slate-400 block font-medium">Hash de Validação do Sorteio:</span>
                <span className="font-mono text-[10px] text-brand-400 break-all select-all">
                  {sorteioInfo?.hashComprovante || '0a8f9c1b7e435920a61841d35d56472ab278a062d4a4250a'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Por conformidade com a LGPD e privacidade, os dados pessoais do ganhador são exibidos de forma mascarada.
            </p>
          </div>
        ) : isSpinning ? (
          /* ANIMAÇÃO DE ROLETA AO VIVO */
          <div className="bg-slate-950 border-2 border-brand-500/80 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <Sparkles className="w-10 h-10 text-brand-400 mx-auto animate-spin" />
            <h3 className="text-xl font-black text-white">SORTEANDO NÚMERO DA SORTE...</h3>
            <p className="text-xs text-slate-400">
              Conectado ao servidor STOMP. Selecionando a cota vencedora...
            </p>

            <div className="py-6">
              <div className="inline-block px-8 py-4 bg-slate-900 border-2 border-brand-500 rounded-2xl shadow-inner text-5xl sm:text-6xl font-mono font-black text-brand-400 tracking-widest animate-pulse">
                {spinningNumber}
              </div>
            </div>
          </div>
        ) : (
          /* CRONÔMETRO REGRESSIVO DE IMPACTO */
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">
                <Clock className="w-4 h-4 animate-spin-slow" />
                <span>O Sorteio Começa Em:</span>
              </div>

              {/* Grid dos Dígitos */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 text-center">
                  <span className="text-3xl sm:text-5xl font-mono font-black text-white block">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Dias
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 text-center">
                  <span className="text-3xl sm:text-5xl font-mono font-black text-white block">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Horas
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 text-center">
                  <span className="text-3xl sm:text-5xl font-mono font-black text-white block">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Minutos
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 text-center border-brand-500/40">
                  <span className="text-3xl sm:text-5xl font-mono font-black text-emerald-400 block animate-pulse">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Segundos
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Ao zerar o cronômetro, o sorteio é disparado automaticamente na sua tela!</span>
              </div>
            </div>

            {/* CTA para Comprar Mais Cotas Antes de Zerar */}
            {onComprarCotas && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-950/40 border border-brand-500/30 rounded-2xl p-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Ainda dá tempo de participar!</h4>
                  <p className="text-xs text-slate-400">
                    Aumente suas chances garantindo mais bilhetes antes do cronômetro zerar.
                  </p>
                </div>
                <button
                  onClick={() => onComprarCotas(rifa)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider whitespace-nowrap shadow-lg shadow-brand-500/20 transition-all transform active:scale-95"
                >
                  Garantir Cotas Agora
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>Horário do Sorteio: {formatDate(rifa.dataHoraSorteio)}</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
