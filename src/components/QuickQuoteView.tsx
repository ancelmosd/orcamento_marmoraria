import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Package, Search, Plus, 
  X, Check, Settings, Trash2, 
  Calculator, Bolt, Layers, Eye, Edit2, Cuboid
} from 'lucide-react';
import PartPreview3D from './PartPreview3D';
import { 
  FINISHING_TYPES, EDGE_TYPES, ModulePartService, ModulePartSupply, 
  Client, Material, Service, ModuleTemplate, Supply 
} from '../types';
import { normalizeSearchText, evaluateFormula } from '../utils/helpers';

export default function QuickQuoteView({ showToast, editId, onSave, onCancel }: { 
  showToast: (m: string, t?: 'success' | 'error') => void,
  editId?: number | null,
  onSave?: () => void,
  onCancel?: () => void
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplate[]>([]);
  const [descriptionTemplates, setDescriptionTemplates] = useState<{ id: number, text: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ L: 800, P: 600 });
  const [calculatedParts, setCalculatedParts] = useState<any[]>([]);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [addedModules, setAddedModules] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewModule, setPreviewModule] = useState<any>(null);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editingModuleData, setEditingModuleData] = useState<any>(null);
  const [editDimensions, setEditDimensions] = useState({ L: 800, P: 600 });

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
    fetch('/api/materials').then(r => r.json()).then(setMaterials);
    fetch('/api/services').then(r => r.json()).then(setServices);
    fetch('/api/supplies').then(r => r.json()).then(setSupplies);
    fetch('/api/module-templates').then(r => r.json()).then(setModuleTemplates);
    fetch('/api/description-templates').then(r => r.json()).then(setDescriptionTemplates);

    if (editId) {
      fetch(`/api/quotes/${editId}`)
        .then(r => r.json())
        .then(data => {
          setSelectedClientId(data.client_id);
          setProjectName(data.project_name || '');
          // O Orçamento Rápido assume um material global para o projeto
          if (data.items && data.items.length > 0) {
            setSelectedMaterialId(data.items[0].material_id);
          }
          if (data.metadata) {
            try {
              const meta = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
              setAddedModules(meta);
            } catch (e) {
              console.error("Erro ao carregar metadados do orçamento rápido", e);
            }
          }
        });
    }
  }, [editId]);

  useEffect(() => {
    if (selectedModuleId && !hasManualEdits) {
      const template = moduleTemplates.find(t => t.id === selectedModuleId);
      if (template) {
        const parts = template.parts.map(part => ({
          id: part.id || crypto.randomUUID(),
          name: part.name,
          width: evaluateFormula(part.formula_l, dimensions.L, dimensions.P),
          length: evaluateFormula(part.formula_p, dimensions.L, dimensions.P),
          quantity: part.quantity,
          finish: part.finish || 'Polido',
          edges: part.edges || { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' },
          services: part.services,
          supplies: part.supplies,
          pos_x: part.pos_x,
          pos_y: part.pos_y,
          pos_z: part.pos_z,
          rot_x: part.rot_x,
          rot_y: part.rot_y,
          rot_z: part.rot_z
        }));
        setCalculatedParts(parts);
      }
    } else if (!selectedModuleId) {
      setCalculatedParts([]);
      setHasManualEdits(false);
    }
  }, [selectedModuleId, dimensions.L, dimensions.P, moduleTemplates, hasManualEdits]);

  // Calcula o valor de um módulo individual usando o material selecionado pelo usuário
  const calcModuleValue = (mod: any): number => {
    const material = materials.find(m => m.id === selectedMaterialId);
    let total = 0;

    mod.parts.forEach((part: any) => {
      const m2 = (part.width * part.length * part.quantity) / 1000000;
      if (material) total += m2 * material.price;

      const finishService = services.find(s => s.category === 'finish' && s.name === part.finish);
      if (finishService) total += m2 * finishService.price;

      if (part.edges) {
        Object.entries(part.edges).forEach(([side, type]) => {
          if (!type || type === 'Nenhum') return;
          const edgeService = services.find(s => s.category === 'edge' && s.name === type);
          if (edgeService) {
            const edgeLengthM = ((side === 'top' || side === 'bottom' ? part.width : part.length) / 1000) * part.quantity;
            total += edgeLengthM * edgeService.price;
          }
        });
      }

      if (part.services) {
        part.services.forEach((ps: any) => {
          const service = services.find(s => s.id === ps.service_id);
          if (service) {
            if (ps.dimension === 'fixed') {
              total += service.price * part.quantity;
            } else if ((ps.dimension === 'length' || ps.dimension === 'width') && ps.sides && ps.sides.length > 0) {
              let totalDim = 0;
              ps.sides.forEach((side: string) => {
                if (side === 'top' || side === 'bottom') totalDim += part.width;
                if (side === 'left' || side === 'right') totalDim += part.length;
              });
              total += ((totalDim * part.quantity) / 1000) * service.price;
            }
          }
        });
      }

      if (part.supplies) {
        part.supplies.forEach((ps: any) => {
          const supply = supplies.find(s => s.id === ps.supply_id);
          if (supply && ps.sides && ps.sides.length > 0) {
            let totalDim = 0;
            ps.sides.forEach((side: string) => {
              if (side === 'top' || side === 'bottom') totalDim += part.width;
              if (side === 'left' || side === 'right') totalDim += part.length;
            });
            total += ((totalDim * part.quantity) / 1000) * (supply.price_per_meter || 0);
          }
        });
      }
    });

    return total;
  };

  const quickStats = useMemo(() => {
    let totalMaterial = 0;
    let totalServices = 0;
    let totalArea = 0;
    let totalMinutes = 0;

    const material = materials.find(m => m.id === selectedMaterialId);

    addedModules.forEach(mod => {
      mod.parts.forEach((part: any) => {
        const subtotal_m2 = (part.width * part.length * part.quantity) / 1000000;
        totalArea += subtotal_m2;
        if (material) totalMaterial += subtotal_m2 * material.price;

        const finishService = services.find(s => s.category === 'finish' && s.name === part.finish);
        if (finishService) {
          totalServices += subtotal_m2 * finishService.price;
          totalMinutes += (finishService.minutes_per_meter || 0) * subtotal_m2;
        }

        if (part.edges) {
          Object.entries(part.edges).forEach(([side, type]) => {
            if (!type || type === 'Nenhum') return;
            const edgeService = services.find(s => s.category === 'edge' && s.name === type);
            if (edgeService) {
              const edgeLengthM = ((side === 'top' || side === 'bottom' ? part.width : part.length) / 1000) * part.quantity;
              totalServices += edgeLengthM * edgeService.price;
              totalMinutes += (edgeService.minutes_per_meter || 0) * edgeLengthM;
            }
          });
        }

        if (part.services) {
          part.services.forEach((ps: any) => {
            const service = services.find(s => s.id === ps.service_id);
            if (service) {
              if (ps.dimension === 'fixed') {
                const qty = part.quantity;
                totalServices += qty * service.price;
                totalMinutes += (service.minutes_per_meter || 0) * qty;
              } else if ((ps.dimension === 'length' || ps.dimension === 'width') && ps.sides && ps.sides.length > 0) {
                let totalDim = 0;
                ps.sides.forEach((side: string) => {
                  if (side === 'top' || side === 'bottom') totalDim += part.width;
                  if (side === 'left' || side === 'right') totalDim += part.length;
                });
                const qty = (totalDim * part.quantity) / 1000;
                totalServices += qty * service.price;
                totalMinutes += (service.minutes_per_meter || 0) * qty;
              }
            }
          });
        }

        if (part.supplies) {
          part.supplies.forEach((ps: any) => {
            const supply = supplies.find(s => s.id === ps.supply_id);
            if (supply && ps.sides && ps.sides.length > 0) {
              let totalDim = 0;
              ps.sides.forEach((side: string) => {
                if (side === 'top' || side === 'bottom') totalDim += part.width;
                if (side === 'left' || side === 'right') totalDim += part.length;
              });
              const qty = (totalDim * part.quantity) / 1000;
              totalServices += qty * (supply.price_per_meter || 0);
            }
          });
        }
      });
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.round(totalMinutes % 60);

    return { totalMaterial, totalServices, totalArea, totalHours, remainingMinutes, totalValue: totalMaterial + totalServices };
  }, [addedModules, selectedMaterialId, materials, services, supplies]);

  const handleAddModule = () => {
    if (!selectedModuleId || !projectName) {
      showToast("Selecione um módulo e dê um nome ao projeto.", "error");
      return;
    }
    const template = moduleTemplates.find(t => t.id === selectedModuleId);
    if (!template) return;

    setAddedModules([{
      id: crypto.randomUUID(),
      templateName: template.name,
      projectName,
      parts: [...calculatedParts],
      dimensions: { ...dimensions }
    }, ...addedModules]);
    setProjectName('');
    setSelectedModuleId(null);
    showToast("Módulo adicionado!");
  };

  const handleGenerateQuote = async () => {
    if (!selectedClientId || !selectedMaterialId || addedModules.length === 0) {
      showToast("Preencha todos os campos e adicione ao menos um módulo.", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const material = materials.find(m => m.id === selectedMaterialId);
      if (!material) return;

      const items: any[] = [];
      const quoteServices: any[] = [];
      let totalValue = 0;

      addedModules.forEach(mod => {
        mod.parts.forEach((part: any) => {
          const m2 = (part.width * part.length * part.quantity) / 1000000;
          const edges = part.edges || { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' };
          const edgeStr = `Topo: ${edges.top}, Base: ${edges.bottom}, Esq.: ${edges.left}, Dir.: ${edges.right}`;
          
          items.push({
            material_id: selectedMaterialId,
            description: `${mod.projectName} - ${part.name} (${part.finish || 'Polido'} / ${edgeStr})`,
            width: part.width,
            length: part.length,
            quantity: part.quantity,
            subtotal_m2: m2
          });
          totalValue += m2 * material.price;

          const finishService = services.find(s => s.category === 'finish' && s.name === part.finish);
          if (finishService) {
            quoteServices.push({
              service_id: finishService.id,
              description: `Acabamento ${part.finish} - ${part.name}`,
              quantity: m2,
              unit_price: finishService.price
            });
            totalValue += m2 * finishService.price;
          }

          // Bordas
          if (part.edges) {
            Object.entries(part.edges).forEach(([side, type]) => {
              if (!type || type === 'Nenhum') return;
              const edgeService = services.find(s => s.category === 'edge' && s.name === type);
              if (edgeService) {
                const edgeLengthM = ((side === 'top' || side === 'bottom' ? part.width : part.length) / 1000) * part.quantity;
                quoteServices.push({
                  service_id: edgeService.id,
                  description: `Acabamento ${type} (${side}) - ${part.name}`,
                  quantity: edgeLengthM,
                  unit_price: edgeService.price
                });
                totalValue += edgeLengthM * edgeService.price;
              }
            });
          }

          // Serviços Extras
          if (part.services) {
            part.services.forEach((ps: any) => {
              const service = services.find(s => s.id === ps.service_id);
              if (service) {
                let qty = 0;
                if (ps.dimension === 'fixed') {
                  qty = part.quantity;
                } else if ((ps.dimension === 'length' || ps.dimension === 'width') && ps.sides && ps.sides.length > 0) {
                  let totalDim = 0;
                  ps.sides.forEach((side: string) => {
                    if (side === 'top' || side === 'bottom') totalDim += part.width;
                    if (side === 'left' || side === 'right') totalDim += part.length;
                  });
                  qty = (totalDim * part.quantity) / 1000;
                }
                if (qty > 0) {
                  quoteServices.push({
                    service_id: service.id,
                    description: `Serviço p/ ${part.name}: ${service.name}`,
                    quantity: qty,
                    unit_price: service.price
                  });
                  totalValue += qty * service.price;
                }
              }
            });
          }

          // Insumos
          if (part.supplies) {
            part.supplies.forEach((ps: any) => {
              const supply = supplies.find(s => s.id === ps.supply_id);
              if (supply && ps.sides && ps.sides.length > 0) {
                let totalDim = 0;
                ps.sides.forEach((side: string) => {
                  if (side === 'top' || side === 'bottom') totalDim += part.width;
                  if (side === 'left' || side === 'right') totalDim += part.length;
                });
                const qty = (totalDim * part.quantity) / 1000;
                quoteServices.push({
                  service_id: null,
                  description: `Insumo (${supply.name}) p/ ${part.name}`,
                  quantity: qty,
                  unit_price: supply.price_per_meter || 0
                });
                totalValue += qty * (supply.price_per_meter || 0);
              }
            });
          }
        });
      });

      const url = editId ? `/api/quotes/${editId}` : '/api/quotes';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          project_name: projectName || "Orçamento Rápido",
          total_value: totalValue,
          items,
          services: quoteServices,
          origin: 'quick',
          metadata: addedModules
        })
      });

      if (res.ok) {
        showToast(editId ? "Orçamento atualizado!" : "Orçamento gerado!");
        if (onSave) {
          onSave();
        } else {
          setAddedModules([]);
          setProjectName('');
        }
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Erro ao salvar no servidor.", "error");
      }
    } catch (e) {
      console.error("Erro ao gerar orçamento:", e);
      showToast("Erro de conexão ou processamento.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">QuickQuote</h1>
        <p className="text-slate-500">Gere orçamentos modulares com rapidez.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-secondary-dark p-6 rounded-2xl border border-border-dark space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cliente</label>
                <select 
                  value={selectedClientId || ''} 
                  onChange={e => setSelectedClientId(Number(e.target.value))}
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecionar Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
                <select 
                  value={selectedMaterialId || ''} 
                  onChange={e => setSelectedMaterialId(Number(e.target.value))}
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecionar Material</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Template de Módulo</label>
                <select 
                  value={selectedModuleId || ''} 
                  onChange={e => setSelectedModuleId(Number(e.target.value))}
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecionar Módulo</option>
                  {moduleTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Ambiente/Projeto</label>
                <input 
                  value={projectName} 
                  onChange={e => setProjectName(e.target.value)}
                  list="project-name-suggestions"
                  placeholder="Ex: Cozinha, Suíte..."
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                />
                <datalist id="project-name-suggestions">
                  {descriptionTemplates.map(t => (
                    <option key={t.id} value={t.text} />
                  ))}
                </datalist>
              </div>
            </div>

            {selectedModuleId && (
              <div className="pt-4 border-t border-border-dark grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Largura Total (L)</label>
                  <input 
                    type="number" 
                    value={dimensions.L} 
                    onChange={e => setDimensions({ ...dimensions, L: Number(e.target.value) })}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary font-mono text-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Profundidade Total (P)</label>
                  <input 
                    type="number" 
                    value={dimensions.P} 
                    onChange={e => setDimensions({ ...dimensions, P: Number(e.target.value) })}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary font-mono text-xl"
                  />
                </div>
              </div>
            )}

            {selectedModuleId && (
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleAddModule}
                  className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                  Adicionar Módulo
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Módulos no Orçamento</h3>
            {addedModules.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border-dark rounded-2xl text-slate-500">
                <Layers className="mx-auto w-8 h-8 mb-2 opacity-20" />
                <p>Nenhum módulo adicionado ainda.</p>
              </div>
            ) : (
              addedModules.map((mod, idx) => (
                <div key={mod.id} className="bg-secondary-dark p-5 rounded-2xl border border-border-dark flex justify-between items-center group relative overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white truncate">{mod.projectName}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                      {mod.templateName} • <span className="text-primary">{mod.dimensions.L}x{mod.dimensions.P}mm</span>
                    </p>
                    {selectedMaterialId && (
                      <p className="text-xs font-bold text-emerald-400 mt-1">
                        R$ {calcModuleValue(mod).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <button 
                      onClick={() => {
                        setPreviewModule(mod);
                        setIsPreviewing(true);
                      }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                      title="Visualizar 3D"
                    >
                      <Cuboid size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingModuleData(mod);
                        setEditDimensions({ ...mod.dimensions });
                        setIsEditingModule(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-all"
                      title="Editar Dimensões"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setAddedModules(addedModules.filter((_, i) => i !== idx))}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <AnimatePresence>
          {isPreviewing && previewModule && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-secondary-dark w-full max-w-4xl h-[70vh] rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-background-dark/50">
                  <h3 className="font-bold text-lg">{previewModule.projectName} <span className="text-slate-500 text-xs font-normal">({previewModule.templateName})</span></h3>
                  <button onClick={() => setIsPreviewing(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
                </div>
                <div className="flex-1 relative bg-slate-950">
                  <PartPreview3D 
                    parts={previewModule.parts.map((p: any, i: number) => ({
                      ...p,
                      thickness: 20,
                      x: evaluateFormula(p.pos_x || '0', previewModule.dimensions.L, previewModule.dimensions.P),
                      y: evaluateFormula(p.pos_y || '0', previewModule.dimensions.L, previewModule.dimensions.P),
                      z: evaluateFormula(p.pos_z || '0', previewModule.dimensions.L, previewModule.dimensions.P),
                      rotX: evaluateFormula(p.rot_x || '0', previewModule.dimensions.L, previewModule.dimensions.P),
                      rotY: evaluateFormula(p.rot_y || '0', previewModule.dimensions.L, previewModule.dimensions.P),
                      rotZ: evaluateFormula(p.rot_z || '0', previewModule.dimensions.L, previewModule.dimensions.P),
                    }))} 
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isEditingModule && editingModuleData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-secondary-dark border border-border-dark p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-2xl text-primary"><Edit2 size={24} /></div>
                  <div>
                    <h3 className="text-xl font-bold">Editar Módulo</h3>
                    <p className="text-slate-500 text-sm">{editingModuleData.projectName}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Largura Total (L)</label>
                    <input 
                      type="number" 
                      value={editDimensions.L} 
                      onChange={e => setEditDimensions({ ...editDimensions, L: Number(e.target.value) })}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary font-mono text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Profundidade (P)</label>
                    <input 
                      type="number" 
                      value={editDimensions.P} 
                      onChange={e => setEditDimensions({ ...editDimensions, P: Number(e.target.value) })}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary font-mono text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsEditingModule(false)} className="flex-1 py-3 rounded-xl font-bold border border-border-dark text-slate-400">Cancelar</button>
                  <button 
                    onClick={() => {
                      const template = moduleTemplates.find(t => t.name === editingModuleData.templateName);
                      if (template) {
                        const newParts = template.parts.map(part => ({
                          id: part.id || crypto.randomUUID(),
                          name: part.name,
                          width: evaluateFormula(part.formula_l, editDimensions.L, editDimensions.P),
                          length: evaluateFormula(part.formula_p, editDimensions.L, editDimensions.P),
                          quantity: part.quantity,
                          finish: part.finish || 'Polido',
                          edges: part.edges || { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' },
                          services: part.services,
                          supplies: part.supplies,
                          pos_x: part.pos_x,
                          pos_y: part.pos_y,
                          pos_z: part.pos_z,
                          rot_x: part.rot_x,
                          rot_y: part.rot_y,
                          rot_z: part.rot_z
                        }));
                        
                        setAddedModules(addedModules.map(m => m.id === editingModuleData.id ? {
                          ...m,
                          dimensions: { ...editDimensions },
                          parts: newParts
                        } : m));
                        setIsEditingModule(false);
                        showToast("Módulo atualizado!");
                      }
                    }}
                    className="flex-1 py-3 rounded-xl font-bold bg-primary text-white"
                  >
                    Atualizar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <div className="bg-secondary-dark p-6 rounded-2xl border border-border-dark sticky top-24 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-primary" /> Resumo Final</h3>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Material</span>
                <span className="font-bold">R$ {quickStats.totalMaterial.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Serviços</span>
                <span className="font-bold">R$ {quickStats.totalServices.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Área Total</span>
                <span className="font-bold">{quickStats.totalArea.toFixed(2)} m²</span>
              </div>
              <div className="pt-4 border-t border-border-dark">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Total Geral</p>
                <p className="text-4xl font-black text-primary">R$ {quickStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateQuote}
              disabled={isGenerating || addedModules.length === 0}
              className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isGenerating ? 'PROCESSANDO...' : 'FINALIZAR ORÇAMENTO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
