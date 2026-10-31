import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';
import { HistoricoSorteio } from '../types';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

export const HistoricoSorteios: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoSorteio[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.rifas
      .listarHistorico()
      .then((data) => setHistorico(data))
      .catch((err) => console.error('Erro ao carregar histórico:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  return (
    <section id="historico" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4" />
            <span>Transparência e Auditabilidade Pública</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Últimos 10 Sorteios Realizados
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2 sm:mt-0">
          Resultados oficiais com hash criptográfico registrado e proteção integral de dados segundo a LGPD.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500 font-medium animate-pulse">
          Carregando histórico oficial de ganhadores...
        </div>
      ) : historico.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
          Nenhum sorteio foi encerrado ainda. Seja o primeiro ganhador das nossas edições ativas!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {historico.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 hover:border-slate-700 transition-all flex flex-col sm:flex-row gap-5 shadow-lg group"
            >
              {/* Imagem do Prêmio */}
              <div className="sm:w-36 h-36 rounded-2xl overflow-hidden bg-slate-800 shrink-0 relative">
                <img
                  src={item.rifaImagem}
                  alt={item.rifaTitulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700 text-[10px] font-bold text-amber-400">
                  ENTREGUE
                </div>
              </div>

              {/* Informações do Ganhador */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white line-clamp-1 mb-1">
                    {item.rifaTitulo}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-400">
                      Sorteado em: {formatDate(item.dataHoraExecucao)}
                    </span>
                  </div>

                  {/* Detalhes do Ganhador Mascarado */}
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Ganhador:</span>
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                        {item.nomeGanhador}
                      </span>
                    </div>

                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-400">CPF Mascarado:</span>
                      <span className="text-slate-300 font-semibold">{item.cpfMascarado}</span>
                    </div>

                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-400">WhatsApp / Tel:</span>
                      <span className="text-slate-300 font-semibold">{item.telefoneMascarado}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Cota da Sorte:</span>
                      <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {item.numeroSorteado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comprovante Criptográfico */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                    Hash Oficial: {item.hashComprovante.slice(0, 10)}...
                  </span>

                  <button
                    onClick={() => handleCopyHash(item.hashComprovante)}
                    className="p-1 hover:text-white transition-colors flex items-center gap-1"
                    title="Copiar hash de validação completo"
                  >
                    {copiedHash === item.hashComprovante ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-brand-400" />
                        <span className="text-[10px] text-brand-400 font-semibold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
