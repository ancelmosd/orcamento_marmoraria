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
  const [details, setDetails] = useState('');
  const [moduleQuantity, setModuleQuantity] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ L: 800, P: 600 });
  const [calculatedParts, setCalculatedParts] = useState<any[]>([]);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [addedModules, setAddedModules] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewModule, setPreviewModule] = useState<any>(null);
  const [installationRate, setInstallationRate] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentCondition, setPaymentCondition] = useState<'avista' | 'sinal'>('avista');
  const [signalPercentage, setSignalPercentage] = useState(50);
  const [remainderType, setRemainderType] = useState<'avista' | 'parcelas'>('avista');
  const [installments, setInstallments] = useState(2);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [complementaryProducts, setComplementaryProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
    fetch('/api/materials').then(r => r.json()).then(setMaterials);
    fetch('/api/services').then(r => r.json()).then(setServices);
    fetch('/api/supplies').then(r => r.json()).then(setSupplies);
    fetch('/api/module-templates').then(r => r.json()).then(setModuleTemplates);
    fetch('/api/description-templates').then(r => r.json()).then(setDescriptionTemplates);

    if (editId) {
      // Resetar estados antes de carregar
      setInstallationRate(0);
      setDeliveryFee(0);
      setDiscountValue(0);
      setAddedModules([]);

      fetch(`/api/quotes/${editId}`)
        .then(r => r.json())
        .then(data => {
          setSelectedClientId(data.client_id);
          setProjectName(data.project_name || '');
          setDeliveryDate(data.delivery_date || '');
          if (data.items && data.items.length > 0) {
            setSelectedMaterialId(data.items[0].material_id);
          }

          if (data.metadata) {
            try {
              const meta = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
              // Novo formato: objeto com modules e extras
              if (meta && meta.modules) {
                setAddedModules(Array.isArray(meta.modules) ? meta.modules : []);
                setInstallationRate(Number(meta.installationRate) || 0);
                setDeliveryFee(Number(meta.deliveryFee) || 0);
                setDiscountValue(Number(meta.discountValue) || 0);
                setDiscountType(meta.discountType || 'fixed');
                setComplementaryProducts(meta.complementaryProducts || []);
                setPaymentCondition(meta.paymentCondition || 'avista');
                setSignalPercentage(meta.signalPercentage || 50);
                setRemainderType(meta.remainderType || 'avista');
                setInstallments(meta.installments || 2);
              } else if (Array.isArray(meta)) {
                // Compatibilidade com formato antigo (só array de módulos)
                setAddedModules(meta);
                setDiscountValue(Number(data.discount) || 0);
                setDiscountType('fixed');
              }
            } catch (e) {
              console.error("Erro ao carregar metadados do orçamento rápido", e);
            }
          }
        });
    }
  }, [editId]);

  useEffect(() => {
    if (selectedModuleId) {
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
    } else {
      setCalculatedParts([]);
    }
  }, [selectedModuleId, dimensions.L, dimensions.P, moduleTemplates]);

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

    return total * (mod.moduleQuantity || 1);
  };

  const currentModuleStats = useMemo(() => {
    if (!selectedModuleId || calculatedParts.length === 0) return null;
    
    let materialCost = 0;
    let servicesCost = 0;
    let area = 0;
    
    const material = materials.find(m => m.id === selectedMaterialId);
    
    calculatedParts.forEach(part => {
      const m2 = (part.width * part.length * part.quantity) / 1000000;
      area += m2;
      if (material) materialCost += m2 * material.price;
      
      const finishService = services.find(s => s.category === 'finish' && s.name === part.finish);
      if (finishService) servicesCost += m2 * finishService.price;
      
      if (part.edges) {
        Object.entries(part.edges).forEach(([side, type]) => {
          if (!type || type === 'Nenhum') return;
          const edgeService = services.find(s => s.category === 'edge' && s.name === type);
          if (edgeService) {
            const edgeLengthM = ((side === 'top' || side === 'bottom' ? part.width : part.length) / 1000) * part.quantity;
            servicesCost += edgeLengthM * edgeService.price;
          }
        });
      }
      
      if (part.services) {
        part.services.forEach((ps: any) => {
          const service = services.find(s => s.id === ps.service_id);
          if (service) {
            if (ps.dimension === 'fixed') {
              servicesCost += part.quantity * service.price;
            } else if ((ps.dimension === 'length' || ps.dimension === 'width') && ps.sides && ps.sides.length > 0) {
              let totalDim = 0;
              ps.sides.forEach((side: string) => {
                if (side === 'top' || side === 'bottom') totalDim += part.width;
                if (side === 'left' || side === 'right') totalDim += part.length;
              });
              servicesCost += ((totalDim * part.quantity) / 1000) * service.price;
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
            servicesCost += ((totalDim * part.quantity) / 1000) * (supply.price_per_meter || 0);
          }
        });
      }
    });
    
    const totalMaterialCost = materialCost * moduleQuantity;
    const totalServicesCost = servicesCost * moduleQuantity;
    const totalArea = area * moduleQuantity;
    
    return { materialCost: totalMaterialCost, servicesCost: totalServicesCost, area: totalArea, totalValue: totalMaterialCost + totalServicesCost };
  }, [calculatedParts, selectedMaterialId, materials, services, supplies, selectedModuleId, moduleQuantity]);

  const quickStats = useMemo(() => {
    let totalMaterial = 0;
    let totalServices = 0;
    let totalArea = 0;
    let totalMinutes = 0;

    const material = materials.find(m => m.id === selectedMaterialId);

    addedModules.forEach(mod => {
      const modQty = mod.moduleQuantity || 1;
      mod.parts.forEach((part: any) => {
        const subtotal_m2 = (part.width * part.length * part.quantity * modQty) / 1000000;
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
              const edgeLengthM = ((side === 'top' || side === 'bottom' ? part.width : part.length) / 1000) * part.quantity * modQty;
              totalServices += edgeLengthM * edgeService.price;
              totalMinutes += (edgeService.minutes_per_meter || 0) * edgeLengthM;
            }
          });
        }

        if (part.services) {
          part.services.forEach((ps: any) => {
            const service = services.find(s => s.id === ps.service_id);
            if (service) {
              let qty = 0;
              if (ps.dimension === 'fixed') {
                qty = part.quantity * modQty;
              } else if ((ps.dimension === 'length' || ps.dimension === 'width') && ps.sides && ps.sides.length > 0) {
                let totalDim = 0;
                ps.sides.forEach((side: string) => {
                  if (side === 'top' || side === 'bottom') totalDim += part.width;
                  if (side === 'left' || side === 'right') totalDim += part.length;
                });
                qty = (totalDim * part.quantity * modQty) / 1000;
              }
              if (qty > 0) {
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
              const qty = (totalDim * part.quantity * modQty) / 1000;
              totalServices += qty * (supply.price_per_meter || 0);
            }
          });
        }
      });
    });

    complementaryProducts.forEach(prod => {
      totalServices += (Number(prod.price) || 0) * (Number(prod.quantity) || 1);
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.round(totalMinutes % 60);
    const installationCost = totalArea * installationRate;
    const totalValueBeforeDiscount = totalMaterial + totalServices + installationCost + deliveryFee;
    const discountAmount = discountType === 'percent' ? (totalValueBeforeDiscount * discountValue / 100) : discountValue;
    const totalValue = totalValueBeforeDiscount - discountAmount;

    return { 
      totalMaterial, 
      totalServices, 
      totalArea, 
      totalHours, 
      remainingMinutes, 
      installationCost,
      deliveryFee,
      discountAmount,
      totalValue 
      paymentCondition,
      signalPercentage,
      remainderType,
      installments
    };
  }, [addedModules, selectedMaterialId, materials, services, supplies, installationRate, deliveryFee, discountValue, discountType, complementaryProducts]);

  const handleAddModule = () => {
    if (!selectedModuleId || !projectName) {
      showToast("Selecione um módulo e dê um nome ao projeto.", "error");
      return;
    }
    const template = moduleTemplates.find(t => t.id === selectedModuleId);
    if (!template) return;

    if (editingModuleId) {
      setAddedModules(addedModules.map(m => m.id === editingModuleId ? {
        ...m,
        templateName: template.name,
        projectName,
        parts: [...calculatedParts],
        dimensions: { ...dimensions },
        details,
        moduleQuantity
      } : m));
      setEditingModuleId(null);
      showToast("Módulo atualizado!");
    } else {
      setAddedModules([{
        id: crypto.randomUUID(),
        templateName: template.name,
        projectName,
        parts: [...calculatedParts],
        dimensions: { ...dimensions },
        details,
        moduleQuantity
      }, ...addedModules]);
      showToast("Módulo adicionado!");
    }

    setProjectName('');
    setDetails('');
    setModuleQuantity(1);
    setSelectedModuleId(null);
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

      // Adicionar Montagem e Entrega como serviços se tiverem valor
      if (Number(installationRate) > 0) {
        quoteServices.push({
          service_id: null,
          description: `Montagem (${quickStats.totalArea.toFixed(2)}m²)`,
          quantity: quickStats.totalArea,
          unit_price: Number(installationRate)
        });
      }

      if (Number(deliveryFee) > 0) {
        quoteServices.push({
          service_id: null,
          description: "Taxa de Entrega",
          quantity: 1,
          unit_price: Number(deliveryFee)
        });
      }

      const modulesWithTotals = addedModules.map(mod => {
        const initialValue = totalValue;
        const modQty = mod.moduleQuantity || 1;
        mod.parts.forEach((part: any) => {
          const m2 = (part.width * part.length * part.quantity * modQty) / 1000000;
          const edges = part.edges || { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' };
          const edgeStr = `Topo: ${edges.top}, Base: ${edges.bottom}, Esq.: ${edges.left}, Dir.: ${edges.right}`;
          
          items.push({
            material_id: selectedMaterialId,
            description: `${mod.projectName} - ${part.name} (${part.finish || 'Polido'} / ${edgeStr})`,
            width: part.width,
            length: part.length,
            quantity: part.quantity * modQty,
            unit_price: material.price,
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
          Object.entries(edges).forEach(([side, type]) => {
            if (!type || type === 'Nenhum') return;
            const edgeService = services.find(s => s.category === 'edge' && s.name === type);
            if (edgeService) {
              const edgeLengthM = ((side === 'top' || side === 'bottom' ? part.width : part.length) / 1000) * part.quantity * modQty;
              quoteServices.push({
                service_id: edgeService.id,
                description: `Acabamento ${type} (${side}) - ${part.name}`,
                quantity: edgeLengthM,
                unit_price: edgeService.price
              });
              totalValue += edgeLengthM * edgeService.price;
            }
          });

          // Serviços Extras
          if (part.services) {
            part.services.forEach((ps: any) => {
              const service = services.find(s => s.id === ps.service_id);
              if (service) {
                let qty = 0;
                if (ps.dimension === 'fixed') {
                  qty = part.quantity * modQty;
                } else if ((ps.dimension === 'length' || ps.dimension === 'width') && ps.sides && ps.sides.length > 0) {
                  let totalDim = 0;
                  ps.sides.forEach((side: string) => {
                    if (side === 'top' || side === 'bottom') totalDim += part.width;
                    if (side === 'left' || side === 'right') totalDim += part.length;
                  });
                  qty = (totalDim * part.quantity * modQty) / 1000;
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
                const qty = (totalDim * part.quantity * modQty) / 1000;
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
        return { ...mod, subtotal: totalValue - initialValue, materialName: material.name };
      });

      const url = editId ? `/api/quotes/${editId}` : '/api/quotes';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          project_name: projectName || "Orçamento Rápido",
          total_value: Number(quickStats.totalValue),
          discount: Number(quickStats.discountAmount),
          delivery_date: deliveryDate,
          items,
          services: quoteServices,
          origin: 'quick',
          metadata: {
            modules: modulesWithTotals,
            installationRate,
            deliveryFee,
            discountValue,
            discountType,
            complementaryProducts
          }
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
              <div className="pt-4 border-t border-border-dark grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade</label>
                  <input 
                    type="number" 
                    min="1"
                    value={moduleQuantity} 
                    onChange={e => setModuleQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary font-mono text-xl"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Detalhes Adicionais</label>
                  <textarea 
                    value={details} 
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Especifique detalhes extras, observações ou personalizações para este módulo..."
                    rows={2}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary resize-none text-sm"
                  />
                </div>
              </div>
            )}

            {selectedModuleId && (
              <div className="pt-4 flex items-center gap-3">
                {currentModuleStats && (
                  <div className="flex-1 grid grid-cols-4 gap-2 text-[8px] font-black uppercase tracking-widest">
                    <div className="bg-background-dark/30 border border-border-dark/50 p-2 rounded-xl">
                      <p className="text-slate-500 mb-1">Área</p>
                      <p className="text-white font-mono text-[10px]">{currentModuleStats.area.toFixed(2)} m²</p>
                    </div>
                    <div className="bg-background-dark/30 border border-border-dark/50 p-2 rounded-xl">
                      <p className="text-slate-500 mb-1">Pedra</p>
                      <p className="text-emerald-400 font-mono text-[10px]">R$ {currentModuleStats.materialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-background-dark/30 border border-border-dark/50 p-2 rounded-xl">
                      <p className="text-slate-500 mb-1">Serviços</p>
                      <p className="text-blue-400 font-mono text-[10px]">R$ {currentModuleStats.servicesCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/30 p-2 rounded-xl">
                      <p className="text-primary mb-1">Total</p>
                      <p className="text-white font-black font-mono text-[10px]">R$ {currentModuleStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}
                 <div className="flex gap-2">
                  {editingModuleId && (
                    <button 
                      onClick={() => {
                        setEditingModuleId(null);
                        setProjectName('');
                        setDetails('');
                        setModuleQuantity(1);
                        setSelectedModuleId(null);
                      }}
                      className="bg-white/5 text-slate-400 font-bold px-4 py-4 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    onClick={handleAddModule}
                    className={`${editingModuleId ? 'bg-emerald-600' : 'bg-primary'} text-white font-bold px-6 py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 h-fit`}
                  >
                    {editingModuleId ? <Check size={20} /> : <Plus size={20} />}
                    {editingModuleId ? 'Salvar' : 'Add'}
                  </button>
                </div>
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
                    <h4 className="font-bold text-white truncate flex items-center gap-2">
                      {mod.projectName}
                      {mod.moduleQuantity > 1 && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">x{mod.moduleQuantity}</span>}
                    </h4>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                      {mod.templateName} • <span className="text-primary">{mod.dimensions.L}x{mod.dimensions.P}mm</span>
                    </p>
                    {mod.details && (
                      <p className="text-[10px] text-slate-400 mt-1 italic whitespace-pre-wrap leading-tight">
                        {mod.details}
                      </p>
                    )}
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
                         const template = moduleTemplates.find(t => t.name === mod.templateName);
                         if (template) {
                           setSelectedModuleId(template.id);
                           setProjectName(mod.projectName);
                           setDimensions({ ...mod.dimensions });
                           setModuleQuantity(mod.moduleQuantity);
                           setDetails(mod.details || '');
                           setEditingModuleId(mod.id);
                           // Scroll to top
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         }
                       }}
                       className={`p-2 ${editingModuleId === mod.id ? 'text-primary bg-primary/10' : 'text-slate-400 hover:bg-white/5'} rounded-xl transition-all`}
                       title="Editar Módulo"
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

          <div className="bg-secondary-dark p-6 rounded-2xl border border-border-dark space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Cuboid className="text-primary" /> Produtos Complementares
                </h3>
                <p className="text-xs text-slate-500 italic">Adicione cubas, torneiras ou outros itens manuais.</p>
              </div>
              <button 
                onClick={() => setComplementaryProducts([...complementaryProducts, { id: crypto.randomUUID(), name: '', details: '', unit: 'un', quantity: 1, price: 0 }])}
                className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Novo Produto
              </button>
            </div>

            <div className="space-y-4">
              {complementaryProducts.length === 0 ? (
                <div className="py-8 border-2 border-dashed border-border-dark rounded-2xl flex flex-col items-center justify-center text-slate-600 gap-2">
                  <Package size={32} className="opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">Nenhum produto complementar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {complementaryProducts.map((prod, idx) => (
                    <div key={prod.id} className="p-4 bg-background-dark rounded-xl border border-border-dark space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Produto #{idx + 1}</span>
                        <button 
                          onClick={() => setComplementaryProducts(complementaryProducts.filter(p => p.id !== prod.id))}
                          className="p-1.5 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Produto</label>
                          <input 
                            value={prod.name}
                            onChange={e => {
                              const newProds = [...complementaryProducts];
                              newProds[idx].name = e.target.value;
                              setComplementaryProducts(newProds);
                            }}
                            className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Ex: Cuba Tramontina..."
                          />
                        </div>
                        <div className="md:col-span-8 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Detalhes Adicionais</label>
                          <input 
                            value={prod.details}
                            onChange={e => {
                              const newProds = [...complementaryProducts];
                              newProds[idx].details = e.target.value;
                              setComplementaryProducts(newProds);
                            }}
                            className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Modelo, cor, acabamento..."
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Unidade</label>
                          <input 
                            value={prod.unit}
                            onChange={e => {
                              const newProds = [...complementaryProducts];
                              newProds[idx].unit = e.target.value;
                              setComplementaryProducts(newProds);
                            }}
                            className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                            placeholder="un, m, par..."
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade</label>
                          <input 
                            type="number"
                            value={prod.quantity}
                            onChange={e => {
                              const newProds = [...complementaryProducts];
                              newProds[idx].quantity = Number(e.target.value);
                              setComplementaryProducts(newProds);
                            }}
                            className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Unitário</label>
                          <input 
                            type="number"
                            value={prod.price}
                            onChange={e => {
                              const newProds = [...complementaryProducts];
                              newProds[idx].price = Number(e.target.value);
                              setComplementaryProducts(newProds);
                            }}
                            className="w-full bg-secondary-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1 flex flex-col justify-end">
                          <div className="bg-primary/5 p-2 rounded-lg border border-primary/20">
                            <span className="text-[10px] font-black text-primary uppercase block">Total Item</span>
                            <p className="text-sm font-black text-white">R$ {((prod.price || 0) * (prod.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

        <div className="space-y-6">
          <div className="bg-secondary-dark p-6 rounded-2xl border border-border-dark sticky top-24 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-primary" /> Resumo Final</h3>
              <button 
                onClick={() => setShowPaymentSettings(true)}
                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-primary transition-colors"
                title="Configurar Condições de Pagamento"
              >
                <Settings size={20} />
              </button>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Material</span>
                <span className="font-bold">R$ {quickStats.totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Serviços</span>
                <span className="font-bold">R$ {quickStats.totalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <div className="pt-2 border-t border-border-dark space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Montagem (R$/M²)</label>
                  <input 
                    type="number" 
                    value={installationRate || ''} 
                    onChange={e => setInstallationRate(Number(e.target.value))}
                    placeholder="0,00"
                    className="w-full bg-background-dark/50 border border-border-dark rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Taxa de Entrega (R$)</label>
                    <input 
                      type="number" 
                      value={deliveryFee || ''} 
                      onChange={e => setDeliveryFee(Number(e.target.value))}
                      placeholder="0,00"
                      className="w-full bg-background-dark/50 border border-border-dark rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Data de Entrega</label>
                    <input 
                      type="date" 
                      value={deliveryDate} 
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="w-full bg-background-dark/50 border border-border-dark rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-sm font-mono text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Desconto</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={discountValue || ''} 
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      placeholder="0,00"
                      className="flex-1 bg-background-dark/50 border border-border-dark rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-sm font-mono"
                    />
                    <button 
                      onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
                      className="bg-white/5 border border-border-dark px-3 py-2 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-colors w-12"
                    >
                      {discountType === 'fixed' ? 'R$' : '%'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border-dark space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Área Total</span>
                  <span className="font-bold text-slate-300">{quickStats.totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²</span>
                </div>
                {quickStats.installationCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Montagem</span>
                    <span className="font-bold text-slate-300">R$ {quickStats.installationCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {quickStats.deliveryFee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Entrega</span>
                    <span className="font-bold text-slate-300">R$ {quickStats.deliveryFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {quickStats.discountAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400">Desconto</span>
                    <span className="font-bold text-red-400">- R$ {quickStats.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border-dark">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Total Geral</p>
                <p className="text-4xl font-black text-primary">R$ {quickStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

      {/* Modal de Condições de Pagamento */}
      <AnimatePresence>
        {showPaymentSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-secondary-dark border border-border-dark rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Settings size={20} /> Condições de Pagamento
                </h3>
                <button onClick={() => setShowPaymentSettings(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentCondition('avista')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${paymentCondition === 'avista' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-background-dark/50 text-slate-400 border-border-dark hover:bg-white/5'}`}
                  >
                    À Vista
                  </button>
                  <button
                    onClick={() => setPaymentCondition('sinal')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${paymentCondition === 'sinal' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-background-dark/50 text-slate-400 border-border-dark hover:bg-white/5'}`}
                  >
                    Com Sinal
                  </button>
                </div>

                {paymentCondition === 'sinal' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 p-4 bg-background-dark/50 rounded-2xl border border-border-dark"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Porcentagem do Sinal (%)</label>
                      <input 
                        type="number"
                        value={signalPercentage}
                        onChange={e => setSignalPercentage(Number(e.target.value))}
                        className="w-full bg-secondary-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Restante do Pagamento</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setRemainderType('avista')}
                          className={`py-2 rounded-lg font-bold text-[10px] uppercase transition-all border ${remainderType === 'avista' ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-border-dark'}`}
                        >
                          À Vista
                        </button>
                        <button
                          onClick={() => setRemainderType('parcelas')}
                          className={`py-2 rounded-lg font-bold text-[10px] uppercase transition-all border ${remainderType === 'parcelas' ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-border-dark'}`}
                        >
                          Parcelas
                        </button>
                      </div>

                      {remainderType === 'parcelas' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Número de Parcelas</label>
                          <input 
                            type="number"
                            min="2"
                            value={installments}
                            onChange={e => setInstallments(Number(e.target.value))}
                            className="w-full bg-secondary-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                          />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="pt-2">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                  <p className="text-xs font-bold text-primary uppercase mb-2">Resumo da Condição</p>
                  <p className="text-sm text-slate-300">
                    {paymentCondition === 'avista' ? (
                      "Pagamento integral no ato da aprovação/entrega."
                    ) : (
                      <>
                        Sinal de <strong>{signalPercentage}%</strong> (R$ {(quickStats.totalValue * signalPercentage / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) 
                        e o restante {remainderType === 'avista' ? "à vista" : `em ${installments}x de R$ ${((quickStats.totalValue * (100 - signalPercentage) / 100) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentSettings(false)}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Confirmar Condições
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
