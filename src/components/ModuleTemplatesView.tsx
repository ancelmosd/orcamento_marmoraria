import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Box, Plus, Trash2, Edit2, Save, X, Layers,
  Construction, Package, ArrowRight, Grid, Monitor, Eye, Copy, Cuboid
} from 'lucide-react';
import { ModuleTemplate, ModulePart, Service, Material } from '../types';
import { EDGE_TYPES, FINISHING_TYPES } from '../types';
import PartPreview3D from './PartPreview3D';
import { evaluateFormula } from '../utils/helpers';

interface ModuleTemplatesViewProps {
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export default function ModuleTemplatesView({ showToast }: ModuleTemplatesViewProps) {
  const [templates, setTemplates] = useState<ModuleTemplate[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<ModuleTemplate>>({
    name: '',
    description: '',
    parts: []
  });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [supplies, setSupplies] = useState<any[]>([]); // Using any for local state if type is not strictly needed for UI
  const [testL, setTestL] = useState(800);
  const [testP, setTestP] = useState(600);
  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ModuleTemplate | null>(null);

  useEffect(() => {
    fetch('/api/module-templates').then(r => r.json()).then(setTemplates).catch(console.error);
    fetch('/api/materials').then(r => r.json()).then(setMaterials).catch(console.error);
    fetch('/api/services').then(r => r.json()).then(setServices).catch(console.error);
    fetch('/api/supplies').then(r => r.json()).then(setSupplies).catch(console.error);
  }, []);


  const addPart = () => {
    const newPart: ModulePart = {
      id: Date.now(),
      name: 'Nova Peça',
      formula_l: 'L',
      formula_p: 'P',
      quantity: 1,
      edges: { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' }
    };
    setCurrentTemplate({
      ...currentTemplate,
      parts: [newPart, ...(currentTemplate.parts || [])]
    });
  };

  const updatePart = (index: number, field: string, value: any) => {
    const parts = [...(currentTemplate.parts || [])];
    parts[index] = { ...parts[index], [field]: value };
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const removePart = (index: number) => {
    const parts = [...(currentTemplate.parts || [])].filter((_, i) => i !== index);
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const addServiceToPart = (partIndex: number) => {
    const parts = [...(currentTemplate.parts || [])];
    const newService = { service_id: services[0]?.id || 0, dimension: 'length' as const, sides: [] as any[] };
    parts[partIndex] = {
      ...parts[partIndex],
      services: [newService, ...(parts[partIndex].services || [])]
    };
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const updatePartService = (partIndex: number, serviceIndex: number, field: string, value: any) => {
    const parts = [...(currentTemplate.parts || [])];
    const partServices = [...(parts[partIndex].services || [])];
    partServices[serviceIndex] = { ...partServices[serviceIndex], [field]: value };
    parts[partIndex] = { ...parts[partIndex], services: partServices };
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const removeServiceFromPart = (partIndex: number, serviceIndex: number) => {
    const parts = [...(currentTemplate.parts || [])];
    const partServices = [...(parts[partIndex].services || [])].filter((_, i) => i !== serviceIndex);
    parts[partIndex] = { ...parts[partIndex], services: partServices };
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const removeSupplyFromPart = (partIndex: number, supplyIndex: number) => {
    const parts = [...(currentTemplate.parts || [])];
    const partSupplies = [...(parts[partIndex].supplies || [])].filter((_, i) => i !== supplyIndex);
    parts[partIndex] = { ...parts[partIndex], supplies: partSupplies };
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const calculatePartCost = (part: ModulePart) => {
    const material = materials.find(m => m.id === currentTemplate.material_id) || materials[0];
    const defaultPrice = material?.price || 0;
    const l = evaluateFormula(part.formula_l, testL, testP) / 1000;
    const p = evaluateFormula(part.formula_p, testL, testP) / 1000;
    const m2 = l * p * part.quantity;
    let cost = m2 * defaultPrice;

    // Custo de Acabamento (Busca no banco pelo nome)
    if (part.finish) {
      const finishSrv = services.find(s => s.name === part.finish && s.category === 'finish');
      if (finishSrv) cost += m2 * finishSrv.price;
    }

    // Custo de Bordas (Busca no banco pelo nome)
    if (part.edges) {
      Object.entries(part.edges).forEach(([side, edgeName]) => {
        if (edgeName && edgeName !== 'Nenhum') {
          const edgeSrv = services.find(s => s.name === edgeName && s.category === 'edge');
          if (edgeSrv) {
            const sideLength = (side === 'top' || side === 'bottom') ? l : p;
            cost += sideLength * edgeSrv.price * part.quantity;
          }
        }
      });
    }

    // Adicionar custo de serviços extras
    part.services?.forEach(s => {
      const service = services.find(sv => sv.id === s.service_id);
      if (service) {
        if (s.dimension === 'fixed') {
          cost += service.price * part.quantity;
        } else if ((s.dimension === 'length' || s.dimension === 'width') && s.sides && s.sides.length > 0) {
          let totalDim = 0;
          s.sides.forEach(side => {
            if (side === 'top' || side === 'bottom') totalDim += evaluateFormula(part.formula_l, testL, testP);
            if (side === 'left' || side === 'right') totalDim += evaluateFormula(part.formula_p, testL, testP);
          });
          cost += (totalDim / 1000) * service.price * part.quantity;
        }
        // Se não tem lados selecionados e não é fixo, não calcula
      }
    });

    // Adicionar custo de insumos
    part.supplies?.forEach(s => {
      const supply = supplies.find(sup => sup.id === s.supply_id);
      if (supply && s.sides && s.sides.length > 0) {
        let totalDim = 0;
        s.sides.forEach(side => {
          if (side === 'top' || side === 'bottom') totalDim += evaluateFormula(part.formula_l, testL, testP);
          if (side === 'left' || side === 'right') totalDim += evaluateFormula(part.formula_p, testL, testP);
        });
        cost += (totalDim / 1000) * (supply.price_per_meter || 0) * part.quantity;
      }
    });

    return cost;
  };

  const updatePartSupply = (partIndex: number, supplyIndex: number, field: string, value: any) => {
    const parts = [...(currentTemplate.parts || [])];
    const partSupplies = [...(parts[partIndex].supplies || [])];
    partSupplies[supplyIndex] = { ...partSupplies[supplyIndex], [field]: value };
    parts[partIndex] = { ...parts[partIndex], supplies: partSupplies };
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const addSupplyToPart = (partIndex: number) => {
    const parts = [...(currentTemplate.parts || [])];
    const newSupply = { supply_id: supplies[0]?.id || 0, sides: [] as any[], quantity_per_unit: 1 };
    parts[partIndex] = {
      ...parts[partIndex],
      supplies: [newSupply, ...(parts[partIndex].supplies || [])]
    };
    setCurrentTemplate({ ...currentTemplate, parts });
  };

  const handleClone = (template: any) => {
    const cloned = {
      ...template,
      id: undefined,
      name: `${template.name} (Cópia)`
    };
    setCurrentTemplate(cloned);
    setIsEditing(true);
  };

  const getTemplateStats = (template: any) => {
    let stoneCost = 0;
    let extraCost = 0;
    const material = materials.find(m => m.id === template.material_id) || materials[0];
    const defaultPrice = material?.price || 0;

    template.parts?.forEach((part: ModulePart) => {
      const curL = template.default_l || 1000;
      const curP = template.default_p || 600;
      const l = evaluateFormula(part.formula_l, curL, curP) / 1000;
      const p = evaluateFormula(part.formula_p, curL, curP) / 1000;
      const m2 = l * p * part.quantity;
      stoneCost += m2 * defaultPrice;

      // Custo de Acabamento
      if (part.finish) {
        const finishSrv = services.find(s => s.name === part.finish && s.category === 'finish');
        if (finishSrv) extraCost += m2 * finishSrv.price;
      }

      // Custo de Bordas
      if (part.edges) {
        Object.entries(part.edges).forEach(([side, edgeName]) => {
          if (edgeName && edgeName !== 'Nenhum') {
            const edgeSrv = services.find(s => s.name === edgeName && s.category === 'edge');
            if (edgeSrv) {
              const sideLength = (side === 'top' || side === 'bottom') ? l : p;
              extraCost += sideLength * edgeSrv.price * part.quantity;
            }
          }
        });
      }

      // Serviços Extras
      part.services?.forEach(s => {
        const service = services.find(sv => sv.id === s.service_id);
        if (service) {
          if (s.dimension === 'fixed') {
            extraCost += service.price * part.quantity;
          } else if ((s.dimension === 'length' || s.dimension === 'width') && s.sides && s.sides.length > 0) {
            let totalDim = 0;
            s.sides.forEach(side => {
              if (side === 'top' || side === 'bottom') totalDim += l * 1000;
              if (side === 'left' || side === 'right') totalDim += p * 1000;
            });
            extraCost += (totalDim / 1000) * service.price * part.quantity;
          }
          // Se não tem lados e não é fixo, não calcula
        }
      });

      // Insumos
      part.supplies?.forEach(s => {
        const supply = supplies.find(sup => sup.id === s.supply_id);
        if (supply && s.sides && s.sides.length > 0) {
          let totalDim = 0;
          s.sides.forEach(side => {
            if (side === 'top' || side === 'bottom') totalDim += l * 1000;
            if (side === 'left' || side === 'right') totalDim += p * 1000;
          });
          extraCost += (totalDim / 1000) * (supply.price_per_meter || 0) * part.quantity;
        }
      });
    });

    return { stoneCost, extraCost, materialName: material?.name };
  };

  const handleSave = async () => {
    try {
      const method = currentTemplate.id ? 'PUT' : 'POST';
      const url = currentTemplate.id
        ? `/api/module-templates/${currentTemplate.id}`
        : '/api/module-templates';

      const templateToSave = {
        ...currentTemplate,
        default_l: testL,
        default_p: testP
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateToSave)
      });

      if (!response.ok) throw new Error('Erro ao salvar template');

      showToast('Template salvo com sucesso!', 'success');
      setIsEditing(false);
      // Refresh templates list
      const r = await fetch('/api/module-templates');
      const data = await r.json();
      setTemplates(data);
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar o template.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este template?")) return;
    try {
      const res = await fetch(`/api/module-templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Template excluído com sucesso!");
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (e) {
      showToast("Erro ao excluir template", "error");
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Templates de Módulos</h1>
          <p className="text-slate-500 text-sm">Crie peças inteligentes que se adaptam às medidas do projeto.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setCurrentTemplate({ name: '', description: '', parts: [] });
              setIsEditing(true);
            }}
            className="px-4 py-2.5 rounded-lg font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={18} /> Novo Template
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-secondary-dark p-6 rounded-xl border border-border-dark space-y-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg text-primary">
                  <Edit2 size={20} />
                </div>
                <h3 className="text-xl font-bold">Editando Módulo</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full min-h-[600px]">
              {/* Lado Esquerdo: 3D e Testes (3/5 da largura) */}
              <div className="lg:col-span-6 space-y-6 flex flex-col h-full">
                <div className="flex-1 min-h-[400px]">
                  {currentTemplate.parts && currentTemplate.parts.length > 0 ? (
                    <PartPreview3D
                      parts={currentTemplate.parts.map((p, idx) => ({
                        id: p.id || idx,
                        width: evaluateFormula(p.formula_l || '0', testL, testP),
                        length: evaluateFormula(p.formula_p || '0', testL, testP),
                        thickness: 20, // Default for now
                        x: evaluateFormula(p.pos_x || '0', testL, testP),
                        y: evaluateFormula(p.pos_y || '0', testL, testP),
                        z: evaluateFormula(p.pos_z || '0', testL, testP),
                        rotX: evaluateFormula(p.rot_x || '0', testL, testP),
                        rotY: evaluateFormula(p.rot_y || '0', testL, testP),
                        rotZ: evaluateFormula(p.rot_z || '0', testL, testP),
                        finish: p.finish,
                        isSelected: selectedPartIndex === idx
                      }))}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900/50 rounded-2xl border border-dashed border-border-dark flex items-center justify-center text-slate-600 italic">
                      Adicione uma peça para ver o 3D
                    </div>
                  )}
                </div>

                <div className="bg-background-dark/40 p-5 rounded-2xl border border-border-dark space-y-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Monitor size={14} /> Valores de Teste (Simulação)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Largura Total (L)</label>
                      <input
                        type="number"
                        value={testL}
                        onChange={e => setTestL(Number(e.target.value))}
                        className="w-full bg-secondary-dark border border-border-dark rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Profundidade (P)</label>
                      <input
                        type="number"
                        value={testP}
                        onChange={e => setTestP(Number(e.target.value))}
                        className="w-full bg-secondary-dark border border-border-dark rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Configurações (2/5 da largura) */}
              <div className="lg:col-span-4 space-y-6 overflow-y-auto max-h-[700px] pr-2 scrollbar-hide border-l border-border-dark/50 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome do Módulo</label>
                    <input
                      value={currentTemplate.name}
                      onChange={e => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: Gabinete de Cozinha"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                    <input
                      value={currentTemplate.description}
                      onChange={e => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: Conjunto padrão para pias"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Chapa Padrão</label>
                    <select
                      value={currentTemplate.material_id || ''}
                      onChange={e => setCurrentTemplate({ ...currentTemplate, material_id: parseInt(e.target.value) })}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Selecione uma pedra...</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Grid size={16} className="text-primary" /> Peças Componentes
                    </h4>
                    <button onClick={addPart} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 hover:bg-primary/20 transition-colors">
                      <Plus size={14} /> Adicionar Peça
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentTemplate.parts?.map((part, idx) => (
                      <div key={part.id || idx} className="space-y-3">
                        {/* Item da Lista Compacto */}
                        <div
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedPartIndex === idx
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-background-dark border-border-dark hover:border-slate-600'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${selectedPartIndex === idx ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold">{part.name}</h5>
                              <p className="text-[10px] text-emerald-400 font-mono">
                                Est: R$ {calculatePartCost(part).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedPartIndex(selectedPartIndex === idx ? -1 : idx)}
                              className={`p-2 rounded-lg transition-colors ${selectedPartIndex === idx ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/5'
                                }`}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => removePart(idx)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Painel de Edição Expandido */}
                        <AnimatePresence>
                          {selectedPartIndex === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-background-dark/50 border border-primary/20 rounded-xl space-y-5 mb-4">
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-600 uppercase">Nome da Peça</label>
                                    <input
                                      value={part.name}
                                      onChange={e => updatePart(idx, 'name', e.target.value)}
                                      className="w-full bg-secondary-dark/50 border border-border-dark rounded-lg px-3 py-2 text-sm"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-600 uppercase">Fórmula L (Largura)</label>
                                      <input
                                        value={part.formula_l}
                                        onChange={e => updatePart(idx, 'formula_l', e.target.value)}
                                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-2 text-xs font-mono text-primary"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-600 uppercase">Fórmula P (Profundidade)</label>
                                      <input
                                        value={part.formula_p}
                                        onChange={e => updatePart(idx, 'formula_p', e.target.value)}
                                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-2 text-xs font-mono text-emerald-400"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-600 uppercase">Acabamento</label>
                                      <select
                                        value={part.finish || ''}
                                        onChange={e => updatePart(idx, 'finish', e.target.value)}
                                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-2 text-[10px]"
                                      >
                                        {services.filter(s => s.category === 'finish').length > 0
                                          ? services.filter(s => s.category === 'finish').map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                          : FINISHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)
                                        }
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-600 uppercase">Quantidade</label>
                                      <input
                                        type="number"
                                        value={part.quantity}
                                        onChange={e => updatePart(idx, 'quantity', parseInt(e.target.value) || 1)}
                                        className="w-full bg-secondary-dark border border-border-dark rounded-lg px-2 py-2 text-xs text-center"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-border-dark">
                                  <h6 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Posicionamento</h6>
                                  <div className="grid grid-cols-3 gap-2">
                                    <input value={part.pos_x || '0'} onChange={e => updatePart(idx, 'pos_x', e.target.value)} className="bg-secondary-dark border border-border-dark rounded px-2 py-1.5 text-[10px] font-mono text-blue-400" placeholder="X" />
                                    <input value={part.pos_y || '0'} onChange={e => updatePart(idx, 'pos_y', e.target.value)} className="bg-secondary-dark border border-border-dark rounded px-2 py-1.5 text-[10px] font-mono text-amber-400" placeholder="Y" />
                                    <input value={part.pos_z || '0'} onChange={e => updatePart(idx, 'pos_z', e.target.value)} className="bg-secondary-dark border border-border-dark rounded px-2 py-1.5 text-[10px] font-mono text-emerald-400" placeholder="Z" />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <input value={part.rot_x || '0'} onChange={e => updatePart(idx, 'rot_x', e.target.value)} className="bg-secondary-dark border border-border-dark rounded px-2 py-1.5 text-[10px] font-mono text-pink-400" placeholder="Rot X" />
                                    <input value={part.rot_y || '0'} onChange={e => updatePart(idx, 'rot_y', e.target.value)} className="bg-secondary-dark border border-border-dark rounded px-2 py-1.5 text-[10px] font-mono text-purple-400" placeholder="Rot Y" />
                                    <input value={part.rot_z || '0'} onChange={e => updatePart(idx, 'rot_z', e.target.value)} className="bg-secondary-dark border border-border-dark rounded px-2 py-1.5 text-[10px] font-mono text-cyan-400" placeholder="Rot Z" />
                                  </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-border-dark">
                                  <h6 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Bordas</h6>
                                  {services.filter(s => s.category === 'edge').length === 0 ? (
                                    <p className="text-[9px] text-slate-600 italic">Nenhum serviço de borda cadastrado em Serviços.</p>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {[
                                        { key: 'top', label: 'Topo' },
                                        { key: 'bottom', label: 'Base' },
                                        { key: 'left', label: 'Esq.' },
                                        { key: 'right', label: 'Dir.' }
                                      ].map(side => (
                                        <div key={side.key} className="space-y-1">
                                          <label className="text-[8px] font-bold text-slate-500 uppercase">{side.label}</label>
                                          <select
                                            value={part.edges?.[side.key as keyof typeof part.edges] || 'Nenhum'}
                                            onChange={e => updatePart(idx, 'edges', { ...part.edges, [side.key]: e.target.value })}
                                            className="w-full bg-secondary-dark border border-border-dark rounded px-1 py-1 text-[8px]"
                                          >
                                            <option value="Nenhum">Nenhum</option>
                                            {services.filter(s => s.category === 'edge').map(s => (
                                              <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3 pt-3 border-t border-border-dark">
                                  <div className="flex justify-between items-center">
                                    <h6 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Serviços Extras</h6>
                                    <button onClick={() => addServiceToPart(idx)} className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline">
                                      <Plus size={12} /> Add
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {part.services?.map((s, sIdx) => (
                                      <div key={sIdx} className="bg-background-dark/50 p-2 rounded-lg border border-border-dark flex flex-col gap-2">
                                        <div className="flex gap-2">
                                          <select
                                            value={s.service_id}
                                            onChange={e => updatePartService(idx, sIdx, 'service_id', parseInt(e.target.value))}
                                            className="flex-1 bg-secondary-dark border border-border-dark rounded px-2 py-1 text-[10px]"
                                          >
                                            {services.map(sv => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
                                          </select>
                                          <button onClick={() => removeServiceFromPart(idx, sIdx)} className="text-slate-500 hover:text-red-400 p-1">
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {[
                                            { key: 'top', label: 'Topo' },
                                            { key: 'bottom', label: 'Base' },
                                            { key: 'left', label: 'Esq' },
                                            { key: 'right', label: 'Dir' }
                                          ].map(side => {
                                            const isSelected = s.sides?.includes(side.key as any);
                                            return (
                                              <button
                                                key={side.key}
                                                onClick={() => {
                                                  const currentSides = s.sides || [];
                                                  const newSides = isSelected
                                                    ? currentSides.filter(sd => sd !== side.key)
                                                    : [...currentSides, side.key as any];
                                                  updatePartService(idx, sIdx, 'sides', newSides);
                                                }}
                                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${isSelected ? 'bg-primary text-white shadow-sm' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                                  }`}
                                              >
                                                {side.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-border-dark">
                                  <div className="flex justify-between items-center">
                                    <h6 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Insumos</h6>
                                    <button onClick={() => addSupplyToPart(idx)} className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 hover:underline">
                                      <Plus size={12} /> Add
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {part.supplies?.map((s, sIdx) => (
                                      <div key={sIdx} className="bg-background-dark/50 p-2 rounded-lg border border-border-dark flex flex-col gap-2">
                                        <div className="flex gap-2">
                                          <select
                                            value={s.supply_id}
                                            onChange={e => updatePartSupply(idx, sIdx, 'supply_id', parseInt(e.target.value))}
                                            className="flex-1 bg-secondary-dark border border-border-dark rounded px-2 py-1 text-[10px]"
                                          >
                                            {supplies.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                                          </select>
                                          <button onClick={() => removeSupplyFromPart(idx, sIdx)} className="text-slate-500 hover:text-red-400 p-1">
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {[
                                            { key: 'top', label: 'Topo' },
                                            { key: 'bottom', label: 'Base' },
                                            { key: 'left', label: 'Esq' },
                                            { key: 'right', label: 'Dir' }
                                          ].map(side => {
                                            const isSelected = s.sides?.includes(side.key as any);
                                            return (
                                              <button
                                                key={side.key}
                                                onClick={() => {
                                                  const currentSides = s.sides || [];
                                                  const newSides = isSelected
                                                    ? currentSides.filter(sd => sd !== side.key)
                                                    : [...currentSides, side.key as any];
                                                  updatePartSupply(idx, sIdx, 'sides', newSides);
                                                }}
                                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                                  }`}
                                              >
                                                {side.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 flex justify-end gap-3 sticky bottom-0 bg-secondary-dark py-4 border-t border-border-dark">
                  <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-xl font-bold border border-border-dark text-slate-400 hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSave} className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
                    <Save size={18} /> Salvar Template
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div className="space-y-3">
            {templates.map(template => {
              const stats = getTemplateStats(template);
              return (
                <motion.div
                  key={template.id}
                  layoutId={`template-${template.id}`}
                  className="bg-secondary-dark p-4 rounded-xl border border-border-dark hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="bg-primary/10 p-2.5 rounded-lg text-primary flex-shrink-0">
                      <Box size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate">{template.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-500 text-[10px] line-clamp-1">{template.description}</p>
                        {stats.materialName && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                            {stats.materialName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                    <div className="px-4 lg:border-l border-border-dark/50">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Medida Ref.</p>
                      <p className="text-xs font-mono text-slate-300 whitespace-nowrap">{template.default_l || 1000} x {template.default_p || 600}</p>
                    </div>
                    <div className="hidden sm:block px-4 border-l border-border-dark/50">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Custo Pedra</p>
                      <p className="text-xs font-mono text-emerald-400 whitespace-nowrap">R$ {stats.stoneCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="hidden sm:block px-4 border-l border-border-dark/50">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Serv./Insumos</p>
                      <p className="text-xs font-mono text-blue-400 whitespace-nowrap">R$ {stats.extraCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="px-4 border-l border-border-dark/50">
                      <p className="text-[10px] text-primary uppercase font-black tracking-tighter">Valor Total</p>
                      <p className="text-sm font-black text-primary whitespace-nowrap">R$ {(stats.stoneCost + stats.extraCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-[8px] text-slate-600 font-normal">*Mat. ref.: {stats.materialName}</p>
                    </div>

                    <div className="flex items-center gap-1 pl-4 border-l border-border-dark/50">
                      <button
                        onClick={() => {
                          setPreviewTemplate(template);
                          setIsPreviewing(true);
                        }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Visualizar 3D"
                      >
                        <Cuboid size={18} />
                      </button>
                      <button
                        onClick={() => handleClone(template)}
                        className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                        title="Clonar Template"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTemplate(template);
                          setTestL(template.default_l || 800);
                          setTestP(template.default_p || 600);
                          setIsEditing(true);
                        }}
                        className="p-2 text-slate-400 hover:bg-white/5 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => template.id && handleDelete(template.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Visualização 3D */}
      <AnimatePresence>
        {isPreviewing && previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-secondary-dark w-full h-full rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-background-dark/50">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-2xl text-primary">
                    <Box size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{previewTemplate.name}</h3>
                    <p className="text-slate-500 text-xs">{previewTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewing(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 relative bg-slate-950">
                <PartPreview3D
                  parts={previewTemplate.parts.map((p, idx) => ({
                    id: p.id || idx,
                    width: evaluateFormula(p.formula_l || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    length: evaluateFormula(p.formula_p || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    thickness: 20,
                    x: evaluateFormula(p.pos_x || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    y: evaluateFormula(p.pos_y || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    z: evaluateFormula(p.pos_z || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    rotX: evaluateFormula(p.rot_x || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    rotY: evaluateFormula(p.rot_y || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    rotZ: evaluateFormula(p.rot_z || '0', previewTemplate.default_l || 1000, previewTemplate.default_p || 600),
                    finish: p.finish,
                    isSelected: false
                  }))}
                />

                <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-[10px] space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-widest">Medidas de Visualização</p>
                  <p className="text-white">Largura: <span className="text-primary font-mono font-bold">{previewTemplate.default_l || 1000}mm</span></p>
                  <p className="text-white">Profundidade: <span className="text-emerald-400 font-mono font-bold">{previewTemplate.default_p || 600}mm</span></p>
                </div>
              </div>

              <div className="p-6 bg-background-dark/50 border-t border-white/5 flex justify-center">
                <button
                  onClick={() => setIsPreviewing(false)}
                  className="px-12 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
