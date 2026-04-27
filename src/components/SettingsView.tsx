import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Package, TrendingUp, TrendingDown, Clock, Search, Plus, 
  X, Check, AlertCircle, FileText, Settings, Download, Trash2,
  Phone, MapPin, Calculator, Calendar, History, Save, Edit2, 
  ArrowRight, FileOutput, GripHorizontal, Box, Layers, Scissors, 
  RotateCw, Construction, Database, Upload, ArrowUpRight, ArrowDownRight,
  Filter, DollarSign, Bolt, Camera, Eye
} from 'lucide-react';
import { FINISHING_TYPES, EDGE_TYPES, Client, Material, Service, DescriptionTemplate, QuoteItem, QuoteService, ModuleTemplate, ModulePart, Supply } from '../types';
import { normalizeSearchText, evaluateFormula } from '../utils/helpers';


export default function SettingsView({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [templates, setTemplates] = useState<{ id: number, text: string }[]>([]);
  const [newTemplate, setNewTemplate] = useState('');
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplate[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<ModuleTemplate>>({ name: '', description: '', parts: [] });
  const [editingService, setEditingService] = useState<Partial<Service>>({ name: '', price: 0, description: '', category: 'other' });
  const [editingSupply, setEditingSupply] = useState<Partial<Supply>>({ name: '', price_per_meter: 0, minutes_per_meter: 0, unit: 'm' });

  const fetchTemplates = () => {
    fetch('/api/description-templates').then(r => r.json()).then(setTemplates);
  };

  const fetchModuleTemplates = () => {
    fetch('/api/module-templates').then(r => r.json()).then(setModuleTemplates);
  };

  const fetchServices = () => {
    fetch('/api/services').then(r => r.json()).then(setServices);
  };

  const fetchSupplies = () => {
    fetch('/api/supplies').then(r => r.json()).then(setSupplies);
  };

  useEffect(() => {
    fetchTemplates();
    fetchModuleTemplates();
    fetchServices();
    fetchSupplies();
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

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingModule.id ? 'PUT' : 'POST';
    const url = editingModule.id ? `/api/module-templates/${editingModule.id}` : '/api/module-templates';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingModule)
    });

    if (res.ok) {
      setIsModuleModalOpen(false);
      fetchModuleTemplates();
      showToast("Módulo salvo com sucesso!");
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (confirm('Deseja excluir este módulo?')) {
      const res = await fetch(`/api/module-templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchModuleTemplates();
        showToast("Módulo removido.");
      }
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingService.id ? 'PUT' : 'POST';
    const url = editingService.id ? `/api/services/${editingService.id}` : '/api/services';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingService)
    });

    if (res.ok) {
      setIsServiceModalOpen(false);
      fetchServices();
      showToast("Serviço salvo com sucesso!");
    }
  };

  const handleDeleteService = async (id: number) => {
    if (confirm('Deseja excluir este serviço?')) {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
        showToast("Serviço removido.");
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

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Configurações</h1>
        <p className="text-slate-500">Gerencie as preferências e listas do sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
              <Bolt className="w-5 h-5" /> Módulos de Orçamento
            </h3>
            <button
              onClick={() => {
                setEditingModule({ name: '', description: '', parts: [] });
                setIsModuleModalOpen(true);
              }}
              className="bg-primary/10 text-primary p-2 rounded-lg hover:bg-primary hover:text-white transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <p className="text-sm text-slate-400">
            Configure módulos com fórmulas automáticas para agilizar seus orçamentos.
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {moduleTemplates.map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-background-dark rounded-lg border border-border-dark group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{m.name}</span>
                  <span className="text-[10px] text-slate-500">{m.parts.length} peças configuradas</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => {
                      setEditingModule(m);
                      setIsModuleModalOpen(true);
                    }}
                    className="text-slate-500 hover:text-primary"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(m.id)}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            {moduleTemplates.length === 0 && (
              <p className="text-center py-4 text-slate-500 text-sm italic">Nenhum módulo cadastrado.</p>
            )}
          </div>
        </div>

        <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
              <Construction className="w-5 h-5" /> Serviços
            </h3>
            <button
              onClick={() => {
                setEditingService({ name: '', price: 0, description: '', category: 'other' });
                setIsServiceModalOpen(true);
              }}
              className="bg-primary/10 text-primary p-2 rounded-lg hover:bg-primary hover:text-white transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                if (!confirm('Deseja adicionar os tipos de acabamento padrão ao catálogo?')) return;
                const types = ['Polido', 'Levigado', 'Escovado', 'Bruto', 'Jateado', 'Flamejado', 'Apicoado'];
                let count = 0;
                for (const name of types) {
                  if (!services.some(s => s.name === name && s.category === 'finish')) {
                    await fetch('/api/services', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, price: 0, category: 'finish', description: 'Acabamento padrão' })
                    });
                    count++;
                  }
                }
                showToast(`${count} acabamentos adicionados.`);
                fetchServices();
              }}
              className="flex-1 bg-background-dark border border-border-dark px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
            >
              <Layers size={14} className="text-primary" /> Sugerir Acabamentos
            </button>
            <button
              onClick={async () => {
                if (!confirm('Deseja adicionar os tipos de borda padrão ao catálogo?')) return;
                const types = ['45 Graus', 'Reto', 'Boleado', 'Meia Cana', 'Bisotê', 'Pingadeira', 'Peito de Pombo'];
                let count = 0;
                for (const name of types) {
                  if (!services.some(s => s.name === name && s.category === 'edge')) {
                    await fetch('/api/services', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, price: 0, category: 'edge', description: 'Borda padrão' })
                    });
                    count++;
                  }
                }
                showToast(`${count} bordas adicionadas.`);
                fetchServices();
              }}
              className="flex-1 bg-background-dark border border-border-dark px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
            >
              <Scissors size={14} className="text-primary" /> Sugerir Bordas
            </button>
          </div>

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {['finish', 'edge', 'other'].map(cat => (
              <div key={cat} className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">
                  {cat === 'finish' ? 'Acabamentos' : cat === 'edge' ? 'Bordas' : 'Outros'}
                </h4>
                {services.filter(s => s.category === cat).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-background-dark rounded-lg border border-border-dark group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{s.name}</span>
                      <div className="flex gap-2 text-[10px] text-slate-500">
                        <span>R$ {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/m</span>
                        {s.minutes_per_meter > 0 && <span>• {s.minutes_per_meter} min/m</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => {
                          setEditingService(s);
                          setIsServiceModalOpen(true);
                        }}
                        className="text-slate-500 hover:text-primary"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="text-slate-500 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {services.filter(s => s.category === cat).length === 0 && (
                  <p className="text-[10px] text-slate-600 italic py-1">Nenhum serviço nesta categoria.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
              <Package className="w-5 h-5" /> Insumos
            </h3>
            <button
              onClick={() => {
                setEditingSupply({ name: '', price_per_meter: 0, minutes_per_meter: 0, unit: 'm' });
                setIsSupplyModalOpen(true);
              }}
              className="bg-primary/10 text-primary p-2 rounded-lg hover:bg-primary hover:text-white transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <p className="text-sm text-slate-400">
            Gerencie insumos como cola, lixa, água, etc.
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {supplies.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-background-dark rounded-lg border border-border-dark group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{s.name}</span>
                  <div className="flex gap-2 text-[10px] text-slate-500">
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{s.unit || 'm'}</span>
                    <span>R$ {s.price_per_meter.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/{s.unit || 'm'}</span>
                    <span>• {s.minutes_per_meter} min/{s.unit || 'm'}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => {
                      setEditingSupply(s);
                      setIsSupplyModalOpen(true);
                    }}
                    className="text-slate-500 hover:text-primary"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteSupply(s.id)}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            {supplies.length === 0 && (
              <p className="text-center py-4 text-slate-500 text-sm italic">Nenhum insumo cadastrado.</p>
            )}
          </div>
        </div>
        <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6 lg:col-span-2">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Database className="w-5 h-5" /> Backup e Restauração
          </h3>
          <p className="text-sm text-slate-400">
            Gerencie a segurança dos seus dados. Recomendamos fazer backup regularmente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleBackup}
              className="flex items-center justify-center gap-3 bg-primary/10 border border-primary/20 text-primary p-4 rounded-xl font-bold hover:bg-primary hover:text-white transition-all group"
            >
              <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-sm">Fazer Backup</p>
                <p className="text-[10px] font-normal opacity-70">Baixar arquivo de dados (.json)</p>
              </div>
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center gap-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all group">
                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-sm">Restaurar Backup</p>
                  <p className="text-[10px] font-normal opacity-70">Substituir dados por um arquivo .json</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSupplyModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary">{editingSupply.id ? 'Editar Insumo' : 'Novo Insumo'}</h3>
                <button onClick={() => setIsSupplyModalOpen(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSupply} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Insumo</label>
                  <input
                    required
                    value={editingSupply.name}
                    onChange={e => setEditingSupply({ ...editingSupply, name: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                    placeholder="Ex: Cola Cuba"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço por Metro (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={editingSupply.price_per_meter}
                      onChange={e => setEditingSupply({ ...editingSupply, price_per_meter: parseFloat(e.target.value) })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minutos por Metro</label>
                    <input
                      required
                      type="number"
                      value={editingSupply.minutes_per_meter}
                      onChange={e => setEditingSupply({ ...editingSupply, minutes_per_meter: parseFloat(e.target.value) })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidade de Medida</label>
                    <select
                      value={editingSupply.unit || 'm'}
                      onChange={e => setEditingSupply({ ...editingSupply, unit: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="m">Metro (m)</option>
                      <option value="m²">Metro² (m²)</option>
                      <option value="m³">Metro³ (m³)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="L">Litro (L)</option>
                      <option value="mL">Mililitro (mL)</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSupplyModalOpen(false)}
                    className="flex-1 py-2 rounded-lg font-bold text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary">{editingModule.id ? 'Editar Módulo' : 'Novo Módulo'}</h3>
                <button onClick={() => setIsModuleModalOpen(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveModule} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Módulo</label>
                    <input
                      required
                      value={editingModule.name}
                      onChange={e => setEditingModule({ ...editingModule, name: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                      placeholder="Ex: Área Seca"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
                    <input
                      value={editingModule.description}
                      onChange={e => setEditingModule({ ...editingModule, description: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                      placeholder="Opcional..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Peças e Fórmulas</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newPart: ModulePart = { id: Math.random().toString(36).substr(2, 9), name: '', formula_l: 'L', formula_p: 'P', quantity: 1 };
                        setEditingModule({ ...editingModule, parts: [newPart, ...(editingModule.parts || [])] });
                      }}
                      className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                    >
                      <Plus size={14} /> Adicionar Peça
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingModule.parts?.map((part, index) => (
                      <div key={part.id} className="p-4 bg-background-dark rounded-lg border border-border-dark space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            const newParts = [...(editingModule.parts || [])];
                            newParts.splice(index, 1);
                            setEditingModule({ ...editingModule, parts: newParts });
                          }}
                          className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={14} />
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Peça</label>
                            <input
                              required
                              value={part.name}
                              onChange={e => {
                                const newParts = [...(editingModule.parts || [])];
                                newParts[index].name = e.target.value;
                                setEditingModule({ ...editingModule, parts: newParts });
                              }}
                              className="w-full bg-secondary-dark border border-border-dark rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Ex: Tampo"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Largura (Fórmula)</label>
                            <input
                              required
                              value={part.formula_l}
                              onChange={e => {
                                const newParts = [...(editingModule.parts || [])];
                                newParts[index].formula_l = e.target.value;
                                setEditingModule({ ...editingModule, parts: newParts });
                              }}
                              className="w-full bg-secondary-dark border border-border-dark rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                              placeholder="Ex: L - 20"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Profund. (Fórmula)</label>
                            <input
                              required
                              value={part.formula_p}
                              onChange={e => {
                                const newParts = [...(editingModule.parts || [])];
                                newParts[index].formula_p = e.target.value;
                                setEditingModule({ ...editingModule, parts: newParts });
                              }}
                              className="w-full bg-secondary-dark border border-border-dark rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                              placeholder="Ex: P"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd</label>
                            <input
                              required
                              type="number"
                              value={part.quantity}
                              onChange={e => {
                                const newParts = [...(editingModule.parts || [])];
                                newParts[index].quantity = parseInt(e.target.value) || 1;
                                setEditingModule({ ...editingModule, parts: newParts });
                              }}
                              className="w-full bg-secondary-dark border border-border-dark rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Acabamento Padrão</label>
                            <select
                              value={part.finish || 'Polido'}
                              onChange={e => {
                                const newParts = [...(editingModule.parts || [])];
                                newParts[index].finish = e.target.value;
                                setEditingModule({ ...editingModule, parts: newParts });
                              }}
                              className="w-full bg-secondary-dark border border-border-dark rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                            >
                              {services.filter(s => s.category === 'finish').length > 0 ? (
                                services.filter(s => s.category === 'finish').map(s => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))
                              ) : (
                                FINISHING_TYPES.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))
                              )}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Bordas Padrão</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {['top', 'bottom', 'left', 'right'].map((side) => (
                                <div key={side} className="bg-secondary-dark p-1.5 rounded border border-border-dark space-y-0.5">
                                  <span className="text-[8px] font-bold text-slate-500 uppercase block">
                                    {side === 'top' ? 'Topo' : side === 'bottom' ? 'Base' : side === 'left' ? 'Esq.' : 'Dir.'}
                                  </span>
                                  <select
                                    value={part.edges?.[side as keyof typeof part.edges] || 'Nenhum'}
                                    onChange={(e) => {
                                      const newParts = [...(editingModule.parts || [])];
                                      if (!newParts[index].edges) {
                                        newParts[index].edges = { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' };
                                      }
                                      newParts[index].edges = {
                                        ...newParts[index].edges!,
                                        [side]: e.target.value
                                      };
                                      setEditingModule({ ...editingModule, parts: newParts });
                                    }}
                                    className="w-full bg-transparent text-[9px] outline-none text-primary border-none p-0"
                                  >
                                    {services.filter(s => s.category === 'edge').length > 0 ? (
                                      <>
                                        <option value="Nenhum" className="bg-secondary-dark">Nenhum</option>
                                        {services.filter(s => s.category === 'edge').map(s => (
                                          <option key={s.id} value={s.name} className="bg-secondary-dark">{s.name}</option>
                                        ))}
                                      </>
                                    ) : (
                                      EDGE_TYPES.map(type => (
                                        <option key={type} value={type} className="bg-secondary-dark">{type}</option>
                                      ))
                                    )}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Serviços da Peça</label>
                          <div className="flex flex-wrap gap-2">
                            {services.map(s => {
                              const isSelected = part.services?.some(ps => ps.service_id === s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    const newParts = [...(editingModule.parts || [])];
                                    const partServices = newParts[index].services || [];
                                    if (isSelected) {
                                      newParts[index].services = partServices.filter(ps => ps.service_id !== s.id);
                                    } else {
                                      newParts[index].services = [...partServices, { service_id: s.id, dimension: 'width' }];
                                    }
                                    setEditingModule({ ...editingModule, parts: newParts });
                                  }}
                                  className={`text-[9px] px-2 py-1 rounded border transition-all ${isSelected ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary-dark border-border-dark text-slate-500 hover:border-slate-400'}`}
                                >
                                  {s.name}
                                </button>
                              );
                            })}
                            {services.length === 0 && <p className="text-[9px] text-slate-600 italic">Nenhum serviço cadastrado.</p>}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Insumos da Peça</label>
                          <div className="grid grid-cols-1 gap-3">
                            {supplies.map(s => {
                              const supplyConfig = part.supplies?.find(ps => ps.supply_id === s.id);
                              const isSelected = !!supplyConfig;
                              const supplyUnit = s.unit || 'm';
                              const isLinear = supplyUnit === 'm';

                              return (
                                <div key={s.id} className="flex flex-col gap-2 p-2 bg-secondary-dark/50 rounded-lg border border-border-dark/50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-bold ${isSelected ? 'text-primary' : 'text-slate-400'}`}>{s.name}</span>
                                      <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{supplyUnit}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newParts = [...(editingModule.parts || [])];
                                        const partSupplies = newParts[index].supplies || [];
                                        if (isSelected) {
                                          newParts[index].supplies = partSupplies.filter(ps => ps.supply_id !== s.id);
                                        } else {
                                          newParts[index].supplies = [...partSupplies, { supply_id: s.id, sides: [], quantity_per_unit: isLinear ? undefined : 1 }];
                                        }
                                        setEditingModule({ ...editingModule, parts: newParts });
                                      }}
                                      className={`text-[9px] px-2 py-0.5 rounded border transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'bg-background-dark border-border-dark text-slate-500 hover:border-slate-400'}`}
                                    >
                                      {isSelected ? 'Remover' : 'Adicionar'}
                                    </button>
                                  </div>

                                  {isSelected && (
                                    <div className="space-y-2">
                                      <div className="flex gap-1.5">
                                        {['top', 'bottom', 'left', 'right'].map(side => (
                                          <button
                                            key={side}
                                            type="button"
                                            onClick={() => {
                                              const newParts = [...(editingModule.parts || [])];
                                              const partSupplies = [...(newParts[index].supplies || [])];
                                              const sIdx = partSupplies.findIndex(ps => ps.supply_id === s.id);
                                              if (sIdx > -1) {
                                                const currentSides = partSupplies[sIdx].sides || [];
                                                if (currentSides.includes(side as any)) {
                                                  partSupplies[sIdx].sides = currentSides.filter(cs => cs !== side);
                                                } else {
                                                  partSupplies[sIdx].sides = [...currentSides, side as any];
                                                }
                                                newParts[index].supplies = partSupplies;
                                                setEditingModule({ ...editingModule, parts: newParts });
                                              }
                                            }}
                                            className={`text-[8px] px-2 py-1 rounded border transition-all ${supplyConfig.sides?.includes(side as any) ? 'bg-primary/20 border-primary text-primary font-bold' : 'bg-background-dark border-border-dark text-slate-500'}`}
                                          >
                                            {side === 'top' ? 'Topo' : side === 'bottom' ? 'Base' : side === 'left' ? 'Esq.' : 'Dir.'}
                                          </button>
                                        ))}
                                      </div>

                                      {!isLinear && (
                                        <div className="flex items-center gap-2">
                                          <label className="text-[8px] font-bold text-slate-500 uppercase whitespace-nowrap">Qtd por peça ({supplyUnit}):</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={supplyConfig.quantity_per_unit ?? 1}
                                            onChange={e => {
                                              const newParts = [...(editingModule.parts || [])];
                                              const partSupplies = [...(newParts[index].supplies || [])];
                                              const sIdx = partSupplies.findIndex(ps => ps.supply_id === s.id);
                                              if (sIdx > -1) {
                                                partSupplies[sIdx] = { ...partSupplies[sIdx], quantity_per_unit: parseFloat(e.target.value) || 0 };
                                                newParts[index].supplies = partSupplies;
                                                setEditingModule({ ...editingModule, parts: newParts });
                                              }
                                            }}
                                            className="w-20 bg-background-dark border border-border-dark rounded px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-primary"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {supplies.length === 0 && <p className="text-[9px] text-slate-600 italic">Nenhum insumo cadastrado.</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {editingModule.parts?.length === 0 && (
                      <p className="text-center py-4 text-slate-500 text-xs italic">Nenhuma peça configurada. Use L para Largura e P para Profundidade.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModuleModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Salvar Módulo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary">{editingService.id ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                <button onClick={() => setIsServiceModalOpen(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Serviço</label>
                  <input
                    required
                    value={editingService.name}
                    onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                    placeholder="Ex: Acabamento 45 Graus"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                  <select
                    value={editingService.category}
                    onChange={e => setEditingService({ ...editingService, category: e.target.value as any })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="finish">Acabamento</option>
                    <option value="edge">Borda</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço por Metro (R$/m)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={editingService.price}
                    onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minutos por Metro (min/m)</label>
                  <input
                    type="number"
                    value={editingService.minutes_per_meter || ''}
                    onChange={e => setEditingService({ ...editingService, minutes_per_meter: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                    placeholder="Ex: 15"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
                  <textarea
                    value={editingService.description}
                    onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary text-sm h-24 resize-none"
                    placeholder="Opcional..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Salvar Serviço
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

