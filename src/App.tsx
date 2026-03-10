import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Calculator, 
  History, 
  Settings, 
  Bell, 
  Plus, 
  Search, 
  MoreVertical, 
  Download,
  Bolt,
  Info,
  Layers,
  Construction,
  LogOut,
  Menu,
  X,
  Scissors,
  RotateCw,
  Move,
  CheckSquare,
  Square,
  Edit2,
  Save,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Client, Material, Quote, DashboardStats, Service } from './types';

// Mock data for initial render
const MOCK_STATS: DashboardStats = {
  pendingQuotes: 24,
  totalClients: 1280,
  monthlyRevenue: 45200,
  inProduction: 15
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clientAction, setClientAction] = useState<string | null>(null);
  const [editQuoteId, setEditQuoteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error("Error fetching stats:", err));
    }
  }, [activeTab]);

  const handleQuickAction = (action: string) => {
    if (action === 'new-client') {
      setActiveTab('clients');
      setClientAction('new');
    } else if (action === 'material-entry') {
      setActiveTab('materials');
    } else if (action === 'new-quote') {
      setEditQuoteId(null);
      setActiveTab('quotes');
    } else if (action === 'view-history') {
      setActiveTab('history');
    } else if (action.startsWith('edit-quote-')) {
      const id = parseInt(action.replace('edit-quote-', ''));
      setEditQuoteId(id);
      setActiveTab('quotes');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView stats={stats} onAction={handleQuickAction} />;
      case 'clients': return <ClientsView initialAction={clientAction} onActionComplete={() => setClientAction(null)} showToast={showToast} />;
      case 'materials': return <MaterialsView showToast={showToast} />;
      case 'quotes': return (
        <QuotesView 
          editId={editQuoteId} 
          onSave={() => {
            setEditQuoteId(null);
            setActiveTab('history');
          }} 
          onCancel={() => {
            setEditQuoteId(null);
            setActiveTab('history');
          }}
          showToast={showToast}
        />
      );
      case 'cut-plan': return <CutPlanView showToast={showToast} />;
      case 'services': return <ServicesView showToast={showToast} />;
      case 'history': return (
        <HistoryView 
          onEdit={(id) => {
            setEditQuoteId(id);
            setActiveTab('quotes');
          }} 
          showToast={showToast}
        />
      );
      case 'settings': return <SettingsView showToast={showToast} />;
      default: return <DashboardView stats={stats} onAction={handleQuickAction} />;
    }
  };

  return (
    <div className="flex h-screen bg-background-dark text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} fixed md:relative h-full border-r border-border-dark bg-secondary-dark transition-all duration-300 flex flex-col z-50`}>
        <div className="p-6 flex items-center justify-between gap-3 text-primary">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            {(isSidebarOpen || !isSidebarOpen) && <h1 className={`font-bold text-xl tracking-tight whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Marmoraria</h1>}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Users />} label="Clientes" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Package />} label="Materiais" active={activeTab === 'materials'} onClick={() => setActiveTab('materials')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Construction />} label="Serviços" active={activeTab === 'services'} onClick={() => setActiveTab('services')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Scissors />} label="Plano de Corte" active={activeTab === 'cut-plan'} onClick={() => setActiveTab('cut-plan')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Calculator />} label="Orçamentos" active={activeTab === 'quotes'} onClick={() => {
            setEditQuoteId(null);
            setActiveTab('quotes');
          }} collapsed={!isSidebarOpen} />
          <NavItem icon={<History />} label="Histórico" active={activeTab === 'history'} onClick={() => setActiveTab('history')} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-border-dark">
          <NavItem icon={<Settings />} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} collapsed={!isSidebarOpen} />
          <div className="mt-4 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">JS</div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">João Silva</span>
                <span className="text-xs text-slate-500 truncate">Administrador</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border-dark bg-secondary-dark/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                className="bg-background-dark border border-border-dark rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none w-64" 
                placeholder="Buscar..." 
              />
            </div>
            <button className="p-2 rounded-full hover:bg-white/5 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-secondary-dark"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
              <img src="https://picsum.photos/seed/admin/100/100" alt="Avatar" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3 border ${
                toast.type === 'success' 
                  ? 'bg-emerald-500 text-white border-emerald-400' 
                  : 'bg-red-500 text-white border-red-400'
              }`}
            >
              {toast.type === 'success' ? <CheckSquare size={20} /> : <X size={20} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
        active 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-primary'} transition-colors`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </span>
      {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
    </button>
  );
}

// --- Views ---

function DashboardView({ stats, onAction }: { stats: DashboardStats, onAction: (action: string) => void }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => {
        // Sort by quantity ascending to show low stock first
        const sorted = [...data].sort((a, b) => a.quantity - b.quantity);
        setMaterials(sorted.slice(0, 3)); // Show top 3
      })
      .catch(err => console.error("Error fetching materials for dashboard:", err));

    fetch('/api/quotes')
      .then(res => res.json())
      .then(data => {
        // Sort by date descending and take 5
        const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setQuotes(sorted.slice(0, 5));
      })
      .catch(err => console.error("Error fetching quotes for dashboard:", err));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-primary text-sm font-semibold uppercase tracking-wider">Painel Administrativo</p>
        <h1 className="text-4xl font-black tracking-tight">Visão Geral</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Orçamentos Pendentes" value={stats.pendingQuotes} trend="+12%" icon={<History />} color="primary" />
        <StatCard label="Total de Clientes" value={stats.totalClients} trend="Estável" icon={<Users />} color="blue" />
        <StatCard label="Faturamento Mensal" value={`R$ ${stats.monthlyRevenue.toLocaleString()}`} trend="+5.4%" icon={<Calculator />} color="emerald" />
        <StatCard label="Em Produção" value={stats.inProduction} trend="8 Urgentes" icon={<Construction />} color="yellow" />
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
                  value={Math.min(100, (m.quantity / 50) * 100)} // Assuming 50m2 is "full" for the bar
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
    </div>
  );
}

function StatCard({ label, value, trend, icon, color }: any) {
  const colors: any = {
    primary: 'text-primary bg-primary/10',
    blue: 'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    yellow: 'text-yellow-400 bg-yellow-400/10'
  };
  return (
    <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${trend.includes('+') ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-400/10'}`}>
          {trend}
        </span>
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ShortcutButton({ icon, label, sub, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary-dark border border-border-dark hover:border-primary transition-all text-left group"
    >
      <div className="size-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-slate-500 text-xs">{sub}</p>
      </div>
    </button>
  );
}

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

// --- Placeholder Views (To be implemented in next steps) ---

function ClientsView({ initialAction, onActionComplete, showToast }: { initialAction?: string | null, onActionComplete?: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', document: '', phone: '', address: '' });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Cliente removido.");
        fetchClients();
        setOpenMenuId(null);
      } else {
        showToast("Erro ao excluir cliente.", "error");
      }
    }
  };

  return (
    <div className="space-y-8">
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
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="Ex: Maria Oliveira" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">CPF / CNPJ</label>
                <input 
                  value={formData.document}
                  onChange={e => setFormData({...formData, document: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="000.000.000-00" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                <input 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="(00) 00000-0000" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                <input 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
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
            ) : clients.map(client => (
              <tr key={client.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{client.name}</td>
                <td className="px-6 py-4 text-slate-400 text-sm">{client.document}</td>
                <td className="px-6 py-4 text-slate-400 text-sm">{client.phone}</td>
                <td className="px-6 py-4 relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                    className="p-2 text-slate-500 hover:text-primary transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {openMenuId === client.id && (
                    <div className="absolute right-6 top-12 w-32 bg-secondary-dark border border-border-dark rounded-lg shadow-xl z-50 overflow-hidden">
                      <button 
                        onClick={() => handleEdit(client)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <Settings size={14} /> Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-2"
                      >
                        <X size={14} /> Excluir
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaterialsView({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '' });
  const [stockEntryMaterial, setStockEntryMaterial] = useState<Material | null>(null);
  const [stockAmount, setStockAmount] = useState('');

  const fetchMaterials = () => {
    fetch('/api/materials').then(r => r.json()).then(setMaterials);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/materials/${editingId}` : '/api/materials';
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity)
      })
    });
    
    if (res.ok) {
      showToast(editingId ? "Material atualizado!" : "Material cadastrado!");
      setFormData({ name: '', price: '', quantity: '', description: '' });
      setShowForm(false);
      setEditingId(null);
      fetchMaterials();
    } else {
      showToast("Erro ao salvar material.", "error");
    }
  };

  const handleEdit = (m: Material) => {
    setFormData({
      name: m.name,
      price: m.price.toString(),
      quantity: m.quantity.toString(),
      description: m.description || ''
    });
    setEditingId(m.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este material?')) {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Material removido.");
        fetchMaterials();
      } else {
        showToast("Erro ao excluir material.", "error");
      }
    }
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEntryMaterial || !stockAmount) return;

    const newQty = stockEntryMaterial.quantity + parseFloat(stockAmount);
    const res = await fetch(`/api/materials/${stockEntryMaterial.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });

    if (res.ok) {
      showToast(`Estoque atualizado: +${stockAmount} m²`);
      setStockEntryMaterial(null);
      setStockAmount('');
      fetchMaterials();
    } else {
      showToast("Erro ao atualizar estoque.", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Estoque de Pedras</h1>
          <p className="text-slate-500 text-sm">Controle de chapas e precificação por m².</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              setEditingId(null);
              setFormData({ name: '', price: '', quantity: '', description: '' });
            }
            setShowForm(!showForm);
          }}
          className="w-full sm:w-auto bg-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Adicionar Chapa'}
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
            <form onSubmit={handleSubmit} className="bg-secondary-dark p-6 rounded-xl border border-border-dark grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 mb-2">
                <h3 className="text-lg font-bold text-primary">{editingId ? 'Editar Material' : 'Novo Material'}</h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Material</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="Ex: Granito Preto Absoluto" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Preço por m² (R$)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="0.00" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Quantidade Inicial (m²)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="0.00" 
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                <input 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="Detalhes do material..." 
                />
              </div>
              <div className="md:col-span-3 flex justify-end pt-4">
                <button type="submit" className="bg-primary px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20">
                  {editingId ? 'Atualizar Material' : 'Cadastrar Material'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map(m => (
          <div key={m.id} className="bg-secondary-dark p-6 rounded-xl border border-border-dark hover:border-primary/50 transition-all relative group">
            <div className="absolute top-4 right-4 flex gap-2 transition-opacity">
              <button 
                onClick={() => handleEdit(m)}
                className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors text-primary"
                title="Editar"
              >
                <Settings size={14} />
              </button>
              <button 
                onClick={() => handleDelete(m.id)}
                className="p-1.5 bg-white/5 rounded-md hover:bg-red-500 hover:text-white transition-colors text-red-400"
                title="Excluir"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex justify-between items-start mb-4 pr-12">
              <h3 className="font-bold text-lg">{m.name}</h3>
              <span className="text-primary font-bold">R$ {m.price}/m²</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">{m.description}</p>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase font-bold">Estoque</span>
                <span className={`font-bold ${m.quantity < 5 ? 'text-orange-500' : 'text-white'}`}>{m.quantity} m²</span>
              </div>
              <button 
                onClick={() => setStockEntryMaterial(m)}
                className="p-2 bg-white/5 rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Entry Modal */}
      <AnimatePresence>
        {stockEntryMaterial && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold">Entrada de Material</h3>
                  <p className="text-slate-500 text-sm">{stockEntryMaterial.name}</p>
                </div>
                <button onClick={() => setStockEntryMaterial(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddStockSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade a Adicionar (m²)</label>
                  <input 
                    autoFocus
                    required
                    type="number"
                    step="0.01"
                    value={stockAmount}
                    onChange={e => setStockAmount(e.target.value)}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-4 text-2xl font-bold text-primary outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm text-slate-400">Novo Estoque Estimado:</span>
                  <span className="font-bold text-lg">
                    {(stockEntryMaterial.quantity + (parseFloat(stockAmount) || 0)).toFixed(2)} m²
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setStockEntryMaterial(null)}
                    className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Confirmar Entrada
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

function ServicesView({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', minutes_per_meter: '' });

  const fetchServices = () => {
    fetch('/api/services').then(r => r.json()).then(setServices);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/services/${editingId}` : '/api/services';
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price),
        minutes_per_meter: parseFloat(formData.minutes_per_meter) || 0
      })
    });
    
    if (res.ok) {
      showToast(editingId ? "Serviço atualizado!" : "Serviço cadastrado!");
      setFormData({ name: '', price: '', description: '', minutes_per_meter: '' });
      setShowForm(false);
      setEditingId(null);
      fetchServices();
    } else {
      showToast("Erro ao salvar serviço.", "error");
    }
  };

  const handleEdit = (s: Service) => {
    setFormData({
      name: s.name,
      price: s.price.toString(),
      description: s.description || '',
      minutes_per_meter: (s.minutes_per_meter || 0).toString()
    });
    setEditingId(s.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este serviço?')) {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Serviço removido.");
        fetchServices();
      } else {
        showToast("Erro ao excluir serviço.", "error");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Catálogo de Serviços</h1>
          <p className="text-slate-500 text-sm">Gerencie os serviços e acabamentos oferecidos.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              setEditingId(null);
              setFormData({ name: '', price: '', description: '', minutes_per_meter: '' });
            }
            setShowForm(!showForm);
          }}
          className="w-full sm:w-auto bg-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Novo Serviço'}
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
                <h3 className="text-lg font-bold text-primary">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Serviço</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="Ex: Meia Esquadria 45°" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Preço Base (R$)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="0.00" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Minutos por Metro (min/m)</label>
                <input 
                  type="number"
                  step="1"
                  value={formData.minutes_per_meter}
                  onChange={e => setFormData({...formData, minutes_per_meter: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="Ex: 15" 
                />
              </div>
              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                <input 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="Detalhes sobre o serviço..." 
                />
              </div>
              <div className="md:col-span-2 flex justify-end pt-4">
                <button type="submit" className="bg-primary px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20">
                  {editingId ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(s => (
          <div key={s.id} className="bg-secondary-dark p-6 rounded-xl border border-border-dark hover:border-primary/50 transition-all relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(s)}
                className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors"
                title="Editar"
              >
                <Settings size={14} />
              </button>
              <button 
                onClick={() => handleDelete(s.id)}
                className="p-1.5 bg-white/5 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                title="Excluir"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex justify-between items-start mb-4 pr-12">
              <h3 className="font-bold text-lg">{s.name}</h3>
              <div className="text-right">
                <p className="text-primary font-bold">R$ {s.price}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{s.minutes_per_meter || 0} min/m</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuotesView({ editId, onSave, onCancel, showToast }: { editId?: number | null, onSave: () => void, onCancel: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [descriptionTemplates, setDescriptionTemplates] = useState<{id: number, text: string}[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [quoteItems, setQuoteItems] = useState([{ materialId: '', length: 0, width: 0, quantity: 1, description: '' }]);
  const [quoteServices, setQuoteServices] = useState<{ serviceId: string, quantity: number, unitPrice: number, description: string }[]>([]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
    fetch('/api/materials').then(r => r.json()).then(setMaterials);
    fetch('/api/services').then(r => r.json()).then(setServicesList);
    fetch('/api/description-templates').then(r => r.json()).then(setDescriptionTemplates);
  }, []);

  useEffect(() => {
    if (editId) {
      fetch(`/api/quotes/${editId}`)
        .then(r => r.json())
        .then(data => {
          setSelectedClientId(data.client_id.toString());
          setProjectName(data.project_name);
          setQuoteItems(data.items.map((item: any) => ({
            materialId: item.material_id.toString(),
            length: item.length,
            width: item.width,
            quantity: item.quantity,
            description: item.description
          })));
          setQuoteServices(data.services.map((s: any) => ({
            serviceId: s.service_id.toString(),
            quantity: s.quantity,
            unitPrice: s.unit_price,
            description: s.description
          })));
        });
    } else {
      // Reset form if not editing
      setSelectedClientId('');
      setProjectName('');
      setQuoteItems([{ materialId: '', length: 0, width: 0, quantity: 1, description: '' }]);
      setQuoteServices([]);
    }
  }, [editId]);

  const addItem = () => {
    setQuoteItems([...quoteItems, { materialId: '', length: 0, width: 0, quantity: 1, description: '' }]);
  };

  const addQuoteService = () => {
    setQuoteServices([...quoteServices, { serviceId: '', quantity: 1, unitPrice: 0, description: '' }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...quoteItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setQuoteItems(newItems);
  };

  const updateQuoteService = (index: number, field: string, value: any) => {
    const newServices = [...quoteServices];
    const updatedService = { ...newServices[index], [field]: value };
    
    // If serviceId changed, update unitPrice automatically
    if (field === 'serviceId') {
      const service = servicesList.find(s => s.id.toString() === value);
      if (service) {
        updatedService.unitPrice = service.price;
      }
    }
    
    newServices[index] = updatedService;
    setQuoteServices(newServices);
  };

  const calculateSubtotal = (item: any) => {
    const material = materials.find(m => m.id.toString() === item.materialId);
    if (!material) return 0;
    return item.length * item.width * item.quantity * material.price;
  };

  const calculateServiceSubtotal = (item: any) => {
    return item.quantity * item.unitPrice;
  };

  const totalMaterials = quoteItems.reduce((acc, item) => acc + calculateSubtotal(item), 0);
  const totalServices = quoteServices.reduce((acc, item) => acc + calculateServiceSubtotal(item), 0);
  const totalArea = quoteItems.reduce((acc, item) => acc + (item.length * item.width * item.quantity), 0);
  
  const totalMinutes = quoteServices.reduce((acc, item) => {
    const service = servicesList.find(s => s.id.toString() === item.serviceId);
    if (!service) return acc;
    return acc + (item.quantity * (service.minutes_per_meter || 0));
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round(totalMinutes % 60);
  
  // We'll keep the area-based labor as a "Base Labor" if desired, 
  // but explicit services are usually preferred now.
  // For now, let's make totalValue = materials + explicit services
  const totalValue = totalMaterials + totalServices;

  const handleSaveQuote = async () => {
    if (!selectedClientId || !projectName) {
      showToast("Selecione um cliente e dê um nome ao projeto.", "error");
      return;
    }

    try {
      const items = quoteItems.map(item => ({
        material_id: parseInt(item.materialId),
        length: item.length,
        width: item.width,
        quantity: item.quantity,
        subtotal_m2: item.length * item.width,
        description: item.description
      }));

      const services = quoteServices.map(s => ({
        service_id: parseInt(s.serviceId),
        quantity: s.quantity,
        unit_price: s.unitPrice,
        description: s.description
      }));

      const res = await fetch(editId ? `/api/quotes/${editId}` : '/api/quotes', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(selectedClientId),
          project_name: projectName,
          total_value: totalValue,
          discount: 0,
          items,
          services
        })
      });

      if (res.ok) {
        showToast(editId ? "Orçamento atualizado com sucesso!" : "Orçamento salvo com sucesso!");
        setProjectName('');
        setSelectedClientId('');
        setQuoteItems([{ materialId: '', length: 0, width: 0, quantity: 1, description: '' }]);
        setQuoteServices([]);
        onSave();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Erro ao salvar orçamento.", "error");
      }
    } catch (error) {
      console.error("Error saving quote:", error);
      showToast("Erro de conexão ao salvar orçamento.", "error");
    }
  };

  const handleDeleteQuote = async () => {
    if (!editId) return;
    if (confirm('Deseja realmente excluir este orçamento?')) {
      try {
        const res = await fetch(`/api/quotes/${editId}`, { method: 'DELETE' });
        if (res.ok) {
          showToast("Orçamento excluído com sucesso!");
          onCancel();
        } else {
          showToast("Erro ao excluir orçamento.", "error");
        }
      } catch (error) {
        showToast("Erro de conexão ao excluir orçamento.", "error");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {editId ? `Editando Orçamento #${editId}` : 'Calculadora de Orçamentos'}
          </h1>
          <p className="text-slate-500 text-sm">
            {editId ? 'Atualize os dados do orçamento selecionado.' : 'Gere orçamentos precisos em segundos.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {editId && (
            <>
              <button 
                onClick={handleSaveQuote}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Plus size={18} className="rotate-0" /> Atualizar
              </button>
              <button 
                onClick={handleDeleteQuote}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <X size={18} /> Excluir
              </button>
              <button 
                onClick={onCancel}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-bold border border-border-dark hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
            <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary text-sm"
              >
                <option value="">Selecionar Cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input 
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary text-sm" 
                placeholder="Projeto / Referência (Ex: Cozinha Gourmet)" 
              />
            </div>
          </div>

          <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Materiais e Medidas</h3>
              <button 
                onClick={addItem}
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <Plus size={16} /> Adicionar Item
              </button>
            </div>
            
            <div className="space-y-4">
              {quoteItems.map((item, index) => (
                <div key={index} className="p-4 rounded-lg bg-background-dark border border-border-dark grid grid-cols-1 md:grid-cols-6 gap-4 items-end relative group">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Material</label>
                    <select 
                      value={item.materialId}
                      onChange={e => updateItem(index, 'materialId', e.target.value)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Selecione</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descrição / Peça</label>
                    <input 
                      list="description-templates"
                      value={item.description || ''}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm" 
                      placeholder="Ex: Bancada Pia, Rodapé, etc." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Comp. (m)</label>
                    <input 
                      type="number" step="0.01"
                      value={item.length}
                      onChange={e => updateItem(index, 'length', parseFloat(e.target.value) || 0)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Larg. (m)</label>
                    <input 
                      type="number" step="0.01"
                      value={item.width}
                      onChange={e => updateItem(index, 'width', parseFloat(e.target.value) || 0)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Qtd</label>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Subtotal</label>
                    <div className="bg-white/5 px-3 py-2 rounded-lg text-sm font-bold">
                      R$ {calculateSubtotal(item).toLocaleString()}
                    </div>
                  </div>
                  {quoteItems.length > 1 && (
                    <button 
                      onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== index))}
                      className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Construction className="w-5 h-5 text-primary" /> Serviços e Acabamentos</h3>
              <button 
                onClick={addQuoteService}
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <Plus size={16} /> Adicionar Serviço
              </button>
            </div>
            
            <div className="space-y-4">
              {quoteServices.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border-dark rounded-xl text-slate-500 text-sm">
                  Nenhum serviço extra adicionado.
                </div>
              ) : (
                quoteServices.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-background-dark border border-border-dark grid grid-cols-1 md:grid-cols-6 gap-4 items-end relative group">
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Serviço</label>
                      <select 
                        value={item.serviceId}
                        onChange={e => updateQuoteService(index, 'serviceId', e.target.value)}
                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Selecione</option>
                        {servicesList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.minutes_per_meter} min/m)</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Descrição / Detalhe</label>
                      <input 
                        list="description-templates"
                        value={item.description || ''}
                        onChange={e => updateQuoteService(index, 'description', e.target.value)}
                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm" 
                        placeholder="Ex: Acabamento boleado, Instalação inclusa..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Qtd</label>
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={e => updateQuoteService(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Preço Unit.</label>
                      <input 
                        type="number" step="0.01"
                        value={item.unitPrice}
                        onChange={e => updateQuoteService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Subtotal</label>
                      <div className="bg-white/5 px-3 py-2 rounded-lg text-sm font-bold">
                        R$ {calculateServiceSubtotal(item).toLocaleString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => setQuoteServices(quoteServices.filter((_, i) => i !== index))}
                      className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <datalist id="description-templates">
          {descriptionTemplates.map(t => <option key={t.id} value={t.text} />)}
        </datalist>

        <div className="xl:col-span-1">
          <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark sticky top-24 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" /> Resumo</h3>
            <div className="space-y-3">
              <SummaryItem label="Total Materiais" value={`R$ ${totalMaterials.toLocaleString()}`} />
              <SummaryItem label="Total Serviços" value={`R$ ${totalServices.toLocaleString()}`} />
              <SummaryItem label="Área Total" value={`${totalArea.toFixed(2)} m²`} />
              <SummaryItem label="Tempo Estimado" value={`${totalHours}h ${remainingMinutes}min`} />
            </div>
            <div className="pt-6 border-t border-border-dark">
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase mb-1">Total Estimado</p>
                <p className="text-3xl font-black text-primary">R$ {totalValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleSaveQuote}
                className="py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                {editId ? 'Atualizar' : 'Salvar'}
              </button>
              <button className="py-3 bg-white/5 text-white font-bold rounded-xl border border-border-dark hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                <Download size={18} /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-white/5">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function HistoryView({ onEdit, showToast }: { onEdit: (id: number) => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotes');
      const data = await res.json();
      setQuotes(data);
    } catch (err) {
      console.error("Error fetching quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

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
    if (confirm('Deseja realmente excluir este orçamento?')) {
      try {
        const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast("Orçamento excluído.");
          fetchQuotes();
        } else {
          showToast("Erro ao excluir orçamento.", "error");
        }
      } catch (error) {
        showToast("Erro de conexão.", "error");
      }
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
        showToast(`Status atualizado para ${status}`);
        fetchQuotes();
      } else {
        showToast("Erro ao atualizar status.", "error");
      }
    } catch (error) {
      showToast("Erro de conexão.", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Histórico de Orçamentos</h1>
        <p className="text-slate-500">Visualize e gerencie todos os orçamentos gerados.</p>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <p className="text-center py-8 text-slate-500">Carregando...</p>
        ) : quotes.length === 0 ? (
          <p className="text-center py-8 text-slate-500">Nenhum orçamento encontrado.</p>
        ) : (
          quotes.map(quote => (
            <div 
              key={quote.id} 
              className="bg-secondary-dark p-4 rounded-xl border border-border-dark space-y-3"
              onClick={() => onEdit(quote.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-slate-500">#{quote.id}</span>
                  <h3 className="font-bold text-sm">{quote.client_name}</h3>
                  <p className="text-xs text-slate-400">{quote.project_name}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getStatusColor(quote.status)}`}>
                  {quote.status}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-primary font-bold">R$ {quote.total_value.toLocaleString()}</span>
                <span className="text-xs text-slate-500">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
                <select 
                  value={quote.status}
                  onChange={(e) => updateStatus(quote.id, e.target.value)}
                  className="flex-1 bg-white/5 border border-border-dark rounded-lg px-2 py-2 text-[10px] font-bold uppercase outline-none"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Em Produção">Em Produção</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
                <button 
                  onClick={() => handleDelete(quote.id)}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table */}
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
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Carregando orçamentos...</td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Nenhum orçamento encontrado.</td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr 
                  key={quote.id} 
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => onEdit(quote.id)}
                >
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">#{quote.id}</td>
                  <td className="px-6 py-4 text-sm font-bold">{quote.client_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{quote.project_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">
                    R$ {quote.total_value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                      <select 
                        value={quote.status}
                        onChange={(e) => updateStatus(quote.id, e.target.value)}
                        className="bg-transparent border-none text-[10px] font-bold uppercase text-slate-500 outline-none cursor-pointer hover:text-white transition-colors"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Em Produção">Em Produção</option>
                        <option value="Entregue">Entregue</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => onEdit(quote.id)}
                        className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors text-primary" 
                        title="Editar Orçamento"
                      >
                        <Settings size={14} />
                      </button>
                      <button className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors text-slate-400" title="Ver Detalhes">
                        <Info size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(quote.id)}
                        className="p-1.5 bg-white/5 rounded-md hover:bg-red-500 hover:text-white transition-colors text-red-400" 
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
    </div>
  );
}

function SettingsView({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [templates, setTemplates] = useState<{id: number, text: string}[]>([]);
  const [newTemplate, setNewTemplate] = useState('');

  const fetchTemplates = () => {
    fetch('/api/description-templates').then(r => r.json()).then(setTemplates);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.trim()) return;

    const res = await fetch('/api/description-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newTemplate })
    });

    if (res.ok) {
      setNewTemplate('');
      fetchTemplates();
      showToast("Descrição adicionada com sucesso!");
    } else {
      showToast("Esta descrição já existe ou ocorreu um erro.", "error");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm('Deseja excluir esta sugestão?')) {
      const res = await fetch(`/api/description-templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTemplates();
        showToast("Descrição removida.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Configurações</h1>
        <p className="text-slate-500">Gerencie as preferências e listas do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Layers className="w-5 h-5" /> Sugestões de Descrição
          </h3>
          <p className="text-sm text-slate-400">
            Cadastre aqui as descrições que mais utiliza (ex: Bancada, Rodapé, Soleira) para que apareçam como sugestão na calculadora.
          </p>

          <form onSubmit={handleAddTemplate} className="flex gap-2">
            <input 
              value={newTemplate}
              onChange={e => setNewTemplate(e.target.value)}
              className="flex-1 bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
              placeholder="Nova descrição..."
            />
            <button type="submit" className="bg-primary p-2 rounded-lg text-white hover:opacity-90 transition-opacity">
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {templates.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-background-dark rounded-lg border border-border-dark group">
                <span className="text-sm">{t.text}</span>
                <button 
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-center py-4 text-slate-500 text-sm italic">Nenhuma sugestão cadastrada.</p>
            )}
          </div>
        </div>

        <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6 opacity-50 cursor-not-allowed">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-400">
            <Bolt className="w-5 h-5" /> Outras Configurações
          </h3>
          <p className="text-sm text-slate-500 italic">Em breve: Backup, Usuários e Logotipo.</p>
        </div>
      </div>
    </div>
  );
}

function CutPlanView({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [sheetWidth, setSheetWidth] = useState<number>(3000); // 3000mm default
  const [sheetHeight, setSheetHeight] = useState<number>(1800); // 1800mm default
  const [sawThickness, setSawThickness] = useState<number>(5); // 5mm default
  const [items, setItems] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [stockMaterials, setStockMaterials] = useState<Material[]>([]);
  const [allowRotation, setAllowRotation] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [manualItem, setManualItem] = useState({ 
    description: '', 
    width: '', 
    length: '', 
    quantity: '1',
    material_name: '',
    finishing: 'Polido',
    edges: { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' }
  });
  const [manualPositions, setManualPositions] = useState<Record<string, { x: number, y: number, rotated: boolean }>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showOpenPlans, setShowOpenPlans] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);

  const fetchSavedPlans = () => {
    fetch('/api/cut-plans').then(r => r.json()).then(setSavedPlans);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    try {
      const res = await fetch('/api/cut-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          items,
          plan,
          manual_positions: manualPositions,
          sheet_width: sheetWidth,
          sheet_height: sheetHeight,
          saw_thickness: sawThickness
        })
      });

      if (res.ok) {
        showToast('Plano salvo com sucesso!');
        setShowSaveModal(false);
        setPlanName('');
      } else {
        showToast('Erro ao salvar plano.', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao salvar plano.', 'error');
    }
  };

  const handleLoadPlan = async (id: number) => {
    try {
      const res = await fetch(`/api/cut-plans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setPlan(data.plan);
        setManualPositions(data.manual_positions);
        setSheetWidth(data.sheet_width);
        setSheetHeight(data.sheet_height);
        setSawThickness(data.saw_thickness);
        setShowOpenPlans(false);
        showToast('Plano carregado com sucesso!');
      } else {
        showToast('Erro ao carregar plano.', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao carregar plano.', 'error');
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm('Deseja excluir este plano?')) {
      try {
        const res = await fetch(`/api/cut-plans/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Plano excluído.');
          fetchSavedPlans();
        } else {
          showToast('Erro ao excluir plano.', 'error');
        }
      } catch (error) {
        showToast('Erro de conexão ao excluir plano.', 'error');
      }
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('sheet-container');
    if (!element) return;
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`plano-de-corte-${Date.now()}.pdf`);
  };

  const updateCuts = () => {
    setManualPositions({});
    generatePlan();
  };

  const EDGE_TYPES = ['Nenhum', 'Reto', 'Reto duplo', 'Boleado', 'Meia esquadria'];
  const FINISHING_TYPES = ['Polido', 'Levigado', 'Escovado', 'Bruto', 'Jateado'];

  useEffect(() => {
    fetch('/api/quotes').then(r => r.json()).then(setQuotes);
    fetch('/api/materials').then(r => r.json()).then(setStockMaterials);
  }, []);

  const handleImport = async () => {
    if (!selectedQuoteId) return;
    try {
      const res = await fetch(`/api/quotes/${selectedQuoteId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          // Extract unique materials
          const materials = Array.from(new Set(data.items.map((item: any) => item.material_name))) as string[];
          setAvailableMaterials(materials);
          if (materials.length > 0) setSelectedMaterial(materials[0]);

          // Flatten items based on quantity
          const flattened: any[] = [];
          data.items.forEach((item: any) => {
            for (let i = 0; i < item.quantity; i++) {
              flattened.push({
                id: `${item.id}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                width: Math.round(item.width * 1000), // convert to mm
                length: Math.round(item.length * 1000), // convert to mm
                description: item.description,
                material_name: item.material_name,
                edges: { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' }
              });
            }
          });
          setItems(flattened);
          showToast(`${flattened.length} peças importadas.`);
        }
      } else {
        showToast('Erro ao importar orçamento.', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao importar.', 'error');
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(manualItem.quantity) || 1;
    const newItems = [];
    for (let i = 0; i < qty; i++) {
      newItems.push({
        id: `manual-${Date.now()}-${i}`,
        width: parseInt(manualItem.width),
        length: parseInt(manualItem.length),
        description: manualItem.description || 'Peça Manual',
        material_name: manualItem.material_name || 'Manual',
        finishing: manualItem.finishing,
        edges: { ...manualItem.edges }
      });
    }
    setItems([...items, ...newItems]);
    setManualItem({ 
      description: '', 
      width: '', 
      length: '', 
      quantity: '1',
      material_name: '',
      finishing: 'Polido',
      edges: { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' }
    });
    setShowManualAdd(false);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Find original item to check if dimensions changed
    const originalItem = items.find(it => it.id === editingItem.id);
    const dimensionsChanged = originalItem && (originalItem.width !== editingItem.width || originalItem.length !== editingItem.length);

    setItems(items.map(item => 
      item.id === editingItem.id ? { ...editingItem } : item
    ));
    
    // If dimensions changed, clear manual position to avoid invalid placement
    if (dimensionsChanged) {
      const newManualPositions = { ...manualPositions };
      delete newManualPositions[editingItem.id];
      setManualPositions(newManualPositions);
    }

    setEditingItem(null);
    // Force plan regeneration
    setTimeout(generatePlan, 0);
  };

  const toggleRotation = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, width: item.length, length: item.width };
      }
      return item;
    }));
    
    // Clear manual position for this item to let it be re-packed
    const newManualPositions = { ...manualPositions };
    delete newManualPositions[id];
    setManualPositions(newManualPositions);
  };

  const handleDragStart = (e: React.MouseEvent, id: string, x: number, y: number) => {
    setDraggedItemId(id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) * 5, // Scale back to mm
      y: (e.clientY - rect.top) * 5
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!draggedItemId) return;

    const container = document.getElementById('sheet-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const itemInPlan = plan.find(p => p.id === draggedItemId);
    if (!itemInPlan) return;

    // Calculate proposed position
    let newX = (e.clientX - rect.left) * 5 - dragOffset.x;
    let newY = (e.clientY - rect.top) * 5 - dragOffset.y;

    // Bounds check
    newX = Math.max(0, Math.min(sheetWidth - itemInPlan.width, newX));
    newY = Math.max(0, Math.min(sheetHeight - itemInPlan.length, newY));

    // Collision check
    const hasCollision = plan.some(other => {
      if (other.id === draggedItemId || other.sheetIndex !== itemInPlan.sheetIndex) return false;
      return (
        newX < other.x + other.width + sawThickness &&
        newX + itemInPlan.width + sawThickness > other.x &&
        newY < other.y + other.length + sawThickness &&
        newY + itemInPlan.length + sawThickness > other.y
      );
    });

    if (!hasCollision) {
      setManualPositions({
        ...manualPositions,
        [draggedItemId]: { 
          x: Math.round(newX), 
          y: Math.round(newY), 
          rotated: itemInPlan.rotated 
        }
      });

      setPlan(plan.map(p => 
        p.id === draggedItemId ? { ...p, x: Math.round(newX), y: Math.round(newY) } : p
      ));
    }
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const generatePlan = () => {
    // Filter items by material if not 'all'
    const filteredItems = selectedMaterial === 'all' 
      ? items 
      : items.filter(item => item.material_name === selectedMaterial || item.material_name === 'Manual');

    if (filteredItems.length === 0) {
      setPlan([]);
      return;
    }

    // Separate items into manual and auto
    const manualItems = filteredItems.filter(item => manualPositions[item.id]);
    const autoItems = filteredItems.filter(item => !manualPositions[item.id]);

    const currentPlan: any[] = [];
    let currentSheetIndex = 0;

    // Place manual items first (on first sheet)
    manualItems.forEach(item => {
      const pos = manualPositions[item.id];
      currentPlan.push({
        ...item,
        x: pos.x,
        y: pos.y,
        rotated: pos.rotated,
        width: pos.rotated ? item.length : item.width,
        length: pos.rotated ? item.width : item.length,
        sheetIndex: 0
      });
    });

    // Simple Shelf Packing Algorithm for the rest
    const sortedItems = [...autoItems].sort((a, b) => b.length - a.length);
    
    let currentX = 0;
    let currentY = 0;
    let shelfHeight = 0;

    sortedItems.forEach(item => {
      let w = item.width;
      let l = item.length;
      let rotated = false;

      // Try to rotate if allowed
      if (allowRotation) {
        if (currentX + w > sheetWidth && currentX + l <= sheetWidth) {
          [w, l] = [l, w];
          rotated = true;
        } 
        else if (currentX + l <= sheetWidth && l < w) {
          [w, l] = [l, w];
          rotated = true;
        }
      }

      // Check if item fits in current shelf
      if (currentX + w > sheetWidth) {
        currentX = 0;
        currentY += shelfHeight + sawThickness;
        shelfHeight = 0;
      }

      // Check if item fits in current sheet
      if (currentY + l > sheetHeight) {
        // Start new sheet
        currentSheetIndex++;
        currentX = 0;
        currentY = 0;
        shelfHeight = 0;
        
        // Re-check if it fits in the new empty sheet
        if (currentX + w > sheetWidth) {
           // Item too wide for sheet even when empty
           return;
        }
      }

      if (currentY + l <= sheetHeight) {
        currentPlan.push({
          ...item,
          width: w,
          length: l,
          rotated,
          x: currentX,
          y: currentY,
          sheetIndex: currentSheetIndex
        });

        currentX += w + sawThickness;
        shelfHeight = Math.max(shelfHeight, l);
      }
    });

    setPlan(currentPlan);
  };

  useEffect(() => {
    generatePlan();
  }, [items, sheetWidth, sheetHeight, sawThickness, allowRotation, selectedMaterial, manualPositions]);

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearItems = () => {
    if (confirm('Deseja limpar todas as peças?')) {
      setItems([]);
      setPlan([]);
      setAvailableMaterials([]);
      setSelectedMaterial('all');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight">Plano de Corte</h1>
          <p className="text-slate-500 text-sm">Otimize o corte das chapas de pedra.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => { fetchSavedPlans(); setShowOpenPlans(true); }}
            className="flex-1 sm:flex-none bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all text-sm"
          >
            <FolderOpen size={16} /> Abrir
          </button>
          <button 
            onClick={() => setShowManualAdd(true)}
            className="flex-1 sm:flex-none bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all text-sm"
          >
            <Plus size={16} /> Peça Manual
          </button>
          <button 
            onClick={clearItems}
            className="flex-1 sm:flex-none bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all text-sm"
          >
            <X size={16} /> Limpar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary"><Download size={16} /> Importar Orçamento</h3>
            <div className="flex gap-2">
              <select 
                value={selectedQuoteId}
                onChange={e => setSelectedQuoteId(e.target.value)}
                className="flex-1 bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecionar...</option>
                {quotes.map(q => (
                  <option key={q.id} value={q.id}>#{q.id} - {q.client_name}</option>
                ))}
              </select>
              <button 
                onClick={handleImport}
                disabled={!selectedQuoteId}
                className="bg-primary px-3 py-2 rounded-lg font-bold text-xs disabled:opacity-50"
              >
                OK
              </button>
            </div>
          </div>

          <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary"><Settings size={16} /> Configurações</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Largura (mm)</label>
                <input 
                  type="number"
                  value={sheetWidth}
                  onChange={e => setSheetWidth(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Altura (mm)</label>
                <input 
                  type="number"
                  value={sheetHeight}
                  onChange={e => setSheetHeight(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Serra (mm)</label>
                <input 
                  type="number"
                  value={sawThickness}
                  onChange={e => setSawThickness(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-[10px] font-medium text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={allowRotation}
                    onChange={e => setAllowRotation(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                  />
                  Rotação
                </label>
              </div>
            </div>
          </div>

          {availableMaterials.length > 0 && (
            <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary"><Layers size={16} /> Filtrar Material</h3>
              <select 
                value={selectedMaterial}
                onChange={e => setSelectedMaterial(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos</option>
                {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          
          {items.length > 0 && (
            <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark">
              <h3 className="text-sm font-bold mb-3 flex justify-between items-center">
                <span>Peças ({items.length})</span>
              </h3>
              
              {/* Pieces per Material Summary */}
              <div className="mb-4 space-y-1">
                {Object.entries(items.reduce((acc: any, item) => {
                  acc[item.material_name] = (acc[item.material_name] || 0) + 1;
                  return acc;
                }, {})).map(([mat, count]: [string, any]) => (
                  <div key={mat} className="flex justify-between text-[9px] text-slate-400 border-b border-white/5 pb-1">
                    <span>{mat}</span>
                    <span className="font-bold text-primary">{count} un</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {items.map((item) => (
                  <div key={item.id} className="text-[10px] p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-colors">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold truncate">{item.description || 'Peça'}</span>
                      <span className="text-[8px] text-slate-500 truncate">{item.material_name} • {item.finishing || 'Polido'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-slate-400">{item.width}x{item.length}</span>
                      <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="bg-secondary-dark p-4 sm:p-6 rounded-xl border border-border-dark overflow-hidden relative min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold flex items-center gap-2"><Scissors size={16} className="text-primary" /> Visualização</h3>
                <button 
                  onClick={updateCuts}
                  className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                  title="Atualizar Cortes"
                >
                  <RotateCw size={14} />
                </button>
              </div>
              {plan.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Área Peças: <span className="text-primary font-bold">
                      {(plan.reduce((acc, item) => acc + (item.width * item.length), 0) / 1000000).toFixed(2)} m²
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Sobra: <span className="text-orange-400 font-bold">
                      {((sheetWidth * sheetHeight * (Math.max(0, ...plan.map(p => p.sheetIndex || 0)) + 1) - plan.reduce((acc, item) => acc + (item.width * item.length), 0)) / 1000000).toFixed(2)} m²
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Cortes: <span className="text-blue-400 font-bold">
                      {plan.length + (new Set(plan.map(p => `${p.sheetIndex}-${p.y}`)).size)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Aproveitamento: <span className="text-emerald-500 font-bold">
                      {((plan.reduce((acc, item) => acc + (item.width * item.length), 0) / (sheetWidth * sheetHeight * (Math.max(0, ...plan.map(p => p.sheetIndex || 0)) + 1))) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {plan.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 py-12">
                <Scissors size={32} className="opacity-20" />
                <p className="text-sm">Importe um orçamento ou adicione peças manuais.</p>
              </div>
            ) : (
              <div 
                id="sheet-container"
                className="relative flex-1 bg-background-dark border-2 border-dashed border-slate-700 rounded-lg overflow-auto p-4 flex flex-col items-center gap-8 cursor-crosshair select-none scrollbar-thin"
                onMouseMove={handleDrag}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                {Array.from({ length: Math.max(0, ...plan.map(p => p.sheetIndex || 0)) + 1 }).map((_, sIdx) => (
                  <div key={sIdx} className="relative flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chapa {sIdx + 1}</span>
                    <div 
                      className="relative bg-slate-800 border border-slate-600 shadow-2xl transition-all"
                      style={{ 
                        width: `${sheetWidth / 5}px`, 
                        height: `${sheetHeight / 5}px`,
                        minWidth: `${sheetWidth / 5}px`,
                        minHeight: `${sheetHeight / 5}px`
                      }}
                    >
                      {plan.filter(item => (item.sheetIndex || 0) === sIdx).map((item) => (
                        <div 
                          key={item.id}
                          className={`absolute border flex flex-col items-center justify-center overflow-hidden group transition-all cursor-move ${draggedItemId === item.id ? 'z-50 ring-2 ring-primary shadow-2xl' : ''} ${item.material_name === 'Manual' ? 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/40' : 'bg-primary/20 border-primary/50 hover:bg-primary/40'}`}
                          style={{
                            left: `${item.x / 5}px`,
                            top: `${item.y / 5}px`,
                            width: `${item.width / 5}px`,
                            height: `${item.length / 5}px`
                          }}
                          onMouseDown={(e) => handleDragStart(e, item.id, item.x, item.y)}
                          title={`${item.description} (${item.width}x${item.length}mm) - ${item.material_name} - ${item.finishing || 'Polido'}`}
                        >
                          <span className="text-[7px] font-bold text-white truncate w-full text-center px-1">{item.description}</span>
                          <span className="text-[6px] text-slate-400">{item.width}x{item.length}</span>
                          
                          <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleRotation(item.id); }}
                              className="p-0.5 bg-black/50 rounded hover:bg-primary text-white"
                            >
                              <RotateCw size={8} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                              className="p-0.5 bg-black/50 rounded hover:bg-primary text-white"
                            >
                              <Edit2 size={8} />
                            </button>
                          </div>

                          {/* Edge Indicators - Dashed yellow lines inside */}
                          {item.edges?.top !== 'Nenhum' && <div className="absolute top-1 left-1 right-1 h-0 border-t border-dashed border-yellow-500 z-10" />}
                          {item.edges?.bottom !== 'Nenhum' && <div className="absolute bottom-1 left-1 right-1 h-0 border-b border-dashed border-yellow-500 z-10" />}
                          {item.edges?.left !== 'Nenhum' && <div className="absolute top-1 bottom-1 left-1 w-0 border-l border-dashed border-yellow-500 z-10" />}
                          {item.edges?.right !== 'Nenhum' && <div className="absolute top-1 bottom-1 right-1 w-0 border-r border-dashed border-yellow-500 z-10" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-[10px] text-slate-500 italic">
                * Escala 1:5 | Dimensões em mm
              </div>
              {plan.length > 0 && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setShowSaveModal(true)}
                    className="flex-1 sm:flex-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all text-xs"
                  >
                    <Save size={14} /> Salvar
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="flex-1 sm:flex-none bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all text-xs"
                  >
                    <Download size={14} /> Exportar PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Plan Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-primary">Salvar Plano de Corte</h3>
                <button onClick={() => setShowSaveModal(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Plano</label>
                  <input 
                    autoFocus
                    required
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ex: Cozinha Cliente X - Chapa 1"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 py-3 rounded-lg font-bold text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Salvar Plano
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Open Plans Modal */}
      <AnimatePresence>
        {showOpenPlans && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Planos de Corte Salvos</h3>
                <button onClick={() => setShowOpenPlans(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {savedPlans.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-background-dark rounded-lg border border-border-dark group hover:border-primary/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{p.name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleLoadPlan(p.id)}
                        className="bg-primary/10 text-primary px-3 py-1 rounded text-xs font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        Abrir
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(p.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {savedPlans.length === 0 && (
                  <p className="text-center py-8 text-slate-500 text-sm italic">Nenhum plano salvo.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {showManualAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Nova Peça Manual</h3>
                <button onClick={() => setShowManualAdd(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleManualAdd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                    <input 
                      required
                      value={manualItem.description}
                      onChange={e => setManualItem({...manualItem, description: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: Rodapé"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
                    <select 
                      required
                      value={manualItem.material_name}
                      onChange={e => setManualItem({...manualItem, material_name: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Selecionar...</option>
                      {stockMaterials.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Largura (mm)</label>
                    <input 
                      required
                      type="number"
                      value={manualItem.width}
                      onChange={e => setManualItem({...manualItem, width: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Compr. (mm)</label>
                    <input 
                      required
                      type="number"
                      value={manualItem.length}
                      onChange={e => setManualItem({...manualItem, length: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd</label>
                    <input 
                      required
                      type="number"
                      value={manualItem.quantity}
                      onChange={e => setManualItem({...manualItem, quantity: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Acabamento</label>
                  <select 
                    required
                    value={manualItem.finishing}
                    onChange={e => setManualItem({...manualItem, finishing: e.target.value})}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    {FINISHING_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bordas</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['top', 'bottom', 'left', 'right'].map((side) => (
                      <div key={side} className="bg-background-dark p-2 rounded border border-border-dark space-y-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={manualItem.edges[side as keyof typeof manualItem.edges] !== 'Nenhum'}
                            onChange={(e) => {
                              const newEdges = { ...manualItem.edges };
                              newEdges[side as keyof typeof manualItem.edges] = e.target.checked ? 'Reto' : 'Nenhum';
                              setManualItem({ ...manualItem, edges: newEdges });
                            }}
                            className="w-3 h-3 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{side === 'top' ? 'Topo' : side === 'bottom' ? 'Base' : side === 'left' ? 'Esq.' : 'Dir.'}</span>
                        </div>
                        {manualItem.edges[side as keyof typeof manualItem.edges] !== 'Nenhum' && (
                          <select 
                            value={manualItem.edges[side as keyof typeof manualItem.edges]}
                            onChange={(e) => {
                              const newEdges = { ...manualItem.edges };
                              newEdges[side as keyof typeof manualItem.edges] = e.target.value;
                              setManualItem({ ...manualItem, edges: newEdges });
                            }}
                            className="w-full bg-transparent text-[9px] outline-none text-primary border-t border-white/5 pt-1"
                          >
                            {EDGE_TYPES.filter(t => t !== 'Nenhum').map(type => (
                              <option key={type} value={type} className="bg-secondary-dark">{type}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowManualAdd(false)}
                    className="flex-1 py-2 rounded-lg font-bold text-xs text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity text-xs"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Editar Peça</h3>
                <button onClick={() => setEditingItem(null)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                    <input 
                      required
                      value={editingItem.description}
                      onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
                    <select 
                      required
                      value={editingItem.material_name}
                      onChange={e => setEditingItem({...editingItem, material_name: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Selecionar...</option>
                      {stockMaterials.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Largura (mm)</label>
                    <input 
                      required
                      type="number"
                      value={editingItem.width}
                      onChange={e => setEditingItem({...editingItem, width: parseInt(e.target.value) || 0})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Comprimento (mm)</label>
                    <input 
                      required
                      type="number"
                      value={editingItem.length}
                      onChange={e => setEditingItem({...editingItem, length: parseInt(e.target.value) || 0})}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Acabamento</label>
                  <select 
                    required
                    value={editingItem.finishing || 'Polido'}
                    onChange={e => setEditingItem({...editingItem, finishing: e.target.value})}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    {FINISHING_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bordas</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['top', 'bottom', 'left', 'right'].map((side) => (
                      <div key={side} className="bg-background-dark p-2 rounded border border-border-dark space-y-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={editingItem.edges[side as keyof typeof editingItem.edges] !== 'Nenhum'}
                            onChange={(e) => {
                              const newEdges = { ...editingItem.edges };
                              newEdges[side as keyof typeof editingItem.edges] = e.target.checked ? 'Reto' : 'Nenhum';
                              setEditingItem({ ...editingItem, edges: newEdges });
                            }}
                            className="w-3 h-3 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{side === 'top' ? 'Topo' : side === 'bottom' ? 'Base' : side === 'left' ? 'Esq.' : 'Dir.'}</span>
                        </div>
                        {editingItem.edges[side as keyof typeof editingItem.edges] !== 'Nenhum' && (
                          <select 
                            value={editingItem.edges[side as keyof typeof editingItem.edges]}
                            onChange={(e) => {
                              const newEdges = { ...editingItem.edges };
                              newEdges[side as keyof typeof editingItem.edges] = e.target.value;
                              setEditingItem({ ...editingItem, edges: newEdges });
                            }}
                            className="w-full bg-transparent text-[9px] outline-none text-primary border-t border-white/5 pt-1"
                          >
                            {EDGE_TYPES.filter(t => t !== 'Nenhum').map(type => (
                              <option key={type} value={type} className="bg-secondary-dark">{type}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-2 rounded-lg font-bold text-xs text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity text-xs"
                  >
                    Salvar
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
