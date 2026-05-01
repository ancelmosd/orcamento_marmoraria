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
import { generateQuotePDF } from '../utils/pdfGenerator';
import { normalizeSearchText, evaluateFormula } from '../utils/helpers';
import { PhotoGallery } from './PhotoGallery';

export default function QuotesView({ 
  editId, onSave, onCancel, showToast, moduleToAdd, onModuleAdded, companyInfo 
}: { 
  editId?: number | null, 
  onSave: () => void, 
  onCancel: () => void, 
  showToast: (m: string, t?: 'success' | 'error') => void,
  moduleToAdd?: ModuleTemplate | null,
  onModuleAdded?: () => void,
  companyInfo?: any,
  documentSettings?: any,
  paymentSettings?: any
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [suppliesList, setSuppliesList] = useState<Supply[]>([]);
  const [descriptionTemplates, setDescriptionTemplates] = useState<{ id: number, text: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [quoteItems, setQuoteItems] = useState<{ materialId: string, length: number, width: number, quantity: number, description: string }[]>([]);
  const [quoteServices, setQuoteServices] = useState<{ serviceId: string, quantity: number, unitPrice: number, description: string }[]>([]);
  const [showModuleConfirm, setShowModuleConfirm] = useState(false);
  const [tempDimensions, setTempDimensions] = useState({ L: 800, P: 600 });

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
    fetch('/api/materials').then(r => r.json()).then(setMaterials);
    fetch('/api/services').then(r => r.json()).then(setServicesList);
    fetch('/api/supplies').then(r => r.json()).then(setSuppliesList);
    fetch('/api/description-templates').then(r => r.json()).then(setDescriptionTemplates);
  }, []);

  useEffect(() => {
    if (editId) {
      fetch(`/api/quotes/${editId}`)
        .then(r => r.json())
        .then(data => {
          setSelectedClientId(data.client_id ? data.client_id.toString() : '');
          setProjectName(data.project_name || '');
          setDeliveryDate(data.delivery_date || '');
          setQuoteItems(data.items.map((item: any) => ({
            materialId: item.material_id ? item.material_id.toString() : '',
            length: item.length || 0,
            width: item.width || 0,
            quantity: item.quantity || 1,
            description: item.description || ''
          })));
          setQuoteServices(data.services.map((s: any) => ({
            serviceId: s.service_id ? s.service_id.toString() : '',
            quantity: s.quantity || 0,
            unitPrice: s.unit_price || 0,
            description: s.description || ''
          })));
        });
    } else {
      setSelectedClientId('');
      setProjectName('');
      setDeliveryDate('');
      setQuoteItems([{ materialId: '', length: 0, width: 0, quantity: 1, description: '' }]);
      setQuoteServices([]);
    }
  }, [editId]);

  useEffect(() => {
    if (moduleToAdd) {
      setShowModuleConfirm(true);
    }
  }, [moduleToAdd]);

  const confirmAddModule = () => {
    if (!moduleToAdd) return;
    
    const newItems: any[] = [];
    const newServices: any[] = [];

    moduleToAdd.parts.forEach(part => {
      const partLength = evaluateFormula(part.formula_p, tempDimensions.L, tempDimensions.P);
      const partWidth = evaluateFormula(part.formula_l, tempDimensions.L, tempDimensions.P);
      
      const edges = part.edges || { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' };
      const edgeStr = `Topo: ${edges.top}, Base: ${edges.bottom}, Esq.: ${edges.left}, Dir.: ${edges.right}`;
      
      // Adicionar a peça (Material)
      newItems.push({
        materialId: '', // Usuário selecionará o material
        length: partLength,
        width: partWidth,
        quantity: part.quantity,
        description: `${moduleToAdd.name}: ${part.name} (${part.finish || 'Polido'} / ${edgeStr})`
      });

      // Adicionar serviços extras vinculados à peça
      if (part.services) {
        part.services.forEach(ps => {
          const service = servicesList.find(s => s.id === ps.service_id);
          if (service) {
            let qty = 1;
            if (ps.dimension === 'length' && ps.sides && ps.sides.length > 0) {
              let totalDim = 0;
              ps.sides.forEach(side => {
                if (side === 'top' || side === 'bottom') totalDim += partWidth;
                if (side === 'left' || side === 'right') totalDim += partLength;
              });
              qty = (totalDim * part.quantity) / 1000;
            } else if (ps.dimension === 'length') {
               // Fallback para quando não tem lados mas é 'length' (antigo 'Pela Largura')
               qty = (partWidth * part.quantity) / 1000;
            } else if (ps.dimension === 'width') {
               qty = (partLength * part.quantity) / 1000;
            } else if (ps.dimension === 'fixed') {
               qty = part.quantity;
            }

            newServices.push({
              serviceId: service.id.toString(),
              quantity: qty,
              unitPrice: service.price,
              description: `Serviço p/ ${part.name}: ${service.name}`
            });
          }
        });
      }

      // Adicionar insumos vinculados à peça
      if (part.supplies) {
        part.supplies.forEach(ps => {
          // Buscamos o insumo na lista (precisamos carregar suppliesList no QuotesView)
          const supply = suppliesList.find(s => s.id === ps.supply_id);
          if (supply && ps.sides && ps.sides.length > 0) {
            let totalDim = 0;
            ps.sides.forEach(side => {
              if (side === 'top' || side === 'bottom') totalDim += partWidth;
              if (side === 'left' || side === 'right') totalDim += partLength;
            });

            newServices.push({
              serviceId: '', // Insumos podem não ter um serviceId direto, ou podemos mapear
              quantity: (totalDim * part.quantity) / 1000,
              unitPrice: supply.price_per_meter,
              description: `Insumo (${supply.name}) p/ ${part.name}`
            });
          }
        });
      }

      // Opcional: Adicionar serviços baseados nas bordas (se houver correspondência de nome)
      if (part.edges) {
        Object.entries(part.edges).forEach(([side, edgeType]) => {
          if (edgeType !== 'Nenhum') {
            const edgeService = servicesList.find(s => 
              normalizeSearchText(s.name).includes(normalizeSearchText(edgeType))
            );
            if (edgeService) {
              let dim = 0;
              if (side === 'top' || side === 'bottom') dim = partWidth;
              if (side === 'left' || side === 'right') dim = partLength;

              newServices.push({
                serviceId: edgeService.id.toString(),
                quantity: (dim * part.quantity) / 1000,
                unitPrice: edgeService.price,
                description: `Acabamento ${edgeType} (${side}) - ${part.name}`
              });
            }
          }
        });
      }
    });

    setQuoteItems([...newItems, ...quoteItems.filter(item => item.materialId !== '' || item.description !== '')]);
    setQuoteServices([...newServices, ...quoteServices]);
    setShowModuleConfirm(false);
    onModuleAdded?.();
  };

  const addItem = () => {
    setQuoteItems([{ materialId: '', length: 0, width: 0, quantity: 1, description: '' }, ...quoteItems]);
  };

  const addQuoteService = () => {
    setQuoteServices([{ serviceId: '', quantity: 1, unitPrice: 0, description: '' }, ...quoteServices]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...quoteItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setQuoteItems(newItems);
  };

  const updateQuoteService = (index: number, field: string, value: any) => {
    const newServices = [...quoteServices];
    const updatedService = { ...newServices[index], [field]: value };

    if (field === 'serviceId' && value) {
      const service = servicesList.find(s => s.id?.toString() === value.toString());
      if (service) {
        updatedService.unitPrice = service.price;
      }
    }

    newServices[index] = updatedService;
    setQuoteServices(newServices);
  };

  const calculateSubtotal = (item: any) => {
    const material = materials.find(m => m.id?.toString() === item.materialId?.toString());
    if (!material) return 0;
    return (item.length * item.width * item.quantity * material.price) / 1000000;
  };

  const calculateServiceSubtotal = (item: any) => {
    return item.quantity * item.unitPrice;
  };

  const totalMaterials = quoteItems.reduce((acc, item) => acc + calculateSubtotal(item), 0);
  const totalServices = quoteServices.reduce((acc, item) => acc + calculateServiceSubtotal(item), 0);
  const totalArea = quoteItems.reduce((acc, item) => acc + (item.length * item.width * item.quantity) / 1000000, 0);

  const totalMinutes = quoteServices.reduce((acc, item) => {
    const service = servicesList.find(s => s.id?.toString() === item.serviceId?.toString());
    if (!service) return acc;
    return acc + (item.quantity * (service.minutes_per_meter || 0));
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round(totalMinutes % 60);

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
        subtotal_m2: (item.length * item.width * item.quantity) / 1000000,
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
          delivery_date: deliveryDate || null,
          total_value: totalValue,
          discount: 0,
          origin: 'standard',
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary text-sm text-slate-400"
                placeholder="Data de Entrega"
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

            <div className="space-y-2">
              {/* Cabeçalho */}
              {quoteItems.length > 0 && (
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <div className="col-span-2">Material</div>
                  <div className="col-span-4">Descrição / Peça</div>
                  <div className="col-span-1 text-center">Prof (mm)</div>
                  <div className="col-span-1 text-center">Larg (mm)</div>
                  <div className="col-span-1 text-center">Qtd</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1"></div>
                </div>
              )}

              {quoteItems.map((item, index) => (
                <div key={index} className="p-2 md:p-3 rounded-xl bg-background-dark/50 border border-border-dark grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative group hover:border-primary/30 transition-colors">
                  <div className="col-span-1 md:col-span-2">
                    <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Material</label>
                    <select
                      value={item.materialId}
                      onChange={e => updateItem(index, 'materialId', e.target.value)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">Selecione</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                    <input
                      list="description-templates"
                      value={item.description || ''}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Ex: Bancada Pia..."
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Prof.</label>
                    <input
                      type="number"
                      value={item.length}
                      onChange={e => updateItem(index, 'length', parseFloat(e.target.value) || 0)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Larg.</label>
                    <input
                      type="number"
                      value={item.width}
                      onChange={e => updateItem(index, 'width', parseFloat(e.target.value) || 0)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Qtd</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Subtotal</label>
                    <div className="text-xs font-black text-right pr-2 text-primary">
                      R$ {calculateSubtotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-1 flex justify-center">
                    <button
                      onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== index))}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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

            <div className="space-y-2">
              {quoteServices.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border-dark rounded-xl text-slate-500 text-sm">
                  Nenhum serviço extra adicionado.
                </div>
              ) : (
                <>
                  {/* Cabeçalho */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <div className="col-span-3">Serviço</div>
                    <div className="col-span-4">Descrição / Detalhe</div>
                    <div className="col-span-1 text-center">Qtd</div>
                    <div className="col-span-2 text-right">Preço Unit.</div>
                    <div className="col-span-1 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>

                  {quoteServices.map((item, index) => (
                    <div key={index} className="p-2 md:p-3 rounded-xl bg-background-dark/50 border border-border-dark grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative group hover:border-primary/30 transition-colors">
                      <div className="col-span-1 md:col-span-3">
                        <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Serviço</label>
                        <select
                          value={item.serviceId}
                          onChange={e => updateQuoteService(index, 'serviceId', e.target.value)}
                          className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="">Selecione</option>
                          {servicesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                        <input
                          list="description-templates"
                          value={item.description || ''}
                          onChange={e => updateQuoteService(index, 'description', e.target.value)}
                          className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                          placeholder="Ex: Acabamento..."
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1">
                        <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Qtd</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateQuoteService(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Preço</label>
                        <input
                          type="number" step="0.01"
                          value={item.unitPrice}
                          onChange={e => updateQuoteService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-1.5 text-xs text-right focus:ring-1 focus:ring-primary outline-none pr-3"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1">
                        <label className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 block">Subtotal</label>
                        <div className="text-xs font-black text-right text-primary">
                          {calculateServiceSubtotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-1 flex justify-center">
                        <button
                          onClick={() => setQuoteServices(quoteServices.filter((_, i) => i !== index))}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Galeria de Fotos (Apenas se estiver editando) */}
          {editId && (
            <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6">
              <PhotoGallery quoteId={editId} showToast={showToast} />
            </div>
          )}
        </div>

        <datalist id="description-templates">
          {descriptionTemplates.map(t => <option key={t.id} value={t.text} />)}
        </datalist>

        <div className="xl:col-span-1">
          <div className="bg-secondary-dark p-6 rounded-xl border border-border-dark sticky top-24 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" /> Resumo</h3>
            <div className="space-y-3">
              <SummaryItem label="Total Materiais" value={`R$ ${totalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <SummaryItem label="Total Serviços" value={`R$ ${totalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <SummaryItem label="Área Total" value={`${totalArea.toFixed(2)} m²`} />
              <SummaryItem label="Tempo Estimado" value={`${totalHours}h ${remainingMinutes}min`} />
            </div>
            <div className="pt-6 border-t border-border-dark">
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase mb-1">Total Estimado</p>
                <p className="text-3xl font-black text-primary">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSaveQuote}
                className="py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                {editId ? 'Atualizar' : 'Salvar'}
              </button>
              <button 
                onClick={() => {
                  try {
                    // Montar um objeto de quote similar ao do HistoryView para o PDF
                    const quoteData = {
                      id: editId || 0,
                      client_name: clients.find(c => c.id.toString() === selectedClientId)?.name || 'Cliente',
                      client_phone: clients.find(c => c.id.toString() === selectedClientId)?.phone || '',
                      project_name: projectName,
                      delivery_date: deliveryDate,
                      total_value: totalValue,
                      items: quoteItems,
                      services: quoteServices
                    };
                    generateQuotePDF(quoteData, companyInfo, 'standard', documentSettings, paymentSettings);
                    showToast("PDF gerado com sucesso!");
                  } catch (err) {
                    showToast("Erro ao gerar PDF.", "error");
                  }
                }}
                className="py-3 bg-white/5 text-white font-bold rounded-xl border border-border-dark hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModuleConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-secondary-dark border border-border-dark p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-2xl text-primary">
                  <Box size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configurar Módulo</h3>
                  <p className="text-slate-500 text-sm">{moduleToAdd?.name}</p>
                </div>
              </div>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Largura Total (L)</label>
                  <input 
                    type="number" 
                    value={tempDimensions.L} 
                    onChange={e => setTempDimensions({ ...tempDimensions, L: Number(e.target.value) })}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary font-mono text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Profundidade (P)</label>
                  <input 
                    type="number" 
                    value={tempDimensions.P} 
                    onChange={e => setTempDimensions({ ...tempDimensions, P: Number(e.target.value) })}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary font-mono text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowModuleConfirm(false);
                    onModuleAdded?.();
                  }}
                  className="flex-1 py-3 rounded-xl font-bold border border-border-dark text-slate-400 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAddModule}
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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




