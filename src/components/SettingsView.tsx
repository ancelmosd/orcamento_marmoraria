import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Edit2, Save, Layers, Scissors,
  Construction, Database, Download, Upload,
  Box, Bolt, Package, FileText, Trash2,
  User, Users, Building2, Bell, Lock, FileCode,
  Shield, Mail, Phone, MapPin, Briefcase, ChevronRight, Camera
} from 'lucide-react';
import { ModuleTemplate, Service, Supply } from '../types';
import ServicesView from './ServicesView';
import ModuleTemplatesView from './ModuleTemplatesView';

interface SettingsViewProps {
  showToast: (m: string, t?: 'success' | 'error') => void;
}

type TabID = 'suggestions' | 'modules' | 'services' | 'supplies' | 'backup' |
  'profile' | 'team' | 'documents' | 'company' | 'notifications' | 'security';

export default function SettingsView({ showToast }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabID>('suggestions');

  // States for Suggestions
  const [templates, setTemplates] = useState<{ id: number, text: string }[]>([]);
  const [newTemplate, setNewTemplate] = useState('');

  // States for Supplies
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Partial<Supply>>({ name: '', price_per_meter: 0, minutes_per_meter: 0, unit: 'un' });

  // States for Company
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    logo: ''
  });

  // States for Document Settings
  const [documentSettings, setDocumentSettings] = useState({
    generalInfo: ''
  });

  // States for Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    executionDeadline: '25 dias após aprovação',
    paymentMethods: 'Boleto, Transferência Bancária, Dinheiro, Cartão de Crédito, PIX',
    conditions: 'A vista, Sinal',
    observations: 'Orçamento válido por 10 dias úteis.',
    pixKey: '',
    bankName: '',
    bankAgency: '',
    bankAccount: '',
    showLogo: true,
    showBankData: false,
    showSignature: true,
    useDynamicDeadline: false
  });

  useEffect(() => {
    fetchTemplates();
    fetchSupplies();
    fetchCompanyInfo();
    fetchDocumentSettings();
    fetchPaymentSettings();
  }, []);

  const fetchDocumentSettings = () => {
    fetch('/api/settings/document_settings')
      .then(r => r.json())
      .then(data => {
        if (Object.keys(data).length > 0) setDocumentSettings(data);
      });
  };

  const fetchPaymentSettings = () => {
    fetch('/api/settings/payment_settings')
      .then(r => r.json())
      .then(data => {
        if (Object.keys(data).length > 0) setPaymentSettings(prev => ({ ...prev, ...data }));
      });
  };

  const fetchCompanyInfo = () => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(data => {
        if (Object.keys(data).length > 0) setCompanyInfo(data);
      });
  };

  const fetchTemplates = () => {
    fetch('/api/description-templates').then(r => r.json()).then(setTemplates);
  };

  const fetchSupplies = () => {
    fetch('/api/supplies')
      .then(r => r.json())
      .then(data => setSupplies(Array.isArray(data) ? data : []))
      .catch(() => setSupplies([]));
  };

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

  const handleSaveSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSupply.id ? 'PUT' : 'POST';
    const url = editingSupply.id ? `/api/supplies/${editingSupply.id}` : '/api/supplies';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSupply)
    });

    if (res.ok) {
      setIsSupplyModalOpen(false);
      fetchSupplies();
      showToast("Insumo salvo com sucesso!");
    }
  };

  const handleDeleteSupply = async (id: number) => {
    if (confirm('Deseja excluir este insumo?')) {
      const res = await fetch(`/api/supplies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSupplies();
        showToast("Insumo removido.");
      }
    }
  };

  const handleBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('ATENÇÃO: Restaurar um backup irá substituir todos os dados atuais. Deseja continuar?')) {
      const formData = new FormData();
      formData.append('backup', file);

      try {
        const res = await fetch('/api/restore', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          showToast("Backup restaurado com sucesso! A página será recarregada.");
          setTimeout(() => window.location.reload(), 2000);
        } else {
          showToast("Erro ao restaurar backup.", "error");
        }
      } catch (error) {
        showToast("Erro de conexão ao restaurar backup.", "error");
      }
    }
    e.target.value = '';
  };

  const tabs: { id: TabID, label: string, icon: any, category?: string }[] = [
    { id: 'profile', label: 'Meu Perfil', icon: <User size={18} />, category: 'Pessoal' },
    { id: 'security', label: 'Segurança', icon: <Shield size={18} />, category: 'Pessoal' },
    { id: 'company', label: 'Empresa', icon: <Building2 size={18} />, category: 'Geral' },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={18} />, category: 'Geral' },
    { id: 'backup', label: 'Backup', icon: <Database size={18} />, category: 'Geral' },
    { id: 'services', label: 'Serviços', icon: <Construction size={18} />, category: 'Técnico' },
    { id: 'modules', label: 'Módulos', icon: <Box size={18} />, category: 'Técnico' },
    { id: 'supplies', label: 'Insumos', icon: <Package size={18} />, category: 'Técnico' },
    { id: 'suggestions', label: 'Sugestões', icon: <FileText size={18} />, category: 'Técnico' },
    { id: 'team', label: 'Equipe', icon: <Users size={18} />, category: 'Administrativo' },
    { id: 'documents', label: 'Documentos', icon: <FileCode size={18} />, category: 'Administrativo' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-primary text-sm font-semibold uppercase tracking-wider">Painel de Controle</p>
        <h1 className="text-4xl font-black tracking-tight">Configurações</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:w-40 flex-shrink-0">
          <nav className="bg-secondary-dark rounded-2xl border border-border-dark p-2 space-y-1">
            {/* Grouping tabs by category */}
            {['Pessoal', 'Geral', 'Técnico', 'Administrativo'].map(category => (
              <div key={category} className="space-y-0.5 pt-2 first:pt-0">
                <p className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{category}</p>
                {tabs.filter(t => t.category === category).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all group ${activeTab === tab.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {React.cloneElement(tab.icon, { size: 14 })}
                      {tab.label}
                    </div>
                    {activeTab === tab.id && <ChevronRight size={12} className="text-white/50" />}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'suggestions' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <FileText className="text-primary" /> Sugestões de Descrição
                    </h3>
                    <p className="text-sm text-slate-400">Cadastre descrições padrão para novos orçamentos.</p>
                  </div>

                  <form onSubmit={handleAddTemplate} className="flex gap-2">
                    <input
                      value={newTemplate}
                      onChange={e => setNewTemplate(e.target.value)}
                      className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                      placeholder="Ex: Bancada com Cuba Esculpida..."
                    />
                    <button type="submit" className="bg-primary p-3 rounded-xl text-white hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                      <Plus size={24} />
                    </button>
                  </form>

                  <div className="bg-background-dark rounded-xl border border-border-dark overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-border-dark">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark">
                        {templates.map(t => (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-3 text-sm font-medium">{t.text}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteTemplate(t.id)}
                                className="text-slate-500 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {templates.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-background-dark rounded-xl border border-dashed border-border-dark">
                      <p className="text-slate-500 text-sm italic">Nenhuma sugestão cadastrada.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'modules' && <ModuleTemplatesView showToast={showToast} />}
              {activeTab === 'services' && <ServicesView searchTerm="" showToast={showToast} />}

              {activeTab === 'supplies' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <Package className="text-primary" /> Insumos e Produtos
                      </h3>
                      <p className="text-sm text-slate-400">Gerencie acessórios, colas, cubas e outros itens.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSupply({ name: '', price_per_meter: 0, minutes_per_meter: 0, unit: 'un' });
                        setIsSupplyModalOpen(true);
                      }}
                      className="bg-primary text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary/20"
                    >
                      <Plus size={18} /> Novo Insumo
                    </button>
                  </div>

                  <div className="bg-background-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-border-dark">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Insumo</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Unidade</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tempo Prod.</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Preço Venda</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark">
                        {(supplies || []).map(s => (
                          <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="font-black text-white">{s.name}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{s.unit || 'un'}</span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-mono text-slate-400">
                              {(s.minutes_per_meter || 0)} min
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-black text-primary">R$ {(s.price_per_meter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditingSupply(s); setIsSupplyModalOpen(true); }}
                                  className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-primary transition-all"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSupply(s.id)}
                                  className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-red-500 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!supplies || supplies.length === 0) && (
                      <div className="py-20 text-center">
                        <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 text-sm italic">Nenhum insumo cadastrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'company' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-8">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Building2 className="text-primary" /> Informações da Empresa
                  </h3>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex flex-col items-center gap-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Logo da Empresa</label>
                      <div className="relative group">
                        <div className="w-40 h-40 rounded-2xl bg-background-dark border-2 border-dashed border-border-dark flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                          {companyInfo.logo ? (
                            <img src={companyInfo.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-600">
                              <Camera size={32} />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Upload</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCompanyInfo({ ...companyInfo, logo: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        {companyInfo.logo && (
                          <button 
                            onClick={() => setCompanyInfo({ ...companyInfo, logo: '' })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-all"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 italic text-center max-w-[160px]">PNG ou JPG (transparente recomendado)</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Fantasia</label>
                          <input 
                            value={companyInfo.name}
                            onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})}
                            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                            placeholder="Marmoraria Exemplo" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CNPJ</label>
                          <input 
                            value={companyInfo.cnpj}
                            onChange={e => setCompanyInfo({...companyInfo, cnpj: e.target.value})}
                            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                            placeholder="00.000.000/0001-00" 
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-mail Comercial</label>
                          <input 
                            value={companyInfo.email}
                            onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})}
                            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                            placeholder="contato@empresa.com" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Telefone / WhatsApp</label>
                          <input 
                            value={companyInfo.phone}
                            onChange={e => setCompanyInfo({...companyInfo, phone: e.target.value})}
                            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                            placeholder="(00) 00000-0000" 
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Endereço Completo</label>
                        <input 
                          value={companyInfo.address}
                          onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                          placeholder="Rua Exemplo, 123 - Centro" 
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const res = await fetch('/api/settings/company', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(companyInfo)
                      });
                      if (res.ok) showToast("Informações da empresa salvas com sucesso!");
                    }}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-white/5">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-4xl font-black border-4 border-background-dark shadow-2xl">
                        AS
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-background-dark border border-border-dark rounded-full text-primary hover:bg-primary hover:text-white transition-all shadow-lg">
                        <Edit2 size={16} />
                      </button>
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-3xl font-black text-white">Administrador do Sistema</h3>
                      <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 mt-1">
                        <Mail size={14} /> admin@marmoraria.com.br
                      </p>
                      <div className="flex gap-2 mt-4 justify-center md:justify-start">
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Proprietário</span>
                        <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Ativo</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                      <input className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" defaultValue="Administrador Sistema" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargo / Função</label>
                      <input className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" defaultValue="Proprietário" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <Users className="text-primary" /> Gestão da Equipe
                      </h3>
                      <p className="text-sm text-slate-400">Controle o acesso de funcionários ao sistema.</p>
                    </div>
                    <button className="bg-primary/10 text-primary px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                      <Plus size={18} /> Convidar Membro
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Ricardo Silva', role: 'Vendedor', email: 'ricardo@marmoraria.com' },
                      { name: 'Ana Oliveira', role: 'Financeiro', email: 'ana@marmoraria.com' },
                      { name: 'Carlos Santos', role: 'Produção', email: 'carlos@marmoraria.com' },
                    ].map((member, i) => (
                      <div key={i} className="flex justify-between items-center p-5 bg-background-dark rounded-2xl border border-border-dark group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-sm text-primary border border-white/5">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-black text-white">{member.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{member.role}</span>
                              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                              <span className="text-[10px] text-slate-500 font-medium">{member.email}</span>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <FileCode className="text-primary" /> Modelos de Documentos
                    </h3>
                    <p className="text-sm text-slate-400">Configure as informações que aparecem em todos os documentos gerados.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informações Gerais (PDF)</label>
                      <textarea 
                        value={documentSettings.generalInfo}
                        onChange={e => setDocumentSettings({ ...documentSettings, generalInfo: e.target.value })}
                        rows={6}
                        className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none" 
                        placeholder="Digite aqui as observações gerais, formas de pagamento, prazos de entrega, etc. Estas informações aparecerão no cabeçalho dos documentos." 
                      />
                      <p className="text-[10px] text-slate-500 italic">Estas informações serão exibidas em um bloco com fundo cinza logo abaixo dos dados do cliente no PDF.</p>
                    </div>

                    <button 
                      onClick={async () => {
                        const res = await fetch('/api/settings/document_settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(documentSettings)
                        });
                        if (res.ok) {
                          showToast("Configurações de documentos salvas!");
                        } else {
                          showToast("Erro ao salvar configurações.", "error");
                        }
                      }}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                    >
                      <Save size={18} /> Salvar Alterações
                    </button>
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-white flex items-center gap-2">
                        <Briefcase size={18} className="text-primary" /> Configurações de Pagamento
                      </h4>
                      <p className="text-sm text-slate-400">Defina as condições que aparecem na seção "Condições e Pagamento" do PDF.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prazo de Execução</label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={paymentSettings.useDynamicDeadline}
                              onChange={e => setPaymentSettings({ ...paymentSettings, useDynamicDeadline: e.target.checked })}
                              className="w-4 h-4 rounded border-border-dark bg-background-dark text-primary focus:ring-primary/50"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Usar Data de Entrega</span>
                          </label>
                        </div>
                        <input
                          value={paymentSettings.executionDeadline}
                          onChange={e => setPaymentSettings({ ...paymentSettings, executionDeadline: e.target.value })}
                          disabled={paymentSettings.useDynamicDeadline}
                          className={`w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none ${paymentSettings.useDynamicDeadline ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder="Ex: 25 dias após aprovação"
                        />
                        {paymentSettings.useDynamicDeadline && (
                          <p className="text-[10px] text-primary mt-1 font-bold">
                            * O PDF exibirá: "Até [DATA DE ENTREGA] se sinal de 50% for pago em até dois dias apartir da data do orçamento"
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Condições</label>
                        <input
                          value={paymentSettings.conditions}
                          onChange={e => setPaymentSettings({ ...paymentSettings, conditions: e.target.value })}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder="Ex: A vista, 50% sinal + 50% na entrega"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Formas de Pagamento</label>
                        <input
                          value={paymentSettings.paymentMethods}
                          onChange={e => setPaymentSettings({ ...paymentSettings, paymentMethods: e.target.value })}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder="Ex: Boleto, PIX, Cartão de Crédito"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2 pt-4 border-t border-white/5">
                        <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Dados para Pagamento</h5>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chave PIX</label>
                        <input
                          value={paymentSettings.pixKey}
                          onChange={e => setPaymentSettings({ ...paymentSettings, pixKey: e.target.value })}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Banco</label>
                        <input
                          value={paymentSettings.bankName}
                          onChange={e => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder="Ex: Banco do Brasil, Itaú..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agência</label>
                        <input
                          value={paymentSettings.bankAgency}
                          onChange={e => setPaymentSettings({ ...paymentSettings, bankAgency: e.target.value })}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conta</label>
                        <input
                          value={paymentSettings.bankAccount}
                          onChange={e => setPaymentSettings({ ...paymentSettings, bankAccount: e.target.value })}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2 pt-4 border-t border-white/5">
                        <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Visualização no PDF</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <button
                            onClick={() => setPaymentSettings({ ...paymentSettings, showLogo: !paymentSettings.showLogo })}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${paymentSettings.showLogo ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark border-border-dark text-slate-500'}`}
                          >
                            Exibir Logo: {paymentSettings.showLogo ? 'SIM' : 'NÃO'}
                          </button>
                          <button
                            onClick={() => setPaymentSettings({ ...paymentSettings, showBankData: !paymentSettings.showBankData })}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${paymentSettings.showBankData ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark border-border-dark text-slate-500'}`}
                          >
                            Dados Bancários: {paymentSettings.showBankData ? 'SIM' : 'NÃO'}
                          </button>
                          <button
                            onClick={() => setPaymentSettings({ ...paymentSettings, showSignature: !paymentSettings.showSignature })}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${paymentSettings.showSignature ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark border-border-dark text-slate-500'}`}
                          >
                            Campo Assinatura: {paymentSettings.showSignature ? 'SIM' : 'NÃO'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2 pt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Observações</label>
                        <textarea
                          value={paymentSettings.observations}
                          onChange={e => setPaymentSettings({ ...paymentSettings, observations: e.target.value })}
                          rows={3}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                          placeholder="Ex: Orçamento válido por 10 dias úteis."
                        />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const res = await fetch('/api/settings/payment_settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(paymentSettings)
                        });
                        if (res.ok) {
                          showToast("Configurações de pagamento salvas!");
                        } else {
                          showToast("Erro ao salvar configurações.", "error");
                        }
                      }}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                    >
                      <Save size={18} /> Salvar Pagamento
                    </button>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Outros Documentos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50 cursor-not-allowed">
                      {['Contrato de Prestação de Serviço', 'Termo de Garantia', 'Recibo de Pagamento', 'Ordem de Serviço'].map((doc, i) => (
                        <div key={i} className="p-4 bg-background-dark rounded-xl border border-border-dark flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-slate-600" />
                            <span className="font-bold text-xs">{doc}</span>
                          </div>
                          <ChevronRight size={16} className="text-slate-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-8">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Bell className="text-primary" /> Notificações do Sistema
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'E-mail ao aprovar orçamento', desc: 'Enviar e-mail automático para o cliente quando o status mudar para aprovado.' },
                      { label: 'Alertas de estoque baixo', desc: 'Notificar quando uma chapa atingir a quantidade mínima.' },
                      { label: 'Lembrete de prazos', desc: 'Notificar 48h antes da data de entrega prevista.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-background-dark rounded-2xl border border-border-dark hover:border-white/10 transition-all">
                        <div className="max-w-[70%]">
                          <p className="font-black text-white">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                        </div>
                        <div className="w-14 h-7 bg-primary rounded-full relative cursor-pointer border-2 border-white/10">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <Shield className="text-primary" /> Segurança e Senha
                    </h3>
                    <div className="max-w-md space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senha Atual</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nova Senha</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirmar Nova Senha</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                      </div>
                      <button className="w-full bg-primary text-white py-3 rounded-xl font-black shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">Atualizar Senha</button>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/5 space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Sessões Ativas</h4>
                    <div className="flex justify-between items-center p-6 bg-background-dark rounded-2xl border border-border-dark group">
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-white/5 rounded-xl text-primary border border-white/5">
                          <Monitor size={24} />
                        </div>
                        <div className="text-xs">
                          <p className="font-black text-white text-sm">Windows 11 • Google Chrome</p>
                          <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Este dispositivo • São Paulo, Brasil
                          </p>
                        </div>
                      </div>
                      <button className="text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all border border-red-500/20">Encerrar Sessão</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'backup' && (
                <div className="bg-secondary-dark p-8 rounded-2xl border border-border-dark space-y-10">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <Database className="text-primary" /> Backup e Restauração
                    </h3>
                    <p className="text-sm text-slate-400">Proteja seus dados. Recomendamos baixar o backup semanalmente.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button
                      onClick={handleBackup}
                      className="flex flex-col items-center justify-center gap-4 bg-primary/5 border-2 border-primary/20 text-primary p-10 rounded-3xl font-black hover:bg-primary hover:text-white transition-all group shadow-xl shadow-primary/5"
                    >
                      <Download className="w-12 h-12 group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <p className="text-lg">Exportar Backup</p>
                        <p className="text-xs font-normal opacity-70 mt-1">Baixar todos os dados (.json)</p>
                      </div>
                    </button>

                    <div className="relative group">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-4 bg-orange-500/5 border-2 border-orange-500/20 text-orange-400 p-10 rounded-3xl font-black hover:bg-orange-500 hover:text-white transition-all shadow-xl shadow-orange-500/5">
                        <Upload className="w-12 h-12 group-hover:scale-110 transition-transform" />
                        <div className="text-center">
                          <p className="text-lg">Importar Backup</p>
                          <p className="text-xs font-normal opacity-70 mt-1">Restaurar via arquivo externo</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-2xl flex items-start gap-4">
                    <Bolt className="text-yellow-500 mt-1 flex-shrink-0" size={20} />
                    <div className="text-xs text-yellow-200/70 leading-relaxed">
                      <p className="font-black text-yellow-500 uppercase tracking-widest mb-1">Nota de Segurança</p>
                      A restauração de backup substituirá permanentemente todos os dados atuais do banco de dados (clientes, orçamentos, materiais, etc). Certifique-se de estar usando o arquivo correto.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modal for Supplies */}
      <AnimatePresence>
        {isSupplyModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-secondary-dark border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-dark"></div>

              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white">{editingSupply.id ? 'Editar Insumo' : 'Novo Insumo'}</h3>
                <button onClick={() => setIsSupplyModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveSupply} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Insumo</label>
                  <input
                    required
                    value={editingSupply.name}
                    onChange={e => setEditingSupply({ ...editingSupply, name: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                    placeholder="Ex: Cuba de Inox Tramontina"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preço Unitário</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-bold">R$</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={editingSupply.price_per_meter}
                        onChange={e => setEditingSupply({ ...editingSupply, price_per_meter: parseFloat(e.target.value) })}
                        className="w-full bg-background-dark border border-border-dark rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unidade</label>
                    <select
                      value={editingSupply.unit || 'un'}
                      onChange={e => setEditingSupply({ ...editingSupply, unit: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="m">Metro (m)</option>
                      <option value="m²">Metro² (m²)</option>
                      <option value="kg">Quilo (kg)</option>
                      <option value="L">Litro (L)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Esforço Produção (minutos)</label>
                  <input
                    required
                    type="number"
                    value={editingSupply.minutes_per_meter}
                    onChange={e => setEditingSupply({ ...editingSupply, minutes_per_meter: parseFloat(e.target.value) })}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSupplyModalOpen(false)}
                    className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white rounded-xl font-black shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Salvar Insumo
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
