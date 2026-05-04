import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, FileDown, MessageCircle, 
  Settings, X, Info, Layers, Construction, Camera,
  Briefcase, FileText, ListChecks, Banknote, ClipboardList, FileDigit,
  Check, DollarSign, LayoutGrid, List, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeSearchText } from '../utils/helpers';
import { PhotoGallery } from './PhotoGallery';

interface HistoryViewProps {
  searchTerm: string;
  onEdit: (id: number, origin: string) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  generateQuotePDF: (quote: any, type?: string, extraData?: any) => void;
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
  const [showClientFinance, setShowClientFinance] = useState<any | null>(null);
  const [clientPayments, setClientPayments] = useState<any[]>([]);
  const [showReceiptOptions, setShowReceiptOptions] = useState<any | null>(null);
  const [receiptAmount, setReceiptAmount] = useState<string>('');
  const [receiptDescription, setReceiptDescription] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(localStorage.getItem('historyViewMode') as 'grid' | 'list' || 'grid');
  const [showViewOptions, setShowViewOptions] = useState(false);

  const fetchQuotes = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const data = await res.json();
        setQuotes(Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()) : []);
      }
    } catch (error) {
      showToast("Erro ao carregar histórico.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('historyViewMode', mode);
    setShowViewOptions(false);
  };


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
  
  const fetchClientPayments = async (clientId: number) => {
    try {
      const res = await fetch(`/api/payments?client_id=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClientPayments(data || []);
      }
    } catch (e) {
      showToast("Erro ao carregar financeiro.", "error");
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
    // Atualização otimista para feedback instantâneo
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, delivery_date: date } : q));

    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_date: date })
      });
      if (res.ok) {
        showToast(`Data de entrega atualizada!`);
      } else {
        const errData = await res.json().catch(() => ({}));
        // Reverter em caso de erro
        fetchQuotes(true);
        showToast(errData.error || "Erro ao atualizar data.", "error");
      }
    } catch (error) {
      fetchQuotes(true);
      showToast("Erro de conexão.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider">Gestão de Pedidos</p>
          <h1 className="text-4xl font-black tracking-tight">Histórico</h1>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowViewOptions(!showViewOptions)}
            className="p-3 bg-secondary-dark border border-border-dark rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <MoreVertical size={20} />
          </button>

          <AnimatePresence>
            {showViewOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewOptions(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-secondary-dark border border-border-dark rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleViewModeChange('grid')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-slate-400'}`}
                    >
                      <LayoutGrid size={18} /> Visualização Grade
                    </button>
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-slate-400'}`}
                    >
                      <List size={18} /> Visualização Linha
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Unified Card Grid View */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" : "flex flex-col gap-2"}>
        {loading ? (
          <div className="col-span-full py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-slate-500 font-medium tracking-widest uppercase text-[10px]">Carregando orçamentos...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-secondary-dark/30 rounded-3xl border border-dashed border-border-dark">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="text-slate-600" size={32} />
            </div>
            <p className="text-slate-500 font-medium">Nenhum orçamento encontrado.</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <motion.div 
              layout
              key={quote.id} 
              className={`group bg-secondary-dark hover:bg-[#1E2533] border border-border-dark hover:border-primary/30 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-primary/5 relative overflow-hidden flex ${viewMode === 'grid' ? 'flex-col p-4 gap-3' : 'flex-col md:flex-row md:items-center py-1.5 px-4 gap-2 md:gap-4'}`}
              onClick={() => fetchQuoteDetails(quote.id)}
            >
              {/* Info Principal + ID */}
              <div className={`relative z-10 cursor-pointer flex flex-col justify-center ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-md leading-none">#{quote.id}</span>
                  <h3 className="text-base font-black text-white group-hover:text-primary transition-colors line-clamp-1 leading-none">{quote.client_name || 'Sem Nome'}</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                  {quote.project_name || 'Sem referência de projeto'}
                </p>
              </div>

              {/* Datas e Valores */}
              <div className={`relative z-10 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-4 py-3 border-y border-white/5' : 'flex items-center gap-6 md:px-6'}`}>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor do Projeto</p>
                  <p className="text-lg font-black text-white">R$ {(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className={`space-y-1 ${viewMode === 'grid' ? 'text-right' : ''}`} onClick={e => e.stopPropagation()}>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Previsão Entrega</p>
                  <div className={`flex items-center gap-2 group/date ${viewMode === 'grid' ? 'justify-end' : ''}`}>
                    <Calendar size={12} className="text-primary opacity-50" />
                    <input 
                      type="date"
                      value={quote.delivery_date || ''}
                      onChange={(e) => updateDeliveryDate(quote.id, e.target.value)}
                      className="bg-transparent border-none text-xs font-black text-slate-300 outline-none p-0 w-24 text-right cursor-pointer hover:text-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Rodapé e Ações */}
              <div className={`flex items-center justify-between relative z-10 ${viewMode === 'grid' ? 'pt-1' : 'md:flex-1 md:justify-end md:gap-4'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col justify-center gap-0.5">
                  <div className={`flex items-center gap-1 text-[10px] text-slate-500 font-bold ${viewMode === 'list' ? 'hidden lg:flex' : ''}`}>
                    <Calendar size={10} />
                    {quote.created_at ? new Date(quote.created_at).toLocaleDateString('pt-BR') : '-'}
                  </div>
                  <div 
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all w-max ${getStatusColor(quote.status || '')}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={quote.status || 'Pendente'}
                      onChange={(e) => updateStatus(quote.id, e.target.value)}
                      className="bg-transparent border-none text-current outline-none cursor-pointer font-black"
                    >
                      <option value="Pendente" className="text-black">Pendente</option>
                      <option value="Aprovado" className="text-black">Aprovado</option>
                      <option value="Em Produção" className="text-black">Em Produção</option>
                      <option value="Entregue" className="text-black">Entregue</option>
                      <option value="Cancelado" className="text-black">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(quote.id, quote.origin || 'standard')}
                    className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl transition-all border border-transparent hover:border-primary/20"
                    title="Editar"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedGalleryId(quote.id)}
                    className="p-2 bg-primary/5 hover:bg-primary/20 text-primary rounded-xl transition-all border border-primary/10"
                    title="Fotos"
                  >
                    <Camera size={14} />
                  </button>
                  <button
                    onClick={async () => {
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
                    className="p-2 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-xl transition-all border border-transparent hover:border-emerald-500/20"
                    title="Exportar"
                  >
                    <FileDown size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const phone = (quote.clients?.phone || '').replace(/\D/g, '');
                      const message = encodeURIComponent(`Olá ${quote.client_name || ''}! Aqui está o resumo do seu orçamento:\n\n*Projeto:* ${quote.project_name || ''}\n*Valor:* R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n*Status:* ${quote.status || ''}\n\nFicamos à disposição!`);
                      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                    }}
                    className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all border border-emerald-500/20"
                    title="WhatsApp"
                  >
                    <MessageCircle size={14} />
                  </button>
                  <button
                    onClick={() => setQuoteToDelete(quote.id)}
                    className="p-2 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                    title="Excluir"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Efeito Visual de Fundo no Hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
          ))
        )}
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
                {/* Galeria de Fotos no Topo */}
                <div className="mb-8">
                  <PhotoGallery quoteId={selectedQuoteDetails.id} showToast={showToast} />
                </div>

                {/* Resumo Financeiro */}
                <div className="p-6 bg-white/5 border border-border-dark rounded-2xl flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data de Criação</p>
                    <p className="text-sm font-bold">{selectedQuoteDetails.created_at ? new Date(selectedQuoteDetails.created_at).toLocaleString('pt-BR') : '-'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor Total</p>
                    <p className="text-3xl font-black text-primary">R$ {(selectedQuoteDetails.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

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



              </div>

              <div className="p-6 bg-white/5 border-t border-border-dark flex gap-3">
                <button
                  onClick={() => setShowExportModal(selectedQuoteDetails)}
                  className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileDown size={18} /> Documento
                </button>
                <button
                  onClick={() => {
                    if (selectedQuoteDetails.client_id) {
                      fetchClientPayments(selectedQuoteDetails.client_id);
                      setShowClientFinance({
                        id: selectedQuoteDetails.client_id,
                        name: selectedQuoteDetails.client_name
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Banknote size={18} /> Financeiro
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
                      if (opt.id === 'recibo') {
                        if (showExportModal.client_id) {
                          fetchClientPayments(showExportModal.client_id);
                        }
                        setSelectedQuoteDetails(showExportModal);
                        setShowClientFinance({
                          id: showExportModal.client_id,
                          name: showExportModal.client_name
                        });
                        setShowExportModal(null);
                      } else {
                        generateQuotePDF(showExportModal, opt.id);
                        setShowExportModal(null);
                        showToast(`${opt.label} gerado com sucesso!`);
                      }
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

      <AnimatePresence>
        {showClientFinance && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowClientFinance(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary-dark border border-border-dark rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Financeiro: {showClientFinance.name}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Lançamentos Financeiros</p>
                  </div>
                </div>
                <button onClick={() => setShowClientFinance(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="bg-background-dark/50 rounded-xl border border-border-dark overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 uppercase font-bold text-slate-500 text-[10px] tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3">Vencimento</th>
                        <th className="px-4 py-3">Valor</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                      {clientPayments.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">Nenhum lançamento financeiro.</td></tr>
                      ) : (
                        clientPayments.map(p => (
                          <tr key={p.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-slate-400">
                              {p.payment_date ? new Date(p.payment_date).toLocaleDateString('pt-BR') : new Date(p.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 font-semibold">{p.description || '-'}</td>
                            <td className="px-4 py-3 text-slate-400">
                              {p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400' :
                                (p.due_date && new Date(p.due_date) < new Date() ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400')
                                }`}>
                                {p.status === 'pago' ? 'Pago' : (p.due_date && new Date(p.due_date) < new Date() ? 'Atrasado' : 'Pendente')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {p.status === 'pendente' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await fetch(`/api/payments/${p.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'pago', payment_date: new Date().toISOString() })
                                      });
                                      showToast("Pagamento baixado!");
                                      fetchClientPayments(showClientFinance.id);
                                    } catch (err) {
                                      showToast("Erro ao dar baixa.", "error");
                                    }
                                  }}
                                  className="text-emerald-500 hover:text-emerald-400 p-1" title="Dar baixa"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-border-dark flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReceiptOptions(selectedQuoteDetails);
                    setReceiptAmount('');
                    setReceiptDescription('Pagamento');
                    setShowExportModal(null);
                  }}
                  className="px-8 py-3 bg-pink-600 hover:bg-pink-700 rounded-xl font-bold text-sm transition-colors text-white flex items-center gap-2"
                >
                  <FileDigit size={18} /> Recibo
                </button>
                <button
                  onClick={() => setShowClientFinance(null)}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors text-white"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceiptOptions && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowReceiptOptions(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-secondary-dark border border-border-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold">Configurar Recibo</h3>
                <button onClick={() => setShowReceiptOptions(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selecione uma Parcela</label>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                    {clientPayments.length > 0 ? (
                      clientPayments.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setReceiptAmount(p.amount.toString());
                            setReceiptDescription(p.description || '');
                          }}
                          className={`p-3 rounded-xl border transition-all text-left flex justify-between items-center ${
                            receiptAmount === p.amount.toString() 
                              ? 'bg-primary/20 border-primary text-primary' 
                              : 'bg-background-dark/50 border-border-dark hover:border-slate-500'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold">{p.description || 'Parcela'}</p>
                            <p className="text-[10px] text-slate-500">{new Date(p.due_date || p.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <span className="font-bold">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">Nenhum lançamento financeiro encontrado.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="number"
                      step="0.01"
                      value={receiptAmount}
                      onChange={(e) => setReceiptAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-background-dark/50 border border-border-dark rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary transition-colors text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Referente a (Descrição)</label>
                  <input
                    type="text"
                    value={receiptDescription}
                    onChange={(e) => setReceiptDescription(e.target.value)}
                    placeholder="Ex: Sinal de 50%"
                    className="w-full bg-background-dark/50 border border-border-dark rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-border-dark flex gap-3">
                <button
                  onClick={() => setShowReceiptOptions(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!receiptAmount) {
                      showToast("Informe o valor do recibo.", "error");
                      return;
                    }
                    generateQuotePDF(showReceiptOptions, 'recibo', { 
                      amount: parseFloat(receiptAmount), 
                      description: receiptDescription,
                      payments: clientPayments 
                    });
                    setShowReceiptOptions(null);
                  }}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark rounded-xl font-bold text-sm transition-colors shadow-lg shadow-primary/20"
                >
                  Gerar Recibo PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
