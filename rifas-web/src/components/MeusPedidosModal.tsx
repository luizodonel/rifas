import React, { useState, useEffect } from 'react';
import { X, Ticket, CheckCircle2, Clock, QrCode, AlertCircle } from 'lucide-react';
import { Pedido } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface MeusPedidosModalProps {
  onClose: () => void;
  onOpenPagamento?: (pedido: Pedido) => void;
}

export const MeusPedidosModal: React.FC<MeusPedidosModalProps> = ({ onClose }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.pedidos
      .listarMeusPedidos()
      .then((data) => setPedidos(data))
      .catch((err) => console.error('Erro ao buscar pedidos:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-brand-400" />
            <h3 className="text-xl font-black text-white">Meus Bilhetes e Cotas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {isLoading ? (
            <p className="py-8 text-center text-slate-500 text-xs animate-pulse">
              Carregando seus bilhetes...
            </p>
          ) : pedidos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Você ainda não adquiriu nenhuma cota. Participe das edições ativas!
            </div>
          ) : (
            pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={pedido.rifaImagemPrincipal}
                      alt={pedido.rifaTitulo}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {pedido.rifaTitulo}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Pedido: {pedido.codigoPedido} • {formatDate(pedido.dataCompra)}
                      </span>
                    </div>
                  </div>

                  <div>
                    {pedido.statusPagamento === 'PAGO' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PAGO
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> PENDENTE
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">
                    Quantidade: <strong className="text-white">{pedido.quantidade} cotas</strong>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(pedido.valorTotal)}
                  </span>
                </div>

                {/* Números Gerados */}
                {pedido.numerosCotas && pedido.numerosCotas.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                      Seus Números da Sorte Concorrentes:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {pedido.numerosCotas.map((num, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-900 border border-brand-500/30 text-brand-400 rounded font-mono text-xs font-bold"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
