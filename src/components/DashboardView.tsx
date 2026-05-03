import React, { useState, useEffect } from 'react';
import {
  Users, Package, Calculator, History, Construction,
  Clock, Bell, CheckSquare, Bolt, Info, Settings, Calendar,
  List, Plus, ChevronLeft, ChevronRight, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardStats, Material } from '../types';
import { StatCard } from './StatCard';
import { ShortcutButton } from './ShortcutButton';

interface DashboardViewProps {
  stats: DashboardStats;
  onAction: (action: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, onAction }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => a.quantity - b.quantity);
        setMaterials(sorted.slice(0, 3));
      })
      .catch(err => console.error("Error fetching materials for dashboard:", err));

    fetch('/api/quotes')
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setQuotes(sorted.slice(0, 5));
      })
      .catch(err => console.error("Error fetching quotes for dashboard:", err));

    fetch('/api/appointments')
      .then(res => res.json())
      .then(setAppointments)
      .catch(err => console.error("Error fetching appointments:", err));

    fetch('/api/clients')
      .then(res => res.json())
      .then(setClients)
      .catch(err => console.error("Error fetching clients:", err));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-primary text-sm font-semibold uppercase tracking-wider">Painel Administrativo</p>
        <h1 className="text-4xl font-black tracking-tight">Visão Geral</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Orçamentos Pendentes" value={stats.pendingQuotes} trend={stats.pendingQuotesTrend} icon={<History />} color="primary" />
        <StatCard label="Orçamentos Aprovados" value={stats.approvedQuotes} trend={stats.approvedQuotesTrend} icon={<CheckSquare />} color="emerald" />
        <StatCard label="Total de Clientes" value={stats.totalClients} trend={stats.totalClientsTrend} icon={<Users />} color="blue" />
        <StatCard label="Faturamento Mensal" value={`R$ ${(stats.monthlyRevenue || 0).toLocaleString()}`} trend={stats.monthlyRevenueTrend} icon={<Calculator />} color="emerald" />
        <StatCard label="Em Produção" value={stats.inProduction} trend={stats.inProductionTrend} icon={<Construction />} color="yellow" />
        <StatCard label="Total A Receber" value={`R$ ${(stats.totalReceivable || 0).toLocaleString()}`} icon={<Clock />} color="blue" />
        <StatCard label="Total Em Atraso" value={`R$ ${(stats.totalOverdue || 0).toLocaleString()}`} icon={<Bell />} color="orange" />
        <div onClick={() => setIsCalendarModalOpen(true)} className="cursor-pointer group">
          <StatCard label="Agenda de Compromissos" value={appointments.filter(a => a.status === 'pendente').length} icon={<Calendar />} color="primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bolt className="text-primary w-5 h-5" /> Atalhos Rápidos
          </h2>
          <div className="space-y-3">
            <ShortcutButton icon={<Users />} label="Novo Cliente" sub="Cadastrar novo contato" onClick={() => onAction('new-client')} />
            <ShortcutButton icon={<Package />} label="Entrada de Material" sub="Atualizar estoque" onClick={() => onAction('material-entry')} />
            <ShortcutButton icon={<Calculator />} label="Novo Orçamento" sub="Gerar calculadora" onClick={() => onAction('new-quote')} />
          </div>

          <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Info className="text-primary w-4 h-4" /> Status do Estoque
            </h3>
            <div className="space-y-4">
              {materials.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum material cadastrado.</p>
              ) : materials.map(m => (
                <StockProgress
                  key={m.id}
                  label={m.name}
                  value={Math.min(100, (m.quantity / 50) * 100)}
                  amount={`${m.quantity} m²`}
                  color={m.quantity < 10 ? 'orange' : 'primary'}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="text-primary w-5 h-5" /> Últimos Orçamentos
            </h2>
            <button onClick={() => onAction('view-history')} className="text-primary text-sm font-bold hover:underline">Ver todos</button>
          </div>
          <div className="bg-secondary-dark rounded-xl border border-border-dark overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Data</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Valor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum orçamento recente.</td>
                  </tr>
                ) : quotes.map(q => (
                  <TableRow
                    key={q.id}
                    client={q.client_name}
                    project={q.project_name}
                    date={new Date(q.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    value={`R$ ${q.total_value.toLocaleString()}`}
                    status={q.status}
                    onEdit={() => onAction(`edit-quote-${q.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Compromissos */}
      <AnimatePresence>
        {isCalendarModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-secondary-dark border border-border-dark rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-primary/10"
            >
              {/* Header */}
              <div className="p-1 border-b border-border-dark flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary shadow-lg shadow-primary/5">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Agenda de Compromissos</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Gerenciamento de prazos e reuniões</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-background-dark p-1 rounded-xl border border-border-dark flex">
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Calendar size={14} /> Calendário
                    </button>
                    <button
                      onClick={() => setActiveTab('list')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      <List size={14} /> Lista
                    </button>
                  </div>
                  <button onClick={() => setIsCalendarModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'calendar' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar Section */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">
                          {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                            className="p-2 hover:bg-white/5 rounded-lg border border-border-dark transition-all"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={() => setCurrentMonth(new Date(new Date()))}
                            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 rounded-lg border border-border-dark transition-all"
                          >
                            Hoje
                          </button>
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                            className="p-2 hover:bg-white/5 rounded-lg border border-border-dark transition-all"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                          <div key={day} className="text-center py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{day}</div>
                        ))}
                        {(() => {
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const firstDay = new Date(year, month, 1).getDay();
                          const cells = [];

                          for (let i = 0; i < firstDay; i++) {
                            cells.push(<div key={`empty-${i}`} className="h-24 p-2 bg-white/[0.01] border border-white/5 rounded-md opacity-20"></div>);
                          }

                          for (let day = 1; day <= daysInMonth; day++) {
                            const dateStr = new Date(year, month, day).toISOString().split('T')[0];
                            const dayApps = appointments.filter(a => a.date.startsWith(dateStr));
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;
                            const isSelected = selectedDate === dateStr;

                            cells.push(
                              <div
                                key={day}
                                onClick={() => {
                                  setSelectedDate(dateStr);
                                  setIsAddingNew(false);
                                }}
                                className={`h-24 p-2 border border-white/5 rounded-md relative transition-all cursor-pointer hover:bg-white/5 ${isSelected ? 'bg-primary/20 border-primary/50' : isToday ? 'bg-primary/5 border-primary/20' : 'bg-white/[0.02]'}`}
                              >
                                <span className={`text-[10px] font-black ${isSelected || isToday ? 'text-primary' : 'text-slate-500'}`}>{day}</span>
                                <div className="mt-1 space-y-1">
                                  {dayApps.map(a => (
                                    <div key={a.id} className={`text-[8px] p-1 rounded font-bold truncate ${a.status === 'concluido' ? 'opacity-40 line-through' : ''} ${a.type === 'Entrega' ? 'bg-emerald-500/10 text-emerald-500' : a.type === 'Medição' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`} title={`${a.title} ${a.client_name ? `- ${a.client_name}` : ''}`}>
                                      {a.status === 'concluido' && '✓ '}{a.title}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return cells;
                        })()}
                      </div>
                    </div>

                    {/* Right Section: Day Details or Add Form */}
                    <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-4 flex flex-col h-full min-h-[500px]">
                      {isAddingNew ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                              <Plus size={16} /> Novo Compromisso
                            </h3>
                            <button onClick={() => setIsAddingNew(false)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white">Voltar</button>
                          </div>
                          <form onSubmit={(e: any) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = {
                              title: formData.get('title'),
                              date: formData.get('date'),
                              type: formData.get('type'),
                              description: formData.get('description'),
                              client_id: formData.get('client_id') || null,
                              status: 'pendente'
                            };
                            fetch('/api/appointments', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(data)
                            }).then(res => res.json()).then(newApp => {
                              const client = clients.find(c => c.id === parseInt(data.client_id as string));
                              const appWithClient = { ...newApp, client_name: client?.name };
                              setAppointments([...appointments, appWithClient]);
                              setIsAddingNew(false);
                            });
                          }} className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título</label>
                              <input name="title" required className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-primary/50 outline-none transition-all" placeholder="Ex: Medição na Cozinha" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</label>
                              <select name="client_id" className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 outline-none appearance-none">
                                <option value="">Nenhum</option>
                                {clients.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</label>
                                <input name="date" type="date" defaultValue={selectedDate} required className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 outline-none" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                                <select name="type" className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 outline-none appearance-none">
                                  <option value="Medição">Medição</option>
                                  <option value="Entrega">Entrega</option>
                                  <option value="Reunião">Reunião</option>
                                  <option value="Outro">Outro</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
                              <textarea name="description" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-primary/50 outline-none min-h-[60px]" placeholder="Detalhes opcionais..." />
                            </div>
                            <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                              Salvar Compromisso
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full relative">
                          <div className="mb-4 pt-1 px-1">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">
                              {new Date(selectedDate + 'T12:00:00').getDate().toString().padStart(2, '0')}
                            </h2>
                            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mt-1">
                              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Compromissos do Dia</h3>
                            <button
                              onClick={() => setIsAddingNew(true)}
                              className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-lg shadow-primary/5"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                            {(() => {
                              const dayApps = appointments.filter(a => a.date.startsWith(selectedDate));
                              if (dayApps.length === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Dia Livre</p>
                                  </div>
                                );
                              }
                              return dayApps.map(a => (
                                <div key={a.id} className={`p-3 bg-white/[0.03] border border-white/5 rounded-xl group hover:bg-white/[0.05] transition-all ${a.status === 'concluido' ? 'opacity-60' : ''}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${a.type === 'Entrega' ? 'bg-emerald-500/10 text-emerald-500' : a.type === 'Medição' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                                      {a.type}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => {
                                          const newStatus = a.status === 'concluido' ? 'pendente' : 'concluido';
                                          fetch(`/api/appointments/${a.id}`, { 
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: newStatus })
                                          }).then(() => {
                                            setAppointments(appointments.map(app => app.id === a.id ? { ...app, status: newStatus } : app));
                                          });
                                        }}
                                        className={`p-1 rounded hover:bg-white/10 transition-all ${a.status === 'concluido' ? 'text-emerald-500' : 'text-slate-500'}`}
                                        title={a.status === 'concluido' ? "Marcar como pendente" : "Marcar como concluído"}
                                      >
                                        <CheckSquare size={14} />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm("Tem certeza que deseja excluir este compromisso?")) {
                                            fetch(`/api/appointments/${a.id}`, { method: 'DELETE' })
                                              .then(() => setAppointments(appointments.filter(app => app.id !== a.id)));
                                          }
                                        }}
                                        className="p-1 text-slate-500 hover:text-red-500 transition-all"
                                        title="Excluir"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <h4 className={`text-xs font-bold text-white mb-0.5 ${a.status === 'concluido' ? 'line-through text-slate-500' : ''}`}>{a.title}</h4>
                                  {a.client_name && <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter line-clamp-1">Cliente: {a.client_name}</p>}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">Lista de Compromissos</h3>
                      <div className="flex gap-2">
                        <select
                          className="bg-white/5 border border-border-dark rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-400 outline-none"
                          onChange={(e) => {
                            const filter = e.target.value;
                            // Add filtering logic if needed
                          }}
                        >
                          <option value="all">Todos os tipos</option>
                          <option value="Medição">Medições</option>
                          <option value="Entrega">Entregas</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {appointments.length === 0 ? (
                        <div className="text-center py-12 bg-white/[0.01] rounded-3xl border border-dashed border-white/10">
                          <p className="text-slate-500 text-sm">Nenhum compromisso agendado.</p>
                        </div>
                      ) : appointments.map(app => (
                        <div key={app.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-background-dark border border-border-dark rounded-2xl">
                              <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                                {new Date(app.date).toLocaleDateString('pt-BR', { month: 'short' })}
                              </span>
                              <span className="text-xl font-black text-white">
                                {new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h4 className={`font-bold text-white ${app.status === 'concluido' ? 'line-through text-slate-500' : ''}`}>{app.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${app.type === 'Entrega' ? 'bg-emerald-500/10 text-emerald-500' : app.type === 'Medição' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                                  {app.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {app.client_name ? `Cliente: ${app.client_name} • ` : ''}
                                {app.description || 'Sem descrição adicional'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                              <p className={`text-xs font-bold ${app.status === 'pendente' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {app.status === 'pendente' ? 'Pendente' : 'Concluído'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  const newStatus = app.status === 'concluido' ? 'pendente' : 'concluido';
                                  fetch(`/api/appointments/${app.id}`, { 
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                  }).then(() => {
                                    setAppointments(appointments.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
                                  });
                                }}
                                className={`p-2 rounded-lg transition-all ${app.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                title={app.status === 'concluido' ? "Marcar como pendente" : "Marcar como concluído"}
                              >
                                <CheckSquare size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Tem certeza que deseja excluir este compromisso?")) {
                                    fetch(`/api/appointments/${app.id}`, { method: 'DELETE' })
                                      .then(() => setAppointments(appointments.filter(a => a.id !== app.id)));
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2 bg-white/5 border-t border-border-dark flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Total: {appointments.length} compromissos agendados
                </p>
                <button
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all border border-white/5"
                >
                  Fechar Agenda
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


function StockProgress({ label, value, amount, color = 'primary' }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${color === 'orange' ? 'text-orange-500' : 'text-white'}`}>{amount}</span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full">
        <div className={`h-1.5 rounded-full ${color === 'orange' ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function TableRow({ client, project, date, value, status, onEdit }: any) {
  const statusColors: any = {
    'Pendente': 'text-orange-500 bg-orange-500/10',
    'Aprovado': 'text-emerald-500 bg-emerald-500/10',
    'Em Produção': 'text-yellow-400 bg-yellow-400/10',
    'Entregue': 'text-indigo-500 bg-indigo-500/10',
    'Cancelado': 'text-red-500 bg-red-500/10',
    'Enviado': 'bg-blue-500/10 text-blue-400',
    'Rascunho': 'bg-slate-500/10 text-slate-400'
  };

  return (
    <tr
      className="hover:bg-white/5 transition-colors group cursor-pointer"
      onClick={onEdit}
    >
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm">{client}</span>
          <span className="text-slate-500 text-xs">{project}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-400 text-sm">{date}</td>
      <td className="px-6 py-4 font-bold text-sm">{value}</td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[status] || 'text-slate-500 bg-slate-500/10'}`}>{status}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end">
          <div className="p-1.5 bg-white/5 rounded-md group-hover:bg-primary group-hover:text-white transition-colors text-primary">
            <Settings size={14} />
          </div>
        </div>
      </td>
    </tr>
  );
}

