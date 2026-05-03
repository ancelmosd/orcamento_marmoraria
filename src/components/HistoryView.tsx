import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, FileDown, MessageCircle, 
  Settings, X, Info, Layers, Construction, Camera,
  Briefcase, FileText, ListChecks, Banknote, ClipboardList, FileDigit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeSearchText } from '../utils/helpers';
import { PhotoGallery } from './PhotoGallery';

interface HistoryViewProps {
  searchTerm: string;
  onEdit: (id: number, origin: string) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  generateQuotePDF: (quote: any, type?: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  searchTerm, 
  onEdit, 
  showToast,
  generateQuotePDF 
}) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteDetails, setSelectedQuoteDetails] = useState<any | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<number | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState<any | null>(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const data = await res.json();
        setQuotes(Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()) : []);
      }
    } catch (error) {
      showToast("Erro ao carregar histórico.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);


  const filteredQuotes = (quotes || []).filter((quote) => 
    [
      (quote.id || '').toString(),
      quote.client_name || '',
      quote.project_name || '',
      quote.status || '',
      (quote.total_value || 0).toString(),
      quote.created_at || ''
    ].some((value) => normalizeSearchText(value).includes(normalizeSearchText(searchTerm)))
  );

  const exportOptions = [
    { id: 'comercial', label: 'Proposta Comercial', icon: Briefcase, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { id: 'orcamento', label: 'Orçamento', icon: FileText, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
    { id: 'produtos', label: 'Lista de Produtos', icon: ListChecks, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    { id: 'financeiro', label: 'Resumo Financeiro', icon: Banknote, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
    { id: 'os', label: 'Ordem de Serviço', icon: ClipboardList, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
    { id: 'recibo', label: 'Recibo', icon: FileDigit, color: 'text-pink-400', bgColor: 'bg-pink-400/10' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'text-orange-500 bg-orange-500/10';
      case 'Aprovado': return 'text-emerald-500 bg-emerald-500/10';
      case 'Em Produção': return 'text-yellow-400 bg-yellow-400/10';
      case 'Entregue': return 'text-indigo-500 bg-indigo-500/10';
      case 'Cancelado': return 'text-red-500 bg-red-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Orçamento excluído.");
        setQuoteToDelete(null);
        fetchQuotes();
      }
    } catch (error) {
      showToast("Erro de conexão.", "error");
    }
  };

  const fetchQuoteDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/quotes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedQuoteDetails(data);
      } else {
        showToast("Erro ao carregar detalhes.", "error");
      }
    } catch (error) {
      showToast("Erro de conexão.", "error");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchQuotes();
        showToast(`Status atualizado para ${status}`);
      }
    } catch (error) {
      showToast("Erro ao atualizar status.", "error");
    }
  };

  const updateDeliveryDate = async (id: number, date: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_date: date })
      });
      if (res.ok) {
        fetchQuotes();
        showToast(`Data de entrega atualizada!`);
      }
    } catch (error) {
      showToast("Erro ao atualizar data.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider">Gestão de Pedidos</p>
          <h1 className="text-4xl font-black tracking-tight">Histórico</h1>
        </div>
      </div>

      {/* Grid view for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:hidden">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Carregando...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">Nenhum orçamento encontrado.</div>
        ) : (
          filteredQuotes.map((quote) => (
            <div key={quote.id} className="bg-secondary-dark rounded-xl border border-border-dark p-4 space-y-4 cursor-pointer" onClick={() => fetchQuoteDetails(quote.id)}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 mb-1">#{quote.id}</p>
                  <h3 className="font-bold text-white leading-tight">{quote.client_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{quote.project_name}</p>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${getStatusColor(quote.status || '')}`} onClick={(e) => e.stopPropagation()}>
                  <select
                    value={quote.status || 'Pendente'}
                    onChange={(e) => updateStatus(quote.id, e.target.value)}
                    className="bg-transparent border-none text-current outline-none cursor-pointer font-bold uppercase"
                  >
                    <option value="Pendente" className="text-black">Pendente</option>
                    <option value="Aprovado" className="text-black">Aprovado</option>
                    <option value="Em Produção" className="text-black">Em Produção</option>
                    <option value="Entregue" className="text-black">Entregue</option>
                    <option value="Cancelado" className="text-black">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Valor</p>
                  <p className="text-lg font-black text-primary">R$ {(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right" onClick={e => e.stopPropagation()}>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Entrega</p>
                  <input 
                    type="date"
                    value={quote.delivery_date || ''}
                    onChange={(e) => updateDeliveryDate(quote.id, e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-slate-300 outline-none p-0 text-right w-24"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(quote.id, quote.origin || 'standard');
                  }}
                  className="flex-1 py-2 bg-white/5 text-primary rounded-lg border border-border-dark flex items-center justify-center gap-2 text-[10px] font-bold uppercase"
                >
                  <Settings size={14} /> Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGalleryId(quote.id);
                  }}
                  className="flex-1 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20 flex items-center justify-center gap-2 text-[10px] font-bold uppercase"
                >
                  <Camera size={14} /> Fotos
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await fetch(`/api/quotes/${quote.id}`);
                      if (res.ok) {
                        const fullQuote = await res.json();
                        setShowExportModal(fullQuote);
                      }
                    } catch (err) {
                      showToast("Erro ao carregar dados.", "error");
                    }
                  }}
                  className="flex-1 py-2 bg-white/5 text-emerald-400 rounded-lg border border-border-dark flex items-center justify-center gap-2 text-[10px] font-bold uppercase"
                >
                  <FileDown size={14} /> PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const phone = (quote.clients?.phone || '').replace(/\D/g, '');
                    const message = encodeURIComponent(`Olá ${quote.client_name || ''}! Aqui está o resumo do seu orçamento:\n\n*Projeto:* ${quote.project_name || ''}\n*Valor:* R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n*Status:* ${quote.status || ''}\n\nFicamos à disposição!`);
                    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                  }}
                  className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-2 text-[10px] font-bold uppercase"
                >
                  <MessageCircle size={14} /> Zap
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuoteToDelete(quote.id);
                  }}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block bg-secondary-dark rounded-xl border border-border-dark overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-border-dark bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Projeto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Valor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data Entrega</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Carregando orçamentos...</td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Nenhum orçamento encontrado.</td>
              </tr>
            ) : filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Nenhum orçamento encontrado para essa busca.</td>
              </tr>
            ) : (
              filteredQuotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => fetchQuoteDetails(quote.id)}
                >
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">#{quote.id}</td>
                  <td className="px-6 py-4 text-sm font-bold">{quote.client_name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{quote.project_name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {quote.created_at ? new Date(quote.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">
                    R$ {(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase transition-colors ${getStatusColor(quote.status || '')}`}>
                      <select
                        value={quote.status || 'Pendente'}
                        onChange={(e) => updateStatus(quote.id, e.target.value)}
                        className="bg-transparent border-none text-current outline-none cursor-pointer font-bold uppercase"
                      >
                        <option value="Pendente" className="text-black">Pendente</option>
                        <option value="Aprovado" className="text-black">Aprovado</option>
                        <option value="Em Produção" className="text-black">Em Produção</option>
                        <option value="Entregue" className="text-black">Entregue</option>
                        <option value="Cancelado" className="text-black">Cancelado</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-300" onClick={e => e.stopPropagation()}>
                    <input 
                      type="date"
                      value={quote.delivery_date || ''}
                      onChange={(e) => updateDeliveryDate(quote.id, e.target.value)}
                      className="bg-transparent border-none text-current outline-none p-0 w-full"
                    />
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(quote.id, quote.origin || 'standard');
                        }}
                        className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors text-primary"
                        title="Editar Orçamento"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGalleryId(quote.id);
                        }}
                        className="p-1.5 bg-primary/10 rounded-md hover:bg-primary hover:text-white transition-colors text-primary"
                        title="Ver Detalhes e Fotos"
                      >
                        <Camera size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const phone = (quote.clients?.phone || '').replace(/\D/g, '');
                          const message = encodeURIComponent(`Olá ${quote.client_name || ''}! Aqui está o resumo do seu orçamento:\n\n*Projeto:* ${quote.project_name || ''}\n*Valor:* R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n*Status:* ${quote.status || ''}\n\nFicamos à disposição!`);
                          window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                        }}
                        className="p-1.5 bg-white/5 rounded-md hover:bg-emerald-500 hover:text-white transition-colors text-emerald-400"
                        title="Enviar via WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`/api/quotes/${quote.id}`);
                            if (res.ok) {
                              const fullQuote = await res.json();
                              setShowExportModal(fullQuote);
                            }
                          } catch (err) {
                            showToast("Erro ao carregar dados para exportação.", "error");
                          }
                        }}
                        className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors text-emerald-400"
                        title="Exportar Documento"
                      >
                        <FileDown size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuoteToDelete(quote.id);
                        }}
                        className="p-1.5 bg-red-500/10 rounded-md hover:bg-red-500 hover:text-white transition-colors text-red-400 border border-red-500/20"
                        title="Excluir"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedGalleryId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedGalleryId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary-dark border border-border-dark rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Galeria de Fotos</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">
                      Visualizando fotos do projeto #{selectedGalleryId}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button
                    onClick={() => {
                      fetchQuoteDetails(selectedGalleryId);
                      setSelectedGalleryId(null);
                    }}
                    className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <Info size={16} /> Ver Detalhes
                  </button>
                  <button
                    onClick={() => setSelectedGalleryId(null)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <PhotoGallery quoteId={selectedGalleryId} showToast={showToast} />
              </div>

              <div className="p-6 bg-white/5 border-t border-border-dark flex justify-end">
                <button
                  onClick={() => setSelectedGalleryId(null)}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors text-white"
                >
                  Fechar Galeria
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quoteToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQuoteToDelete(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary-dark border border-border-dark rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 text-red-400 mb-4">
                <div className="bg-red-400/10 p-3 rounded-xl">
                  <X size={24} />
                </div>
                <h3 className="text-xl font-bold">Excluir Orçamento?</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setQuoteToDelete(null)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(quoteToDelete)}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedQuoteDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedQuoteDetails(null)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary-dark border border-border-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center bg-white/5">
                <div>
                  <h3 className="text-xl font-bold">Detalhes do Orçamento #{selectedQuoteDetails.id}</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">
                    {selectedQuoteDetails.client_name || 'N/A'} • {selectedQuoteDetails.project_name || 'Projeto'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedQuoteDetails(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Layers size={18} />
                    <h4 className="font-bold uppercase text-xs tracking-widest">Peças e Materiais</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(selectedQuoteDetails.items || []).map((item: any) => (
                      <div key={item.id} className="bg-background-dark/50 border border-border-dark rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{item.description || 'Peça sem descrição'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-500">
                              {item.width || 0} x {item.length || 0} mm
                            </span>
                            <span className="text-slate-700">•</span>
                            <span className="text-[10px] font-bold text-primary uppercase">
                              Qtd: {item.quantity || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400">{(item.subtotal_m2 || 0).toFixed(3)} m²</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Construction size={18} />
                    <h4 className="font-bold uppercase text-xs tracking-widest">Serviços e Acabamentos</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(selectedQuoteDetails.services || []).map((service: any) => (
                      <div key={service.id} className="bg-background-dark/50 border border-border-dark rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{service.description || 'Serviço sem descrição'}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Qtd: {(service.quantity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Un: R$ {(service.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">R$ {((service.quantity || 0) * (service.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border-dark flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data de Criação</p>
                    <p className="text-sm font-bold">{selectedQuoteDetails.created_at ? new Date(selectedQuoteDetails.created_at).toLocaleString('pt-BR') : '-'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor Total</p>
                    <p className="text-3xl font-black text-primary">R$ {(selectedQuoteDetails.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Galeria de Fotos */}
                <div className="pt-8 border-t border-border-dark">
                  <PhotoGallery quoteId={selectedQuoteDetails.id} showToast={showToast} />
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-border-dark flex gap-3">
                <button
                  onClick={() => setShowExportModal(selectedQuoteDetails)}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileDown size={18} /> Gerar Documento
                </button>
                <button
                  onClick={() => {
                    const id = selectedQuoteDetails.id;
                    const origin = selectedQuoteDetails.origin || 'standard';
                    setSelectedQuoteDetails(null);
                    onEdit(id, origin);
                  }}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings size={18} /> Editar Orçamento
                </button>
                <button
                  onClick={() => setSelectedQuoteDetails(null)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowExportModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1A1F2C] border border-white/5 rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center"
            >
              <h2 className="text-lg font-black italic text-white tracking-tighter mb-0.5 uppercase">Gerar Documento</h2>
              <p className="text-slate-500 text-[9px] mb-6 font-bold">Escolha o tipo de arquivo para #{showExportModal.id}</p>

              <div className="grid grid-cols-2 gap-2 w-full">
                {exportOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      generateQuotePDF(showExportModal, opt.id);
                      setShowExportModal(null);
                      showToast(`${opt.label} gerado com sucesso!`);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] bg-[#222834] border border-white/5 hover:border-primary/50 transition-all hover:bg-white/5 group"
                  >
                    <div className={`p-2.5 rounded-xl ${opt.bgColor} ${opt.color} group-hover:scale-110 transition-transform`}>
                      <opt.icon size={20} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-center text-slate-300">{opt.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowExportModal(null)}
                className="mt-6 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] transition-all text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
