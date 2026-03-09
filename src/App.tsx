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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView stats={stats} onAction={handleQuickAction} />;
      case 'clients': return <ClientsView initialAction={clientAction} onActionComplete={() => setClientAction(null)} />;
      case 'materials': return <MaterialsView />;
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
        />
      );
      case 'services': return <ServicesView />;
      case 'history': return (
        <HistoryView 
          onEdit={(id) => {
            setEditQuoteId(id);
            setActiveTab('quotes');
          }} 
        />
      );
      case 'settings': return <SettingsView />;
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

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => {
        // Sort by quantity ascending to show low stock first
        const sorted = [...data].sort((a, b) => a.quantity - b.quantity);
        setMaterials(sorted.slice(0, 3)); // Show top 3
      })
      .catch(err => console.error("Error fetching materials for dashboard:", err));
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
            <button className="text-primary text-sm font-bold hover:underline">Ver todos</button>
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
                  <TableRow client="Ricardo Oliveira" project="Cozinha" date="12 Out" value="R$ 4.500" status="Enviado" onEdit={() => onAction('new-quote')} />
                  <TableRow client="Marina Santos" project="Banheiro" date="11 Out" value="R$ 2.100" status="Aprovado" onEdit={() => onAction('new-quote')} />
                  <TableRow client="Condomínio Solar" project="Soleiras" date="10 Out" value="R$ 1.850" status="Pendente" onEdit={() => onAction('new-quote')} />
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
    Enviado: 'bg-blue-500/10 text-blue-400',
    Aprovado: 'bg-emerald-500/10 text-emerald-400',
    Pendente: 'bg-orange-500/10 text-orange-400',
    Rascunho: 'bg-slate-500/10 text-slate-400'
  };
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm">{client}</span>
          <span className="text-slate-500 text-xs">{project}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-400 text-sm">{date}</td>
      <td className="px-6 py-4 font-bold text-sm">{value}</td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>{status}</span>
      </td>
      <td className="px-6 py-4 text-right">
        {onEdit && (
          <button 
            onClick={onEdit}
            className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors text-primary"
          >
            <Settings size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}

// --- Placeholder Views (To be implemented in next steps) ---

function ClientsView({ initialAction, onActionComplete }: { initialAction?: string | null, onActionComplete?: () => void }) {
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
      setFormData({ name: '', document: '', phone: '', address: '' });
      setShowForm(false);
      setEditingId(null);
      fetchClients();
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
        fetchClients();
        setOpenMenuId(null);
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

function MaterialsView() {
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
      setFormData({ name: '', price: '', quantity: '', description: '' });
      setShowForm(false);
      setEditingId(null);
      fetchMaterials();
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
      if (res.ok) fetchMaterials();
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
      setStockEntryMaterial(null);
      setStockAmount('');
      fetchMaterials();
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

function ServicesView() {
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
      setFormData({ name: '', price: '', description: '', minutes_per_meter: '' });
      setShowForm(false);
      setEditingId(null);
      fetchServices();
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
      if (res.ok) fetchServices();
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

function QuotesView({ editId, onSave, onCancel }: { editId?: number | null, onSave: () => void, onCancel: () => void }) {
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
      alert("Selecione um cliente e dê um nome ao projeto.");
      return;
    }

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
      alert(editId ? "Orçamento atualizado com sucesso!" : "Orçamento salvo com sucesso!");
      setProjectName('');
      setSelectedClientId('');
      setQuoteItems([{ materialId: '', length: 0, width: 0, quantity: 1, description: '' }]);
      setQuoteServices([]);
      onSave();
    }
  };

  const handleDeleteQuote = async () => {
    if (!editId) return;
    if (confirm('Deseja realmente excluir este orçamento?')) {
      const res = await fetch(`/api/quotes/${editId}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Orçamento excluído com sucesso!");
        onCancel();
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

function HistoryView({ onEdit }: { onEdit: (id: number) => void }) {
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
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchQuotes();
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/quotes/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchQuotes();
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

function SettingsView() {
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
    } else {
      alert("Esta descrição já existe ou ocorreu um erro.");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm('Deseja excluir esta sugestão?')) {
      const res = await fetch(`/api/description-templates/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTemplates();
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
