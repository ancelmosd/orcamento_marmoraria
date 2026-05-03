import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Package, TrendingUp, TrendingDown, Clock, Search, Plus, 
  X, Check, AlertCircle, FileText, Settings, Download, Trash2,
  Phone, MapPin, Calculator, Calendar, History, Save, Edit2, 
  ArrowRight, FileOutput, GripHorizontal, Box, Layers, Scissors, 
  RotateCw, Construction, Database, Upload, ArrowUpRight, ArrowDownRight,
  Filter, DollarSign, Bolt, Camera, Eye, MoreVertical, ArrowLeft, CreditCard, ClipboardList, CalendarCheck, MessageCircle
} from 'lucide-react';
import { Client, Material, Service, DescriptionTemplate, QuoteItem, QuoteService, ModuleTemplate, ModulePart, Supply, Quote } from '../types';
import { normalizeSearchText } from '../utils/helpers';


export default function ClientsView({ searchTerm, initialAction, onActionComplete, showToast }: { searchTerm: string, initialAction?: string | null, onActionComplete?: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', document: '', phone: '', address: '' });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'orders' | 'appointments'>('payments');
  const [appointments, setAppointments] = useState<any[]>([]); // Mock appointments for now

  const fetchClients = () => {
    fetch('/api/clients').then(r => r.json()).then(data => {
      setClients(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (initialAction === 'new') {
      setShowForm(true);
      if (onActionComplete) onActionComplete();
    }
  }, [initialAction]);

  const filteredClients = clients.filter((client) =>
    !searchTerm || [
      client.name,
      client.document,
      client.phone,
      client.address
    ].some((value) => normalizeSearchText(value).includes(normalizeSearchText(searchTerm)))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/clients/${editingId}` : '/api/clients';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      showToast(editingId ? "Cliente atualizado!" : "Cliente cadastrado!");
      setFormData({ name: '', document: '', phone: '', address: '' });
      setShowForm(false);
      setEditingId(null);
      fetchClients();
    } else {
      showToast("Erro ao salvar cliente.", "error");
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      document: client.document,
      phone: client.phone,
      address: client.address
    });
    setEditingId(client.id);
    setShowForm(true);
    setOpenMenuId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Cliente removido.");
        fetchClients();
        setOpenMenuId(null);
        setClientToDelete(null);
      } else {
        showToast("Erro ao excluir cliente.", "error");
      }
    } catch (error) {
      showToast("Erro de conexão.", "error");
    }
  };

  return (
    <div className="space-y-8">
      {!selectedClientId ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Gestão de Clientes</h1>
              <p className="text-slate-500 text-sm">Visualize e gerencie sua base de contatos.</p>
            </div>
            <button
              onClick={() => {
                if (showForm) {
                  setEditingId(null);
                  setFormData({ name: '', document: '', phone: '', address: '' });
                }
                setShowForm(!showForm);
              }}
              className="w-full sm:w-auto bg-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {showForm ? <X size={20} /> : <Plus size={20} />}
              {showForm ? 'Cancelar' : 'Novo Cliente'}
            </button>
          </div>


          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="bg-secondary-dark p-6 rounded-xl border border-border-dark grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 mb-2">
                    <h3 className="text-lg font-bold text-primary">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                    <input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: Maria Oliveira"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">CPF / CNPJ</label>
                    <input
                      value={formData.document}
                      onChange={e => setFormData({ ...formData, document: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                    <input
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                    <input
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Rua, Número, Bairro"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end pt-4">
                    <button type="submit" className="bg-primary px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20">
                      {editingId ? 'Atualizar Cliente' : 'Salvar Cliente'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-secondary-dark rounded-xl border border-border-dark overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Documento</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Telefone</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Nenhum cliente cadastrado.</td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Nenhum cliente encontrado para essa busca.</td>
                  </tr>
                ) : filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedClientId(client.id)}>
                    <td className="px-6 py-4 font-bold text-sm text-primary hover:underline">{client.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{client.document}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{client.phone}</td>
                    <td className="px-6 py-4 relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === client.id ? null : client.id);
                        }}
                        className="p-2 text-slate-500 hover:text-primary transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === client.id && (
                        <div className="absolute right-6 top-12 w-32 bg-secondary-dark border border-border-dark rounded-lg shadow-xl z-50 overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(client);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <Edit2 size={14} /> Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientToDelete(client.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ClientDetailView
          clientId={selectedClientId}
          onBack={() => setSelectedClientId(null)}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-secondary-dark border border-border-dark rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 text-red-400 mb-4">
                <div className="bg-red-400/10 p-3 rounded-xl">
                  <X size={24} />
                </div>
                <h3 className="text-xl font-bold">Excluir Cliente?</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Esta ação não pode ser desfeita. Todos os dados deste cliente serão removidos permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setClientToDelete(null)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(clientToDelete)}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientDetailView({ clientId, onBack, showToast }: { clientId: number, onBack: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [client, setClient] = useState<Client | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'orders' | 'appointments'>('orders');
  const [orders, setOrders] = useState<Quote[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState<'received' | 'pending' | null>(null);
  const [newAppointment, setNewAppointment] = useState({ title: '', date: '', time: '', type: 'Visita' });
  const [paymentData, setPaymentData] = useState({ amount: '', date: '', installments: '1', description: '' });

   const fetchData = () => {
    fetch(`/api/clients/${clientId}`)
      .then(r => {
        if (!r.ok) throw new Error('Client not found');
        return r.json();
      })
      .then(setClient)
      .catch(err => {
        console.error(err);
        showToast("Erro ao carregar cliente", "error");
        onBack();
      });

    fetch(`/api/quotes?client_id=${clientId}`).then(r => r.json()).then(setOrders).catch(() => setOrders([]));
    fetch(`/api/payments?client_id=${clientId}`).then(r => r.json()).then(setPayments).catch(() => setPayments([]));
    fetch(`/api/appointments?client_id=${clientId}`).then(r => r.json()).then(setAppointments).catch(() => setAppointments([]));
  };

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const saveAppointments = (newItems: any[]) => {
    setAppointments(newItems);
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.date) {
      showToast("Por favor, selecione uma data", "error");
      return;
    }
    // Combina data e hora para criar um objeto Date válido
    const combinedDate = new Date(`${newAppointment.date}T${newAppointment.time || '00:00'}:00`);
    
    const data = {
      ...newAppointment,
      date: combinedDate.toISOString(),
      client_id: clientId,
      status: 'pendente'
    };
    
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(saved => {
      setAppointments([...appointments, saved]);
      setNewAppointment({ title: '', date: '', time: '', type: 'Visita' });
      setShowAppointmentForm(false);
      showToast("Compromisso agendado!");
    });
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const installmentsCount = parseInt(paymentData.installments) || 1;
    const amountPerInstallment = parseFloat(paymentData.amount) / installmentsCount;
    const baseDate = new Date(paymentData.date || new Date());

    for (let i = 0; i < installmentsCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          amount: amountPerInstallment,
          due_date: showPaymentForm === 'pending' ? dueDate.toISOString() : null,
          payment_date: showPaymentForm === 'received' ? baseDate.toISOString() : null,
          status: showPaymentForm === 'received' ? 'pago' : 'pendente',
          description: installmentsCount > 1
            ? `${paymentData.description} (Parcela ${i + 1}/${installmentsCount})`
            : paymentData.description
        })
      });
    }

    setShowPaymentForm(null);
    setPaymentData({ amount: '', date: '', installments: '1', description: '' });
    showToast(installmentsCount > 1 ? "Parcelas geradas com sucesso!" : "Pagamento lançado!");
    fetchData();
  };

  if (!client) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} /> Voltar para lista
      </button>

      <div className="bg-secondary-dark rounded-2xl border border-border-dark p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black">{client.name}</h2>
            <p className="text-slate-500 text-sm">{client.phone} • {client.address}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const hasBillable = orders.some(o => ['Aprovado', 'Enviado', 'Entregue', 'Em Produção'].includes(o.status));
                if (hasBillable) setActiveSubTab('payments');
                else showToast("Aba bloqueada: Lançamentos financeiros permitidos apenas para pedidos aprovados.", "error");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'payments' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'} ${!orders.some(o => ['Aprovado', 'Enviado', 'Entregue', 'Em Produção'].includes(o.status)) ? 'opacity-50' : ''}`}
            >
              <CreditCard size={16} /> Pagamentos
            </button>
            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'orders' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <ClipboardList size={16} /> Pedidos
            </button>
            <button
              onClick={() => setActiveSubTab('appointments')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'appointments' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <CalendarCheck size={16} /> Compromissos
            </button>
          </div>
        </div>

        <div className="mt-8">
          {activeSubTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={() => { setShowPaymentForm('received'); setPaymentData(p => ({ ...p, installments: '1' })); }}
                  className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                >
                  Lançar Recebimento
                </button>
                <button
                  onClick={() => setShowPaymentForm('pending')}
                  className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20"
                >
                  Lançar A Receber
                </button>
              </div>

              <AnimatePresence>
                {showPaymentForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddPayment}
                    className="bg-background-dark p-6 rounded-xl border border-primary/20 overflow-hidden"
                  >
                    <h3 className="text-sm font-bold mb-4 text-primary">
                      {showPaymentForm === 'received' ? 'Novo Recebimento' : 'Novo Lançamento A Receber'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Total (R$)</label>
                        <input required type="number" step="0.01" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data {showPaymentForm === 'received' ? 'do Recebimento' : 'do Vencimento'}</label>
                        <input required type="date" value={paymentData.date} onChange={e => setPaymentData({ ...paymentData, date: e.target.value })} className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      {showPaymentForm === 'pending' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Parcelas</label>
                          <input required type="number" min="1" value={paymentData.installments} onChange={e => setPaymentData({ ...paymentData, installments: e.target.value })} className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm outline-none" />
                        </div>
                      )}
                      <div className={`${showPaymentForm === 'pending' ? 'md:col-span-1' : 'md:col-span-2'} space-y-1`}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                        <input value={paymentData.description} onChange={e => setPaymentData({ ...paymentData, description: e.target.value })} className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm outline-none" placeholder="Ex: Entrada 50%" />
                      </div>
                      <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowPaymentForm(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button>
                        <button type="submit" className="bg-primary px-6 py-2 rounded-lg text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90">Salvar Lançamento</button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                  <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Recebido</p>
                  <p className="text-xl font-black text-emerald-500">
                    R$ {(Array.isArray(payments) ? payments : []).filter(p => p.status === 'pago').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <p className="text-xs font-bold text-blue-400 uppercase mb-1">A receber</p>
                  <p className="text-xl font-black text-blue-500">
                    R$ {(Array.isArray(payments) ? payments : []).filter(p => p.status === 'pendente' && p.due_date && new Date(p.due_date) >= new Date()).reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                  <p className="text-xs font-bold text-red-400 uppercase mb-1">Em atraso</p>
                  <p className="text-xl font-black text-red-500">
                    R$ {(Array.isArray(payments) ? payments : []).filter(p => p.status === 'pendente' && p.due_date && new Date(p.due_date) < new Date()).reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-background-dark/50 rounded-xl border border-border-dark overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 uppercase font-bold text-slate-500">
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
                    {payments.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">Nenhum lançamento financeiro.</td></tr>
                    ) : (
                      payments.map(p => (
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
                              (new Date(p.due_date) < new Date() ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400')
                              }`}>
                              {p.status === 'pago' ? 'Pago' : (new Date(p.due_date) < new Date() ? 'Atrasado' : 'Pendente')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {p.status === 'pendente' && (
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/payments/${p.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'pago', payment_date: new Date().toISOString() })
                                    });
                                    showToast("Pagamento baixado!");
                                    fetchData();
                                  }}
                                  className="text-emerald-500 hover:text-emerald-400 p-1" title="Dar baixa"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  await fetch(`/api/payments/${p.id}`, { method: 'DELETE' });
                                  showToast("Lançamento removido");
                                  fetchData();
                                }}
                                className="text-slate-500 hover:text-red-400 p-1"
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
            </div>
          )}

          {activeSubTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center py-8 text-slate-500">Nenhum pedido encontrado para este cliente.</p>
              ) : (
                <div className="grid gap-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-background-dark/50 p-4 rounded-xl border border-border-dark flex justify-between items-center hover:bg-white/5 transition-colors group">
                      <div>
                        <p className="font-bold">{order.project_name}</p>
                        <p className="text-xs text-slate-500">#{order.id} • {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const phone = client?.phone?.replace(/\D/g, '');
                              const message = encodeURIComponent(`Olá ${client?.name}! Aqui está o resumo do seu orçamento:\n\n*Projeto:* ${order.project_name}\n*Valor:* R$ ${order.total_value.toLocaleString()}\n*Status:* ${order.status}\n\nFicamos à disposição!`);
                              window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                            }}
                            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                            title="Enviar via WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-primary">R$ {order.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${order.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400' :
                            order.status === 'Enviado' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                            }`}>{order.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Clock size={16} /> Próximos Compromissos</h3>
                <button
                  onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                  className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Novo Compromisso
                </button>
              </div>

              <AnimatePresence>
                {showAppointmentForm && (
                  <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleAddAppointment}
                    className="bg-background-dark p-4 rounded-xl border border-primary/20 grid grid-cols-1 md:grid-cols-4 gap-3"
                  >
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Título</label>
                      <input required value={newAppointment.title} onChange={e => setNewAppointment({ ...newAppointment, title: e.target.value })} className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm outline-none" placeholder="Ex: Medição no local" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Data</label>
                      <input required type="date" value={newAppointment.date} onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })} className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                      <select value={newAppointment.type} onChange={e => setNewAppointment({ ...newAppointment, type: e.target.value })} className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm outline-none">
                        <option>Visita</option>
                        <option>Entrega</option>
                        <option>Medição</option>
                        <option>Pagamento</option>
                      </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end gap-2">
                      <button type="button" onClick={() => setShowAppointmentForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button>
                      <button type="submit" className="bg-primary px-6 py-2 rounded-lg text-xs font-bold text-white shadow-lg shadow-primary/20">Salvar</button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">Nenhum compromisso agendado.</p>
                ) : (
                  appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(app => (
                    <div key={app.id} className="bg-background-dark/30 p-4 rounded-xl border border-border-dark flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${app.type === 'Entrega' ? 'bg-orange-500/10 text-orange-400' : 'bg-primary/10 text-primary'}`}>
                          {app.type === 'Entrega' ? <Package size={18} /> : <CalendarCheck size={18} />}
                        </div>
                        <div>
                          <p className="font-bold">{app.title}</p>
                          <p className="text-xs text-slate-500">{new Date(app.date).toLocaleDateString('pt-BR')} • {app.type}</p>
                        </div>
                      </div>
                        <button
                          onClick={async () => {
                            await fetch(`/api/appointments/${app.id}`, { method: 'DELETE' });
                            setAppointments(appointments.filter(a => a.id !== app.id));
                            showToast("Compromisso removido");
                          }}
                          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


