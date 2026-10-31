import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap, Radio, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Rifa } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HeroCarouselProps {
  rifas: Rifa[];
  onSelectRifa: (rifa: Rifa) => void;
  onOpenSorteioAoVivo: (rifa: Rifa) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  rifas,
  onSelectRifa,
  onOpenSorteioAoVivo,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filtrar apenas rifas ativas ou em destaque para o carrossel
  const items = rifas.length > 0 ? rifas : [];

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  // Suporte a swipe touch para celulares e tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getBadge = (status: string) => {
    switch (status) {
      case 'AO_VIVO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-wider animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            Sorteio Ao Vivo
          </span>
        );
      case 'EM_BREVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Em Breve
          </span>
        );
      case 'ENCERRADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-700/60 text-slate-300 border border-slate-600 uppercase tracking-wider">
            Encerrado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-brand-500/20 text-brand-400 border border-brand-500/40 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            Edição Especial Ativa
          </span>
        );
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <div
        className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl min-h-[460px] md:min-h-[500px] flex items-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Imagem de Fundo com Overlay Gradiente de Alto Contraste */}
        <div className="absolute inset-0 z-0">
          <img
            src={current.imagemPrincipal}
            alt={current.titulo}
            className="w-full h-full object-cover object-center filter brightness-[0.45] scale-105 transition-all duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f17] via-[#0b0f17]/80 to-transparent" />
        </div>

        {/* Conteúdo Imersivo */}
        <div className="relative z-10 w-full p-6 sm:p-10 md:p-14 max-w-3xl">
          {/* Badges de Status */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            {getBadge(current.status)}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700/80">
              <ShieldCheck className="w-3 h-3 text-brand-400" />
              Sorteio Oficial com Hash
            </span>
          </div>

          {/* Título Principal */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3 drop-shadow-md">
            {current.titulo}
          </h1>

          {/* Subtítulo / Descrição Vendedora */}
          <p className="text-slate-300 text-sm sm:text-base md:text-lg mb-6 line-clamp-2 sm:line-clamp-3 max-w-2xl font-normal leading-relaxed">
            {current.subtitulo || current.descricao}
          </p>

          {/* Preço e Barra de Progresso de Cotas */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 max-w-lg mb-6 shadow-xl">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Por apenas:
              </span>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatCurrency(current.precoCota)}
                </span>
                <span className="text-xs text-slate-400 block font-medium">por número/cota</span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-brand-600 via-emerald-500 to-amber-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${current.porcentagemVendida || 5}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium mt-1.5">
              <span>{current.porcentagemVendida}% cotas garantidas</span>
              <span>Restam {current.cotasDisponiveis.toLocaleString('pt-BR')} cotas</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3">
            {current.status !== 'ENCERRADA' ? (
              <button
                onClick={() => onSelectRifa(current)}
                className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-emerald-500 to-emerald-600 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-brand-500/25 flex items-center gap-2 transition-all transform active:scale-95 group"
              >
                <span>COMPRAR COTAS AGORA</span>
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => onOpenSorteioAoVivo(current)}
                className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm sm:text-base border border-slate-700 flex items-center gap-2 transition-all"
              >
                <span>VER RESULTADO DO SORTEIO</span>
              </button>
            )}

            {current.status === 'ATIVA' && (
              <button
                onClick={() => onOpenSorteioAoVivo(current)}
                className="px-5 py-3.5 sm:py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 font-bold text-sm sm:text-base border border-amber-500/30 flex items-center gap-2 backdrop-blur-sm transition-all"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Ver Sala do Sorteio</span>
              </button>
            )}
          </div>
        </div>

        {/* Setas de Navegação (Desktop) */}
        {items.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="hidden sm:flex absolute left-4 z-20 w-11 h-11 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white items-center justify-center border border-slate-700 backdrop-blur-sm transition-all"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="hidden sm:flex absolute right-4 z-20 w-11 h-11 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white items-center justify-center border border-slate-700 backdrop-blur-sm transition-all"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Indicadores de Slide */}
        {items.length > 1 && (
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-7 bg-brand-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
                aria-label={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

