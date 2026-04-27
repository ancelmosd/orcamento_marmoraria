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
import { Client, Material, Service, DescriptionTemplate, QuoteItem, QuoteService, ModuleTemplate, ModulePart, Supply } from '../types';
import { normalizeSearchText } from '../utils/helpers';


export default function ServicesView({ searchTerm, showToast }: { searchTerm: string, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', minutes_per_meter: '', category: 'other' as 'finish'|'edge'|'other' });

  const fetchServices = () => {
    fetch('/api/services').then(r => r.json()).then(setServices);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const filteredServices = services.filter((service) =>
    !searchTerm || [
      service.name,
      service.description,
      service.category,
      service.price,
      service.minutes_per_meter
    ].some((value) => normalizeSearchText(value).includes(normalizedSearchTerm))
  );

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
      setFormData({ name: '', price: '', description: '', minutes_per_meter: '', category: 'other' });
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
      price: s.price?.toString() || '0',
      description: s.description || '',
      minutes_per_meter: (s.minutes_per_meter || 0).toString(),
      category: s.category || 'other'
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
            className="flex-1 sm:flex-none bg-secondary-dark border border-border-dark px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
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
            className="flex-1 sm:flex-none bg-secondary-dark border border-border-dark px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
          >
            <Scissors size={14} className="text-primary" /> Sugerir Bordas
          </button>
          <button
            onClick={() => {
              if (showForm) {
                setEditingId(null);
                setFormData({ name: '', price: '', description: '', minutes_per_meter: '', category: 'other' });
              }
              setShowForm(!showForm);
            }}
            className="flex-1 sm:flex-none bg-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancelar' : 'Novo Serviço'}
          </button>
        </div>
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
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: Meia Esquadria 45°"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as 'finish'|'edge'|'other' })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="finish">Acabamento</option>
                  <option value="edge">Borda</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Preço Base (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, minutes_per_meter: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: 15"
                />
              </div>
              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                <input
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
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

      <div className="grid grid-cols-1 gap-8">
        {['finish', 'edge', 'other'].map(cat => (
          <div key={cat} className="space-y-4">
            <h3 className="text-lg font-bold text-primary uppercase tracking-wider border-b border-primary/20 pb-2">
              {cat === 'finish' ? 'Acabamentos' : cat === 'edge' ? 'Bordas' : 'Outros Serviços'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.filter(s => s.category === cat).map(s => (
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
              {filteredServices.filter(s => s.category === cat).length === 0 && (
                <p className="text-slate-500 text-sm italic py-4">
                  {services.filter(s => s.category === cat).length === 0
                    ? 'Nenhum serviço nesta categoria.'
                    : 'Nenhum serviço encontrado para essa busca.'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

