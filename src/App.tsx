import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Calculator, 
  Zap, 
  Settings, 
  LogOut, 
  Menu, 
  Bell, 
  Search, 
  Plus, 
  Layers, 
  History, 
  Construction, 
  Scissors, 
  Box, 
  DollarSign,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DashboardStats 
} from './types';
import { generateQuotePDF } from './utils/pdfGenerator';
import { Toast } from './components/Toast';
import { NotificationDropdown } from './components/NotificationDropdown';
import { NavItem } from './components/NavItem';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { FinancialView } from './components/FinancialView';
import ClientsView from './components/ClientsView';
import MaterialsView from './components/MaterialsView';
import ServicesView from './components/ServicesView';
import QuotesView from './components/QuotesView';
import CutPlanView from './components/CutPlanView';
import QuickQuoteView from './components/QuickQuoteView';
import SettingsView from './components/SettingsView';
import ModuleTemplatesView from './components/ModuleTemplatesView';
import ModuleLibrary from './components/ModuleLibrary';

// Mock data for initial render
const MOCK_STATS: DashboardStats = {
  pendingQuotes: 0,
  pendingQuotesTrend: 0,
  approvedQuotes: 0,
  approvedQuotesTrend: 0,
  totalClients: 0,
  totalClientsTrend: 0,
  monthlyRevenue: 0,
  monthlyRevenueTrend: 0,
  inProduction: 0,
  inProductionTrend: 0,
  totalReceivable: 0,
  totalOverdue: 0,
  totalReceived: 0
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [clientAction, setClientAction] = useState<string | null>(null);
  const [editQuoteId, setEditQuoteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(localStorage.getItem('user_profile_image') || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [moduleToImport, setModuleToImport] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(data => {
        if (Object.keys(data).length > 0) setCompanyInfo(data);
      })
      .catch(console.error);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem('user_profile_image', base64String);
        showToast("Foto de perfil atualizada!");
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetch('/api/stats')
        .then(res => {
          if (!res.ok) throw new Error('API Error');
          return res.json();
        })
        .then(data => setStats(data))
        .catch(err => {
          console.error("Error fetching stats:", err);
          setStats(MOCK_STATS);
        });
    }
  }, [activeTab]);

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(console.error);
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
      case 'clients': return <ClientsView searchTerm={globalSearch} initialAction={clientAction} onActionComplete={() => setClientAction(null)} showToast={showToast} />;
      case 'materials': return <MaterialsView searchTerm={globalSearch} showToast={showToast} />;
      case 'quotes': return (
        <QuotesView
          editId={editQuoteId}
          onSave={() => {
            setEditQuoteId(null);
            setActiveTab('history');
          }}
          onCancel={() => {
            setEditQuoteId(null);
            setActiveTab('dashboard');
          }}
          showToast={showToast}
          moduleToAdd={moduleToImport}
          onModuleAdded={() => setModuleToImport(null)}
          companyInfo={companyInfo}
        />
      );
      case 'cut-plan': return <CutPlanView showToast={showToast} />;
      case 'quick-quote': return (
        <QuickQuoteView
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
      case 'history': return (
        <HistoryView
          searchTerm={globalSearch}
          onEdit={(id) => {
            setEditQuoteId(id);
            setActiveTab('quotes');
          }}
          showToast={showToast}
          generateQuotePDF={(quote) => generateQuotePDF(quote, companyInfo)}
        />
      );
      case 'settings': return <SettingsView showToast={showToast} />;
      case 'financial': return <FinancialView showToast={showToast} />;
      default: return <DashboardView stats={stats} onAction={handleQuickAction} />;
    }
  };

  return (
    <div className="flex h-screen bg-background-dark text-slate-100 overflow-hidden relative">
      <aside className={`${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} fixed md:relative h-full border-r border-border-dark bg-secondary-dark transition-all duration-300 flex flex-col z-50`}>
        <div className="p-4 flex items-center justify-between gap-3 text-primary">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className={`font-bold text-xl tracking-tight whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Marmoraria</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1 px-3 scrollbar-hide">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Users />} label="Clientes" active={activeTab === 'clients'} onClick={() => handleTabChange('clients')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Package />} label="Estoque" active={activeTab === 'materials'} onClick={() => handleTabChange('materials')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Calculator />} label="Orçamento" active={activeTab === 'quotes'} onClick={() => handleTabChange('quotes')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Zap />} label="Orçamento Rápido" active={activeTab === 'quick-quote'} onClick={() => handleTabChange('quick-quote')} collapsed={!isSidebarOpen} />
          <NavItem icon={<History />} label="Projetos" active={activeTab === 'history'} onClick={() => handleTabChange('history')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Scissors />} label="Plano de Corte" active={activeTab === 'cut-plan'} onClick={() => handleTabChange('cut-plan')} collapsed={!isSidebarOpen} />
          <NavItem icon={<DollarSign />} label="Financeiro" active={activeTab === 'financial'} onClick={() => handleTabChange('financial')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Settings />} label="Configurações" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} collapsed={!isSidebarOpen} />
        </div>

        <div className="p-4 border-t border-border-dark">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">AS</div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate text-white">Administrador</span>
                <span className="text-xs text-slate-500 truncate">Sair do Sistema</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-border-dark bg-secondary-dark/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-slate-300" />
            </button>
            <h2 className="text-lg font-bold capitalize text-primary">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-background-dark border border-border-dark px-3 py-1.5 rounded-full w-64 group focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
              <Search className="text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="text"
                placeholder="Buscar em tudo..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs ml-2 w-full text-slate-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full hover:bg-white/5 transition-colors relative ${notifications.length > 0 ? 'text-primary' : 'text-slate-400'}`}
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-secondary-dark" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <NotificationDropdown
                      notifications={notifications}
                      onClose={() => setShowNotifications(false)}
                      onAction={handleQuickAction}
                    />
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                className={`p-2 rounded-full hover:bg-white/5 transition-colors ${isLibraryOpen ? 'text-primary bg-primary/10' : 'text-slate-400'}`}
                title="Biblioteca de Módulos"
              >
                <Layers size={20} />
              </button>

              <div className="relative group">
                <div className="flex items-center gap-1 cursor-pointer">
                  <div className="w-8 h-8 rounded-full border border-primary/20 p-0.5">
                    <img
                      src={profileImage}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/40 rounded-full transition-opacity">
                    <Plus size={12} className="text-white" />
                    <input type="file" onChange={handleProfileImageUpload} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>

              <button className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide bg-background-dark/50">
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
        </section>

        <Toast toast={toast} />
      </main>

      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[60]"
          >
            <ModuleLibrary 
              onClose={() => setIsLibraryOpen(false)} 
              onAddModule={(module) => {
                setModuleToImport(module);
                if (activeTab !== 'quotes') {
                  setActiveTab('quotes');
                }
                showToast(`Módulo "${module.name}" adicionado ao orçamento!`);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
