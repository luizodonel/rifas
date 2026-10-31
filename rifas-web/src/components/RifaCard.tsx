import React from 'react';
import { Clock, Ticket, Sparkles, Radio } from 'lucide-react';
import { Rifa } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface RifaCardProps {
  rifa: Rifa;
  onSelect: (rifa: Rifa) => void;
  onOpenSorteio: (rifa: Rifa) => void;
}

export const RifaCard: React.FC<RifaCardProps> = ({ rifa, onSelect, onOpenSorteio }) => {
  const isEncerrada = rifa.status === 'ENCERRADA';
  const isAoVivo = rifa.status === 'AO_VIVO';
  const isEmBreve = rifa.status === 'EM_BREVE';

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 group">
      {/* Imagem com Badges Flutuantes */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
        <img
          src={rifa.imagemPrincipal}
          alt={rifa.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        {/* Badge de Status no Topo */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isAoVivo && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-lg flex items-center gap-1 animate-pulse">
              <Radio className="w-3 h-3" /> AO VIVO
            </span>
          )}
          {isEmBreve && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 shadow-lg">
              EM BREVE
            </span>
          )}
          {isEncerrada && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-800 text-slate-300 border border-slate-700 shadow-lg">
              ENCERRADO
            </span>
          )}
          {!isEncerrada && !isAoVivo && !isEmBreve && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-slate-950 shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> DISPONÍVEL
            </span>
          )}
        </div>

        {/* Preço em Destaque no Canto Inferior da Imagem */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
          <span className="text-[10px] text-slate-400 block font-semibold leading-none">POR APENAS</span>
          <span className="text-lg font-black text-emerald-400 leading-tight">
            {formatCurrency(rifa.precoCota)}
          </span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-brand-400 transition-colors">
            {rifa.titulo}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mb-4">
            {rifa.subtitulo || rifa.descricao}
          </p>

          {/* Data do Sorteio */}
          <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Sorteio: {formatDate(rifa.dataHoraSorteio)}</span>
          </div>

          {/* Barra de Progresso de Cotas */}
          {!isEncerrada && (
            <div className="space-y-1.5 mb-4">
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-brand-600 to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${rifa.porcentagemVendida || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>{rifa.porcentagemVendida}% vendido</span>
                <span>Restam {rifa.cotasDisponiveis.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          )}

          {/* Ganhador (se encerrada) */}
          {isEncerrada && rifa.ganhador && (
            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 mb-4 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 font-semibold">Ganhador:</span>
                <span className="font-bold text-amber-400">{rifa.ganhador.nome}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Cota Sorteada:</span>
                <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {rifa.ganhador.numeroSorteado || rifa.numeroSorteado}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Botão de Ação */}
        <div className="pt-2">
          {!isEncerrada ? (
            <button
              onClick={() => onSelect(rifa)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Ticket className="w-4 h-4 text-slate-950" />
              <span>COMPRAR COTAS</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenSorteio(rifa)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-colors"
            >
              Ver Detalhes do Sorteio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
