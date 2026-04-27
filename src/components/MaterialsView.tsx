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
import { Client, Material, Service, DescriptionTemplate, QuoteItem, QuoteService, ModuleTemplate, ModulePart, Supply, Remnant } from '../types';
import { normalizeSearchText } from '../utils/helpers';


export default function MaterialsView({ searchTerm, showToast }: { searchTerm: string, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [remnants, setRemnants] = useState<Remnant[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'slabs' | 'remnants'>('slabs');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '' });
  const [remnantFormData, setRemnantFormData] = useState({ material_id: '', width: '', length: '', quantity: '1', location: '', observations: '' });
  const [stockEntryMaterial, setStockEntryMaterial] = useState<Material | null>(null);
  const [stockAmount, setStockAmount] = useState('');

  const fetchMaterials = () => {
    fetch('/api/materials').then(r => r.json()).then(setMaterials);
  };

  const fetchRemnants = () => {
    fetch('/api/remnants').then(r => r.json()).then(setRemnants);
  };

  useEffect(() => {
    fetchMaterials();
    fetchRemnants();
  }, []);

  const filteredMaterials = materials.filter((material) =>
    !searchTerm || [
      material.name,
      material.description,
      material.price,
      material.quantity
    ].some((value) => normalizeSearchText(value).includes(normalizeSearchText(searchTerm)))
  );

  const filteredRemnants = remnants.filter((r) =>
    !searchTerm || [
      r.material_name,
      r.location,
      r.observations,
      r.width,
      r.length
    ].some((value) => normalizeSearchText(value).includes(normalizeSearchText(searchTerm)))
  );

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

  const handleRemnantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/remnants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(remnantFormData)
    });

    if (res.ok) {
      showToast("Retalho adicionado ao inventário!");
      setRemnantFormData({ material_id: '', width: '', length: '', quantity: '1', location: '', observations: '' });
      setShowForm(false);
      fetchRemnants();
    } else {
      showToast("Erro ao adicionar retalho.", "error");
    }
  };

  const handleEdit = (m: Material) => {
    setFormData({
      name: m.name,
      price: m.price?.toString() || '0',
      quantity: m.quantity?.toString() || '0',
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

  const handleDeleteRemnant = async (id: number) => {
    if (confirm('Deseja remover este retalho do inventário?')) {
      const res = await fetch(`/api/remnants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Retalho removido.");
        fetchRemnants();
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
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => { setActiveSubTab('slabs'); setShowForm(false); }}
              className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${activeSubTab === 'slabs' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Chapas / Estoque Geral
            </button>
            <button 
              onClick={() => { setActiveSubTab('remnants'); setShowForm(false); }}
              className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${activeSubTab === 'remnants' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Inventário de Retalhos
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setEditingId(null);
              setFormData({ name: '', price: '', quantity: '', description: '' });
              setRemnantFormData({ material_id: '', width: '', length: '', quantity: '1', location: '', observations: '' });
            }
            setShowForm(!showForm);
          }}
          className="w-full sm:w-auto bg-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : activeSubTab === 'slabs' ? 'Adicionar Chapa' : 'Lançar Retalho'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && activeSubTab === 'slabs' && (
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
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                <input
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
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

        {showForm && activeSubTab === 'remnants' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleRemnantSubmit} className="bg-secondary-dark p-6 rounded-xl border border-border-dark grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4 mb-2">
                <h3 className="text-lg font-bold text-primary">Novo Retalho (Remanescente)</h3>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Material Vinculado</label>
                <select
                  required
                  value={remnantFormData.material_id}
                  onChange={e => setRemnantFormData({ ...remnantFormData, material_id: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione o material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Comp. (mm)</label>
                <input
                  required
                  type="number"
                  value={remnantFormData.length}
                  onChange={e => setRemnantFormData({ ...remnantFormData, length: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: 800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Largura (mm)</label>
                <input
                  required
                  type="number"
                  value={remnantFormData.width}
                  onChange={e => setRemnantFormData({ ...remnantFormData, width: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: 600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Quantidade</label>
                <input
                  required
                  type="number"
                  value={remnantFormData.quantity}
                  onChange={e => setRemnantFormData({ ...remnantFormData, quantity: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Localização</label>
                <input
                  value={remnantFormData.location}
                  onChange={e => setRemnantFormData({ ...remnantFormData, location: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Prateleira, Galpão..."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Observações</label>
                <input
                  value={remnantFormData.observations}
                  onChange={e => setRemnantFormData({ ...remnantFormData, observations: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: Canto quebrado, risco superficial..."
                />
              </div>
              <div className="md:col-span-4 flex justify-end pt-4">
                <button type="submit" className="bg-primary px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20">
                  Salvar Retalho
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {activeSubTab === 'slabs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 bg-secondary-dark p-10 rounded-xl border border-border-dark text-center text-slate-500">
              Nenhum material cadastrado.
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 bg-secondary-dark p-10 rounded-xl border border-border-dark text-center text-slate-500">
              Nenhum material encontrado para essa busca.
            </div>
          ) : filteredMaterials.map(m => (
            <div key={m.id} className="bg-secondary-dark p-6 rounded-xl border border-border-dark hover:border-primary/50 transition-all relative group shadow-sm">
              <div className="absolute top-4 right-4 flex gap-2 transition-opacity">
                <button onClick={() => handleEdit(m)} className="p-1.5 bg-white/5 rounded-md hover:bg-primary hover:text-white transition-colors text-primary" title="Editar">
                  <Settings size={14} />
                </button>
                <button onClick={() => handleDelete(m.id)} className="p-1.5 bg-white/5 rounded-md hover:bg-red-500 hover:text-white transition-colors text-red-400" title="Excluir">
                  <X size={14} />
                </button>
              </div>
              <div className="flex justify-between items-start mb-4 pr-12">
                <h3 className="font-bold text-lg">{m.name}</h3>
                <span className="text-primary font-bold">R$ {m.price}/m²</span>
              </div>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10">{m.description || 'Sem descrição.'}</p>
              <div className="flex justify-between items-center bg-background-dark/30 p-3 rounded-lg border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Estoque Atual</span>
                  <span className={`font-black text-lg ${m.quantity < 5 ? 'text-orange-500' : 'text-white'}`}>{m.quantity} m²</span>
                </div>
                <button onClick={() => setStockEntryMaterial(m)} className="p-2.5 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-secondary-dark rounded-xl border border-border-dark overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-border-dark">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Material</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Dimensões (mm)</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Qtd</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Área Unit.</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Localização</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {filteredRemnants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    {remnants.length === 0 ? 'Nenhum retalho no inventário.' : 'Nenhum retalho encontrado para essa busca.'}
                  </td>
                </tr>
              ) : filteredRemnants.map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-primary">{r.material_name}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{r.observations || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-300">
                    {r.length} x {r.width}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs font-bold">{r.quantity}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {((r.length * r.width) / 1000000).toFixed(3)} m²
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Layers size={12} className="text-primary" />
                      {r.location || 'Não espec.'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteRemnant(r.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {remnants.length > 0 && (
            <div className="bg-background-dark/50 p-4 border-t border-border-dark flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase font-bold">Resumo do Inventário</span>
              <div className="flex gap-6">
                <div>
                  <span className="text-slate-500">Total de Peças:</span>
                  <span className="ml-2 font-bold text-primary">{remnants.reduce((acc, r) => acc + r.quantity, 0)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Área Total:</span>
                  <span className="ml-2 font-bold text-primary">{remnants.reduce((acc, r) => acc + ((r.length * r.width * r.quantity) / 1000000), 0).toFixed(2)} m²</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
                  <h3 className="text-xl font-bold text-primary">Entrada de Material</h3>
                  <p className="text-slate-500 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{stockEntryMaterial.name}</p>
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

                <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5">
                  <span className="text-sm text-slate-400">Novo Estoque Estimado:</span>
                  <span className="font-black text-lg text-white">
                    {(stockEntryMaterial.quantity + (parseFloat(stockAmount) || 0)).toFixed(2)} m²
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStockEntryMaterial(null)}
                    className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors border border-transparent"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity active:scale-[0.98]"
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

