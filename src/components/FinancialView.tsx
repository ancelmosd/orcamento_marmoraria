import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, MinusCircle, BarChart2, Search, ArrowUp, ArrowDown, X, Tag, DollarSign, CalendarIcon, Trash2 } from 'lucide-react';
import { FinancialTransaction } from '../types';

export function FinancialView({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      showToast("Erro ao buscar transações", "error");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          type: transactionType,
          amount: parseFloat(formData.amount),
          date: formData.date
        })
      });

      if (res.ok) {
        showToast("Transação salva com sucesso!");
        setIsModalOpen(false);
        setFormData({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });
        fetchTransactions();
      } else {
        showToast("Erro ao salvar transação", "error");
      }
    } catch (e) {
      showToast("Erro de conexão", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover esta transação?")) {
      try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast("Transação removida!");
          fetchTransactions();
        } else {
          showToast("Erro ao remover", "error");
        }
      } catch (e) {
        showToast("Erro de conexão", "error");
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      const tDay = date.getUTCDate().toString();
      const tMonth = date.getUTCMonth().toString();
      const tYear = date.getUTCFullYear().toString();

      if (filterYear !== 'all' && filterYear !== tYear) return false;
      if (filterMonth !== 'all' && filterMonth !== tMonth) return false;
      if (filterDay !== '' && filterDay !== tDay) return false;
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [transactions, filterMonth, filterYear, filterDay, searchTerm]);

  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalMovs = filteredTransactions.length;
    const progressPerc = totalMovs > 0 ? Math.round((filteredTransactions.filter(t => t.type === 'income').length / totalMovs) * 100) : 0;
    
    return {
      income,
      expense,
      balance: income - expense,
      totalMovs,
      progressPerc
    };
  }, [filteredTransactions]);

  const openModal = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto w-full bg-[#11141D] text-slate-200">
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto h-full items-start">
        {/* Painel Principal Esquerdo */}
        <div className="flex-1 space-y-8 w-full">
          
          {/* Header Texts */}
          <div className="space-y-1">
            <h4 className="text-[#FF7A00] font-bold text-xs tracking-widest uppercase">GESTÃO DE CAIXA</h4>
            <h1 className="text-4xl font-black text-white tracking-tight">Financeiro</h1>
            <p className="text-slate-400 text-sm">Controle total de entradas e saídas.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={() => openModal('income')}
              className="bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/5 min-w-[140px]"
            >
              <PlusCircle size={20} /> ENTRADA
            </button>
            <button 
              onClick={() => openModal('expense')}
              className="bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 min-w-[140px]"
            >
              <MinusCircle size={20} /> SAÍDA
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-[#181C25] rounded-2xl p-4 border border-[#2A303C] flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por descrição..."
                className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary/50 text-sm placeholder-slate-600 transition-colors"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Dia"
                value={filterDay}
                onChange={e => setFilterDay(e.target.value)}
                className="w-16 bg-[#0B0E14] border border-[#2A303C] rounded-xl px-3 py-2.5 text-center outline-none focus:border-primary/50 text-sm placeholder-slate-600"
                maxLength={2}
              />
              <select 
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="bg-[#0B0E14] border border-[#2A303C] rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-slate-300 appearance-none min-w-[140px] cursor-pointer"
              >
                <option value="all">Todos os meses</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i.toString()}>{m}</option>
                ))}
              </select>
              <select 
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-[#0B0E14] border border-[#2A303C] rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-slate-300 appearance-none cursor-pointer"
              >
                <option value="all">Todos</option>
                {[...Array(5)].map((_, i) => {
                   const year = new Date().getFullYear() - 2 + i;
                   return <option key={year} value={year.toString()}>{year}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Transactions Box */}
          <div className="bg-[#181C25] rounded-2xl border border-[#2A303C] overflow-hidden min-h-[400px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-5 border-b border-[#2A303C] text-[10px] uppercase tracking-widest font-black text-slate-500 italic">
              <div className="col-span-2">Data</div>
              <div className="col-span-4">Título / Descrição</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-3 text-right">Valor</div>
              <div className="col-span-1 text-center">Ações</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#2A303C]">
              {filteredTransactions.map(t => (
                <div key={t.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-[#1C212B] transition-colors group">
                  <div className="col-span-2 text-sm text-slate-400 font-medium">
                    {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                  
                  <div className="col-span-4 font-bold text-sm text-white uppercase break-words">
                    {t.title}
                  </div>
                  
                  <div className="col-span-2">
                    {t.type === 'income' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider">
                        <ArrowUp size={12} strokeWidth={3} /> Entrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider">
                        <ArrowDown size={12} strokeWidth={3} /> Saída
                      </span>
                    )}
                  </div>
                  
                  <div className={`col-span-3 text-right font-black text-sm tracking-tight ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  
                  <div className="col-span-1 flex justify-center">
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="text-slate-600 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="p-10 text-center text-slate-500">
                  <p>Nenhuma transação encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel Lateral Direito: Resumo */}
        <div className="lg:w-[340px] w-full shrink-0 lg:sticky lg:top-6">
          <div className="bg-[#181C25] rounded-[32px] p-8 border border-[#2A303C] space-y-6">
            
            <h2 className="flex items-center gap-2 text-white font-bold text-sm tracking-widest uppercase italic mb-8">
              <BarChart2 className="w-5 h-5 text-[#FF7A00]" /> Resumo do Período
            </h2>

            <div className="space-y-4">
              {/* Entradas Card */}
              <div className="bg-[#11141D] rounded-2xl p-5 border border-[#2A303C]">
                <p className="text-[10px] text-green-500 font-extrabold tracking-widest uppercase mb-1">Entradas</p>
                <p className="text-2xl font-black text-green-500 italic">
                  R$ {summary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Saídas Card */}
              <div className="bg-[#11141D] rounded-2xl p-5 border border-[#2A303C]">
                <p className="text-[10px] text-red-500 font-extrabold tracking-widest uppercase mb-1">Saídas</p>
                <p className="text-2xl font-black text-red-500 italic">
                  R$ {summary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Saldo Card */}
              <div className="bg-[#11141D] rounded-2xl p-5 border border-[#2A303C] mt-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB01A]/5 rounded-full blur-2xl -mr-10 -mt-10" />
                <p className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1 relative z-10">Saldo em Caixa</p>
                <p className="text-3xl font-black text-[#FFB01A] italic relative z-10">
                  R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Bottom Progress */}
            <div className="pt-6 mt-6 border-t border-[#2A303C]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Movimentações</span>
                <span className="text-sm font-bold text-white">{summary.totalMovs}</span>
              </div>
              <div className="w-full bg-[#0B0E14] h-1.5 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${summary.progressPerc}%` }} 
                  className="bg-green-500 h-full transition-all duration-1000"
                />
                <div 
                  style={{ width: `${100 - summary.progressPerc}%` }} 
                  className="bg-[#2A303C] h-full transition-all duration-1000"
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-600 mt-1 uppercase font-black tracking-widest">
                <span>Entrada</span>
                <span>{summary.progressPerc}%</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Modal - same as before but styled a bit darker */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181C25] border border-[#2A303C] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-black flex items-center gap-2 ${transactionType === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                  {transactionType === 'income' ? <><ArrowUp size={24}/> Nova Entrada</> : <><ArrowDown size={24}/> Nova Saída</>}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Título</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl pl-10 pr-4 py-2 outline-none focus:border-primary/50 text-sm placeholder-slate-600 text-white"
                      placeholder="Ex: Compra de Material"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl pl-10 pr-4 py-2 outline-none focus:border-primary/50 text-sm text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#2A303C] rounded-xl pl-10 pr-4 py-2 outline-none focus:border-primary/50 text-sm font-black text-white"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 text-white rounded-xl font-black text-sm shadow-xl hover:opacity-90 transition-opacity ${transactionType === 'income' ? 'bg-green-500 shadow-green-500/20' : 'bg-red-500 shadow-red-500/20'}`}
                  >
                    Salvar {transactionType === 'income' ? 'Entrada' : 'Saída'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
