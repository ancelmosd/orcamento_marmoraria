import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Package, TrendingUp, TrendingDown, Clock, Search, Plus, 
  X, Check, AlertCircle, FileText, Settings, Download, Trash2,
  Phone, MapPin, Calculator, Calendar, History, Save, Edit2, 
  ArrowRight, FileOutput, GripHorizontal, Box, Layers, Scissors, 
  RotateCw, Construction, Database, Upload, ArrowUpRight, ArrowDownRight,
  Filter, DollarSign, Bolt, Camera, Eye, FolderOpen
} from 'lucide-react';
import { Client, Material, Service, DescriptionTemplate, QuoteItem, QuoteService, ModuleTemplate, ModulePart, Supply, Quote, FINISHING_TYPES, EDGE_TYPES } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function CutPlanView({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [sheetWidth, setSheetWidth] = useState<number>(3000);
  const [sheetHeight, setSheetHeight] = useState<number>(1800);
  const [sawThickness, setSawThickness] = useState<number>(5);
  const [items, setItems] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [stockMaterials, setStockMaterials] = useState<Material[]>([]);
  const [allowRotation, setAllowRotation] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [manualItem, setManualItem] = useState({
    description: '',
    width: '',
    length: '',
    quantity: '1',
    material_name: '',
    finishing: 'Polido',
    edges: { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' }
  });
  const [manualPositions, setManualPositions] = useState<Record<string, { x: number, y: number, rotated: boolean }>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showOpenPlans, setShowOpenPlans] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewScale, setViewScale] = useState(5);
  const [selectedQuoteDetails, setSelectedQuoteDetails] = useState<Quote | null>(null);
  const [optimizationStrategy, setOptimizationStrategy] = useState<'horizontal' | 'vertical' | 'minWaste'>('horizontal');
  const [trimEdges, setTrimEdges] = useState<boolean>(false);
  const [trimValue, setTrimValue] = useState<number>(20);

  const fetchSavedPlans = () => {
    fetch('/api/cut-plans').then(r => r.json()).then(setSavedPlans);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    try {
      const res = await fetch('/api/cut-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          items,
          plan,
          manual_positions: manualPositions,
          sheet_width: sheetWidth,
          sheet_height: sheetHeight,
          saw_thickness: sawThickness,
          trim_edges: trimEdges,
          trim_value: trimValue
        })
      });

      if (res.ok) {
        showToast('Plano salvo com sucesso!');
        setShowSaveModal(false);
        setPlanName('');
      } else {
        showToast('Erro ao salvar plano.', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao salvar plano.', 'error');
    }
  };

  const handleLoadPlan = async (id: number) => {
    try {
      const res = await fetch(`/api/cut-plans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setPlan(data.plan);
        setManualPositions(data.manual_positions);
        setSheetWidth(data.sheet_width);
        setSheetHeight(data.sheet_height);
        setSawThickness(data.saw_thickness);
        if (data.trim_edges !== undefined) setTrimEdges(data.trim_edges);
        if (data.trim_value !== undefined) setTrimValue(data.trim_value);
        setShowOpenPlans(false);
        showToast('Plano carregado com sucesso!');
      } else {
        showToast('Erro ao carregar plano.', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao carregar plano.', 'error');
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm('Deseja excluir este plano?')) {
      try {
        const res = await fetch(`/api/cut-plans/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Plano excluído.');
          fetchSavedPlans();
        } else {
          showToast('Erro ao excluir plano.', 'error');
        }
      } catch (error) {
        showToast('Erro de conexão ao excluir plano.', 'error');
      }
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('sheet-container');
    if (!element) {
      showToast("Área de visualização não encontrada.", "error");
      return;
    }

    try {
      showToast("Gerando PDF vetorial de alta qualidade...");

      const clientName = selectedQuoteDetails?.client_name || "Cliente Avulso";

      const totalAreaPieces = plan.reduce((acc, item) => acc + (item.width * item.length), 0) / 1000000;
      const numSheets = Math.max(0, ...plan.map(p => p.sheetIndex || 0)) + 1;
      const totalAreaSheets = (sheetWidth * sheetHeight * numSheets) / 1000000;
      const sobra = totalAreaSheets - totalAreaPieces;
      const aproveitamento = (totalAreaPieces / totalAreaSheets) * 100;
      const numCuts = plan.length + (new Set(plan.map(p => `${p.sheetIndex}-${p.y}`)).size);

      let estimatedTime = "N/A";
      if (selectedQuoteDetails && selectedQuoteDetails.services) {
        const totalMinutes = selectedQuoteDetails.services.reduce((acc, item) => {
          const serviceDef = services.find(s => s.id === item.service_id);
          return acc + (item.quantity * (serviceDef?.minutes_per_meter || 0));
        }, 0);
        const h = Math.floor(totalMinutes / 60);
        const m = Math.round(totalMinutes % 60);
        estimatedTime = `${h}h ${m}min`;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('PLANO DE CORTE', pdfWidth / 2, 15, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Cliente: ${clientName}`, 15, 25);
      pdf.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 15, 30);
      pdf.text(`Chapa: ${sheetWidth}x${sheetHeight}mm | Serra: ${sawThickness}mm`, 15, 35);

      autoTable(pdf, {
        startY: 40,
        head: [['Métrica', 'Valor']],
        body: [
          ['Área das Peças', `${totalAreaPieces.toFixed(2)} m²`],
          ['Sobra Total', `${sobra.toFixed(2)} m²`],
          ['Aproveitamento', `${aproveitamento.toFixed(1)}%`],
          ['Total de Cortes', numCuts.toString()],
          ['Tempo Estimado', estimatedTime]
        ],
        theme: 'grid',
        headStyles: { fillColor: [80, 80, 80] },
        styles: { fontSize: 8, textColor: [0, 0, 0] },
        margin: { left: 15, right: 15 }
      });

      const tableData = items.map(item => [
        item.description || 'Peça',
        `${item.width} x ${item.length}`,
        item.material_name,
        item.finishing || 'Polido'
      ]);

      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 5,
        head: [['Descrição', 'Dimensões (mm)', 'Material', 'Acabamento']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { fontSize: 8, textColor: [0, 0, 0] },
        margin: { left: 15, right: 15 }
      });

      const margin = 15;
      const availableWidth = pdfWidth - (margin * 2);
      const scale = availableWidth / sheetWidth;
      const displaySheetHeight = sheetHeight * scale;

      for (let s = 0; s < numSheets; s++) {
        const sheetPlan = plan.filter(p => p.sheetIndex === s);

        let currentY = (pdf as any).lastAutoTable?.finalY + 15 || 45;
        if (currentY + displaySheetHeight > pdfHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`CHAPA ${s + 1} - ${sheetWidth}x${sheetHeight}mm`, margin, currentY - 5);

        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, currentY, availableWidth, displaySheetHeight, 'F');

        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, currentY, availableWidth, displaySheetHeight, 'S');

        sheetPlan.forEach(piece => {
          const px = margin + (piece.x * scale);
          const py = currentY + (piece.y * scale);
          const pw = piece.width * scale;
          const ph = piece.length * scale;

          pdf.setFillColor(255, 255, 255);
          pdf.rect(px, py, pw, ph, 'F');

          pdf.setDrawColor(0);
          pdf.setLineWidth(0.2);
          pdf.rect(px, py, pw, ph, 'S');

          if (piece.edges) {
            pdf.setDrawColor(218, 165, 32);
            pdf.setLineWidth(0.4);
            pdf.setLineDashPattern([1, 1], 0);

            const edgeOffset = 0.8;

            if (piece.edges.top !== 'Nenhum') pdf.line(px + 0.5, py + edgeOffset, px + pw - 0.5, py + edgeOffset);
            if (piece.edges.bottom !== 'Nenhum') pdf.line(px + 0.5, py + ph - edgeOffset, px + pw - 0.5, py + ph - edgeOffset);
            if (piece.edges.left !== 'Nenhum') pdf.line(px + edgeOffset, py + 0.5, px + edgeOffset, py + ph - 0.5);
            if (piece.edges.right !== 'Nenhum') pdf.line(px + pw - edgeOffset, py + 0.5, px + pw - edgeOffset, py + ph - 0.5);

            pdf.setLineDashPattern([], 0);
            pdf.setDrawColor(0);
            pdf.setLineWidth(0.2);
          }

          if (pw > 4 && ph > 3) {
            const label = piece.description || 'Peça';
            const dimLabel = `${piece.width}x${piece.length}`;

            let fontSize = Math.min(6, pw / 6, ph / 4);
            if (fontSize < 2.5) fontSize = 2.5;

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(fontSize);

            let displayLabel = label;
            if (pdf.getTextWidth(displayLabel) > pw - 1) {
              displayLabel = label.substring(0, Math.max(3, Math.floor(pw / (fontSize * 0.4)))) + '..';
            }

            const centerY = py + (ph / 2);

            if (ph > fontSize * 2.5) {
              pdf.text(displayLabel, px + (pw / 2), centerY - (fontSize * 0.2), { align: 'center', maxWidth: pw - 1 });
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(fontSize * 0.85);
              pdf.text(dimLabel, px + (pw / 2), centerY + (fontSize * 0.9), { align: 'center' });
            } else if (ph > fontSize * 1.2) {
              pdf.text(dimLabel, px + (pw / 2), centerY + (fontSize * 0.3), { align: 'center' });
            }
          }
        });

        (pdf as any).lastAutoTable = { finalY: currentY + displaySheetHeight };
      }

      pdf.save(`Plano_Corte_${clientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      showToast("PDF vetorial gerado com sucesso!");
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      showToast(`Erro ao gerar PDF: ${error.message || 'Erro de compatibilidade de cores'}`, "error");
    }
  };

  const updateCuts = () => {
    setManualPositions({});
    generatePlan();
  };

  useEffect(() => {
    fetch('/api/quotes').then(r => r.json()).then(setQuotes);
    fetch('/api/materials').then(r => r.json()).then(setStockMaterials);
    fetch('/api/services').then(r => r.json()).then(setServices);
    fetchSavedPlans();
  }, []);

  useEffect(() => {
    if (selectedQuoteId) {
      fetch(`/api/quotes/${selectedQuoteId}`)
        .then(r => r.json())
        .then(setSelectedQuoteDetails)
        .catch(err => console.error("Error fetching quote details:", err));
    } else {
      setSelectedQuoteDetails(null);
    }
  }, [selectedQuoteId]);

  const handleImport = async () => {
    if (!selectedQuoteId) return;
    try {
      const res = await fetch(`/api/quotes/${selectedQuoteId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedQuoteDetails(data);
        if (data.items) {
          const materials = Array.from(new Set(data.items.map((item: any) => item.material_name))) as string[];
          setAvailableMaterials(materials);
          if (materials.length > 0) setSelectedMaterial(materials[0]);

          const flattened: any[] = [];
          data.items.forEach((item: any) => {
            const edges = { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' };
            let finishing = 'Polido';

            if (item.description && item.description.includes('(') && item.description.includes(')')) {
              const contentMatch = item.description.match(/\(([^)]+)\)/);
              if (contentMatch) {
                const content = contentMatch[1];
                const parts = content.split(' / ');
                finishing = parts[0].trim();

                if (parts.length > 1) {
                  const edgeString = parts[1];
                  if (edgeString.includes('Topo: ')) edges.top = edgeString.split('Topo: ')[1].split(',')[0].trim();
                  if (edgeString.includes('Base: ')) edges.bottom = edgeString.split('Base: ')[1].split(',')[0].trim();
                  if (edgeString.includes('Esq.: ')) edges.left = edgeString.split('Esq.: ')[1].split(',')[0].trim();
                  if (edgeString.includes('Dir.: ')) edges.right = edgeString.split('Dir.: ')[1].split(',')[0].trim();
                  if (edges.left === 'Nenhum' && edgeString.includes('Esq: ')) edges.left = edgeString.split('Esq: ')[1].split(',')[0].trim();
                  if (edges.right === 'Nenhum' && edgeString.includes('Dir: ')) edges.right = edgeString.split('Dir: ')[1].split(',')[0].trim();
                }
              }
            }

            for (let i = 0; i < item.quantity; i++) {
              flattened.push({
                id: `${item.id}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                width: Math.round(item.width),
                length: Math.round(item.length),
                description: item.description,
                material_name: item.material_name,
                finishing: finishing,
                edges: edges
              });
            }
          });
          setItems(flattened);
          showToast(`${flattened.length} peças importadas.`);
        }
      } else {
        showToast('Erro ao importar orçamento.', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao importar.', 'error');
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(manualItem.quantity) || 1;
    const newItems = [];
    for (let i = 0; i < qty; i++) {
      newItems.push({
        id: `manual-${Date.now()}-${i}`,
        width: parseInt(manualItem.width),
        length: parseInt(manualItem.length),
        description: manualItem.description || 'Peça Manual',
        material_name: manualItem.material_name || 'Manual',
        finishing: manualItem.finishing,
        edges: { ...manualItem.edges }
      });
    }
    setItems([...items, ...newItems]);
    setManualItem({
      description: '',
      width: '',
      length: '',
      quantity: '1',
      material_name: '',
      finishing: 'Polido',
      edges: { top: 'Nenhum', bottom: 'Nenhum', left: 'Nenhum', right: 'Nenhum' }
    });
    setShowManualAdd(false);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const originalItem = items.find(it => it.id === editingItem.id);
    const dimensionsChanged = originalItem && (originalItem.width !== editingItem.width || originalItem.length !== editingItem.length);

    setItems(items.map(item =>
      item.id === editingItem.id ? { ...editingItem } : item
    ));

    if (dimensionsChanged) {
      const newManualPositions = { ...manualPositions };
      delete newManualPositions[editingItem.id];
      setManualPositions(newManualPositions);
    }

    setEditingItem(null);
    setTimeout(generatePlan, 0);
  };

  const toggleRotation = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, width: item.length, length: item.width };
      }
      return item;
    }));

    const newManualPositions = { ...manualPositions };
    delete newManualPositions[id];
    setManualPositions(newManualPositions);
  };

  const handleDragStart = (e: React.MouseEvent, id: string, x: number, y: number) => {
    setDraggedItemId(id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) * viewScale,
      y: (e.clientY - rect.top) * viewScale
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!draggedItemId) return;

    const container = document.getElementById('sheet-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const itemInPlan = plan.find(p => p.id === draggedItemId);
    if (!itemInPlan) return;

    let newX = (e.clientX - rect.left) * viewScale - dragOffset.x;
    let newY = (e.clientY - rect.top) * viewScale - dragOffset.y;

    newX = Math.max(0, Math.min(sheetWidth - itemInPlan.width, newX));
    newY = Math.max(0, Math.min(sheetHeight - itemInPlan.length, newY));

    const hasCollision = plan.some(other => {
      if (other.id === draggedItemId || other.sheetIndex !== itemInPlan.sheetIndex) return false;
      return (
        newX < other.x + other.width + sawThickness &&
        newX + itemInPlan.width + sawThickness > other.x &&
        newY < other.y + other.length + sawThickness &&
        newY + itemInPlan.length + sawThickness > other.y
      );
    });

    if (!hasCollision) {
      setManualPositions({
        ...manualPositions,
        [draggedItemId]: {
          x: Math.round(newX),
          y: Math.round(newY),
          rotated: itemInPlan.rotated
        }
      });

      setPlan(plan.map(p =>
        p.id === draggedItemId ? { ...p, x: Math.round(newX), y: Math.round(newY) } : p
      ));
    }
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const generatePlan = () => {
    const filteredItems = selectedMaterial === 'all'
      ? items
      : items.filter(item => item.material_name === selectedMaterial || item.material_name === 'Manual');

    if (filteredItems.length === 0) {
      setPlan([]);
      return;
    }

    const manualItems = filteredItems.filter(item => manualPositions[item.id]);
    const autoItems = filteredItems.filter(item => !manualPositions[item.id]);

    const currentPlan: any[] = [];
    let currentSheetIndex = 0;

    const effectiveTrim = trimEdges ? trimValue : 0;
    const effectiveWidth = sheetWidth - (effectiveTrim * 2);
    const effectiveHeight = sheetHeight - (effectiveTrim * 2);

    manualItems.forEach(item => {
      const pos = manualPositions[item.id];
      currentPlan.push({
        ...item,
        x: pos.x,
        y: pos.y,
        rotated: pos.rotated,
        width: pos.rotated ? item.length : item.width,
        length: pos.rotated ? item.width : item.length,
        sheetIndex: 0
      });
    });

    let sortedItems = [...autoItems];

    if (optimizationStrategy === 'minWaste') {
      sortedItems.sort((a, b) => (b.width * b.length) - (a.width * a.length));
    } else if (optimizationStrategy === 'vertical') {
      sortedItems.sort((a, b) => b.width - a.width);
    } else {
      sortedItems.sort((a, b) => b.length - a.length);
    }

    let currentX = effectiveTrim;
    let currentY = effectiveTrim;
    let shelfWidth = 0;
    let shelfHeight = 0;

    sortedItems.forEach(item => {
      let w = item.width;
      let l = item.length;
      let rotated = false;

      if (allowRotation) {
        if (optimizationStrategy === 'vertical') {
          if (currentY + l > sheetHeight - effectiveTrim && currentY + w <= sheetHeight - effectiveTrim) {
            [w, l] = [l, w];
            rotated = true;
          } else if (currentY + w <= sheetHeight - effectiveTrim && w < l) {
            [w, l] = [l, w];
            rotated = true;
          }
        } else {
          if (currentX + w > sheetWidth - effectiveTrim && currentX + l <= sheetWidth - effectiveTrim) {
            [w, l] = [l, w];
            rotated = true;
          }
          else if (currentX + l <= sheetWidth - effectiveTrim && l < w) {
            [w, l] = [l, w];
            rotated = true;
          }
        }
      }

      if (optimizationStrategy === 'vertical') {
        if (currentY + l > sheetHeight - effectiveTrim) {
          currentY = effectiveTrim;
          currentX += shelfWidth + sawThickness;
          shelfWidth = 0;
        }

        if (currentX + w > sheetWidth - effectiveTrim) {
          currentSheetIndex++;
          currentX = effectiveTrim;
          currentY = effectiveTrim;
          shelfWidth = 0;
        }

        if (currentX + w <= sheetWidth - effectiveTrim) {
          currentPlan.push({
            ...item,
            width: w,
            length: l,
            rotated,
            x: currentX,
            y: currentY,
            sheetIndex: currentSheetIndex
          });

          currentY += l + sawThickness;
          shelfWidth = Math.max(shelfWidth, w);
        }
      } else {
        if (currentX + w > sheetWidth - effectiveTrim) {
          currentX = effectiveTrim;
          currentY += shelfHeight + sawThickness;
          shelfHeight = 0;
        }

        if (currentY + l > sheetHeight - effectiveTrim) {
          currentSheetIndex++;
          currentX = effectiveTrim;
          currentY = effectiveTrim;
          shelfHeight = 0;
        }

        if (currentY + l <= sheetHeight - effectiveTrim) {
          currentPlan.push({
            ...item,
            width: w,
            length: l,
            rotated,
            x: currentX,
            y: currentY,
            sheetIndex: currentSheetIndex
          });

          currentX += w + sawThickness;
          shelfHeight = Math.max(shelfHeight, l);
        }
      }
    });

    setPlan(currentPlan);
  };

  useEffect(() => {
    generatePlan();
  }, [items, sheetWidth, sheetHeight, sawThickness, allowRotation, selectedMaterial, manualPositions, optimizationStrategy, trimEdges, trimValue]);

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearItems = () => {
    if (confirm('Deseja limpar todas as peças?')) {
      setItems([]);
      setPlan([]);
      setAvailableMaterials([]);
      setSelectedMaterial('all');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight">Plano de Corte</h1>
          <p className="text-slate-500 text-sm">Otimize o corte das chapas de pedra.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { fetchSavedPlans(); setShowOpenPlans(true); }}
            className="flex-1 sm:flex-none bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all text-sm"
          >
            <FolderOpen size={16} /> Abrir
          </button>
          <button
            onClick={() => setShowManualAdd(true)}
            className="flex-1 sm:flex-none bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all text-sm"
          >
            <Plus size={16} /> Peça Manual
          </button>
          <button
            onClick={clearItems}
            className="flex-1 sm:flex-none bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all text-sm"
          >
            <X size={16} /> Limpar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary"><Download size={16} /> Importar Orçamento</h3>
            <div className="flex gap-2">
              <select
                value={selectedQuoteId}
                onChange={e => setSelectedQuoteId(e.target.value)}
                className="flex-1 bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecionar...</option>
                {quotes.map(q => (
                  <option key={q.id} value={q.id}>#{q.id} - {q.client_name}</option>
                ))}
              </select>
              <button
                onClick={handleImport}
                disabled={!selectedQuoteId}
                className="bg-primary px-3 py-2 rounded-lg font-bold text-xs disabled:opacity-50"
              >
                OK
              </button>
            </div>
          </div>

          <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary"><Settings size={16} /> Configurações</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Largura (mm)</label>
                <input
                  type="number"
                  value={sheetWidth}
                  onChange={e => setSheetWidth(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Altura (mm)</label>
                <input
                  type="number"
                  value={sheetHeight}
                  onChange={e => setSheetHeight(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Serra (mm)</label>
                <input
                  type="number"
                  value={sawThickness}
                  onChange={e => setSawThickness(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={trimEdges}
                    onChange={e => setTrimEdges(e.target.checked)}
                    className="w-3 h-3 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                  />
                  Aparar Bordas (mm)
                </label>
                <input
                  type="number"
                  disabled={!trimEdges}
                  value={trimValue}
                  onChange={e => setTrimValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-30 transition-opacity"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Estratégia de Corte</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-background-dark rounded-lg border border-border-dark">
                <button
                  onClick={() => setOptimizationStrategy('horizontal')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${optimizationStrategy === 'horizontal' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Horizontal
                </button>
                <button
                  onClick={() => setOptimizationStrategy('vertical')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${optimizationStrategy === 'vertical' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Vertical
                </button>
                <button
                  onClick={() => setOptimizationStrategy('minWaste')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${optimizationStrategy === 'minWaste' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Menor Área
                </button>
              </div>

              <label className="flex items-center gap-2 text-[10px] font-medium text-slate-300 cursor-pointer mt-2 bg-background-dark/50 p-2 rounded-lg border border-border-dark/50 hover:bg-background-dark transition-all">
                <input
                  type="checkbox"
                  checked={allowRotation}
                  onChange={e => setAllowRotation(e.target.checked)}
                  className="w-4 h-4 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                />
                <span>Permitir rotação para menor desperdício</span>
              </label>
            </div>
          </div>

          {availableMaterials.length > 0 && (
            <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary"><Layers size={16} /> Filtrar Material</h3>
              <select
                value={selectedMaterial}
                onChange={e => setSelectedMaterial(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todos</option>
                {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {items.length > 0 && (
            <div className="bg-secondary-dark p-4 rounded-xl border border-border-dark">
              <h3 className="text-sm font-bold mb-3 flex justify-between items-center">
                <span>Peças ({items.length})</span>
              </h3>

              {/* Pieces per Material Summary */}
              <div className="mb-4 space-y-1">
                {Object.entries(items.reduce((acc: any, item) => {
                  acc[item.material_name] = (acc[item.material_name] || 0) + 1;
                  return acc;
                }, {})).map(([mat, count]: [string, any]) => (
                  <div key={mat} className="flex justify-between text-[9px] text-slate-400 border-b border-white/5 pb-1">
                    <span>{mat}</span>
                    <span className="font-bold text-primary">{count} un</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {items.map((item) => (
                  <div key={item.id} className="text-[10px] p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-colors">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold">{item.description || 'Peça'}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[8px] text-slate-500">{item.material_name} • {item.finishing || 'Polido'}</span>
                        {item.edges && Object.values(item.edges).some(e => e !== 'Nenhum') && (
                          <span className="text-[8px] text-primary font-medium">
                            • {Object.entries(item.edges)
                              .filter(([_, v]) => v !== 'Nenhum')
                              .map(([k, v]) => `${k === 'top' ? 'Topo' : k === 'bottom' ? 'Base' : k === 'left' ? 'Esq.' : 'Dir.'}: ${v}`)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-slate-400">{item.width}x{item.length}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingItem(item)} className="text-slate-500 hover:text-primary">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="bg-secondary-dark p-4 sm:p-6 rounded-xl border border-border-dark overflow-hidden relative min-h-[500px] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold flex items-center gap-2"><Scissors size={16} className="text-primary" /> Visualização</h3>
                <button
                  onClick={updateCuts}
                  className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                  title="Atualizar Cortes"
                >
                  <RotateCw size={14} />
                </button>

                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5 ml-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Zoom</span>
                  <input
                    type="range" min="2" max="15" step="0.5"
                    value={viewScale}
                    onChange={e => setViewScale(parseFloat(e.target.value))}
                    className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] text-primary font-mono w-8 text-center">1:{viewScale.toFixed(1)}</span>
                </div>
              </div>
              {plan.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Área Peças: <span className="text-primary font-bold">
                      {(plan.reduce((acc, item) => acc + (item.width * item.length), 0) / 1000000).toFixed(2)} m²
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Sobra: <span className="text-orange-400 font-bold">
                      {((sheetWidth * sheetHeight * (Math.max(0, ...plan.map(p => p.sheetIndex || 0)) + 1) - plan.reduce((acc, item) => acc + (item.width * item.length), 0)) / 1000000).toFixed(2)} m²
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Cortes: <span className="text-blue-400 font-bold">
                      {plan.length + (new Set(plan.map(p => `${p.sheetIndex}-${p.y}`)).size)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    Aproveitamento: <span className="text-emerald-500 font-bold">
                      {((plan.reduce((acc, item) => acc + (item.width * item.length), 0) / (sheetWidth * sheetHeight * (Math.max(0, ...plan.map(p => p.sheetIndex || 0)) + 1))) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {plan.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 py-12">
                <Scissors size={32} className="opacity-20" />
                <p className="text-sm">Importe um orçamento ou adicione peças manuais.</p>
              </div>
            ) : (
              <div
                id="sheet-container"
                className="relative flex-1 bg-background-dark border-2 border-dashed border-slate-700 rounded-lg overflow-auto p-4 cursor-crosshair select-none scrollbar-thin"
                onMouseMove={handleDrag}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                <div className="min-w-max flex flex-col items-center gap-8 pb-8">
                  {Array.from({ length: Math.max(0, ...plan.map(p => p.sheetIndex || 0)) + 1 }).map((_, sIdx) => (
                    <div key={sIdx} className="relative flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chapa {sIdx + 1}</span>
                      <div
                        className="relative bg-slate-800 border border-slate-600 shadow-2xl transition-all"
                        style={{
                          width: `${sheetWidth / viewScale}px`,
                          height: `${sheetHeight / viewScale}px`,
                          minWidth: `${sheetWidth / viewScale}px`,
                          minHeight: `${sheetHeight / viewScale}px`
                        }}
                      >
                        {plan.filter(item => (item.sheetIndex || 0) === sIdx).map((item) => (
                          <div
                            key={item.id}
                            className={`absolute border flex flex-col items-center justify-center overflow-hidden group transition-all cursor-move ${draggedItemId === item.id ? 'z-50 ring-2 ring-primary shadow-2xl' : ''} ${item.material_name === 'Manual' ? 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/40' : 'bg-primary/20 border-primary/50 hover:bg-primary/40'}`}
                            style={{
                              left: `${item.x / viewScale}px`,
                              top: `${item.y / viewScale}px`,
                              width: `${item.width / viewScale}px`,
                              height: `${item.length / viewScale}px`
                            }}
                            onMouseDown={(e) => handleDragStart(e, item.id, item.x, item.y)}
                            title={`${item.description} (${item.width}x${item.length}mm) - ${item.material_name} - ${item.finishing || 'Polido'}`}
                          >
                            <span className="text-[7px] font-bold text-white truncate w-full text-center px-1">{item.description}</span>
                            <span className="text-[6px] text-slate-400">{item.width}x{item.length}</span>

                            <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleRotation(item.id); }}
                                className="p-0.5 bg-black/50 rounded hover:bg-primary text-white"
                              >
                                <RotateCw size={8} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                                className="p-0.5 bg-black/50 rounded hover:bg-primary text-white"
                              >
                                <Edit2 size={8} />
                              </button>
                            </div>

                            {/* Edge Indicators - Dashed lines for finishing */}
                            {item.edges?.top !== 'Nenhum' && <div className="absolute top-1 left-1 right-1 h-0 border-t-2 border-dashed border-yellow-400 z-10" />}
                            {item.edges?.bottom !== 'Nenhum' && <div className="absolute bottom-1 left-1 right-1 h-0 border-b-2 border-dashed border-yellow-400 z-10" />}
                            {item.edges?.left !== 'Nenhum' && <div className="absolute top-1 bottom-1 left-1 w-0 border-l-2 border-dashed border-yellow-400 z-10" />}
                            {item.edges?.right !== 'Nenhum' && <div className="absolute top-1 bottom-1 right-1 w-0 border-r-2 border-dashed border-yellow-400 z-10" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-[10px] text-slate-500 italic">
                * Escala 1:{viewScale.toFixed(1)} | Dimensões em mm
              </div>
              {plan.length > 0 && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex-1 sm:flex-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all text-xs"
                  >
                    <Save size={14} /> Salvar
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex-1 sm:flex-none bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all text-xs"
                  >
                    <Download size={14} /> Exportar PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Plan Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-primary">Salvar Plano de Corte</h3>
                <button onClick={() => setShowSaveModal(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Plano</label>
                  <input
                    autoFocus
                    required
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ex: Cozinha Cliente X - Chapa 1"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 py-3 rounded-lg font-bold text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Salvar Plano
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Open Plans Modal */}
      <AnimatePresence>
        {showOpenPlans && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Planos de Corte Salvos</h3>
                <button onClick={() => setShowOpenPlans(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {savedPlans.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-background-dark rounded-lg border border-border-dark group hover:border-primary/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{p.name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadPlan(p.id)}
                        className="bg-primary/10 text-primary px-3 py-1 rounded text-xs font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        Abrir
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {savedPlans.length === 0 && (
                  <p className="text-center py-8 text-slate-500 text-sm italic">Nenhum plano salvo.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {showManualAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Nova Peça Manual</h3>
                <button onClick={() => setShowManualAdd(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleManualAdd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                    <input
                      required
                      value={manualItem.description}
                      onChange={e => setManualItem({ ...manualItem, description: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: Rodapé"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
                    <select
                      required
                      value={manualItem.material_name}
                      onChange={e => setManualItem({ ...manualItem, material_name: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Selecionar...</option>
                      {stockMaterials.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Largura (mm)</label>
                    <input
                      required
                      type="number"
                      value={manualItem.width}
                      onChange={e => setManualItem({ ...manualItem, width: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Compr. (mm)</label>
                    <input
                      required
                      type="number"
                      value={manualItem.length}
                      onChange={e => setManualItem({ ...manualItem, length: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd</label>
                    <input
                      required
                      type="number"
                      value={manualItem.quantity}
                      onChange={e => setManualItem({ ...manualItem, quantity: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Acabamento</label>
                  <select
                    required
                    value={manualItem.finishing}
                    onChange={e => setManualItem({ ...manualItem, finishing: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
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

                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bordas</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['top', 'bottom', 'left', 'right'].map((side) => (
                      <div key={side} className="bg-background-dark p-2 rounded border border-border-dark space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={manualItem.edges[side as keyof typeof manualItem.edges] !== 'Nenhum'}
                            onChange={(e) => {
                              const newEdges = { ...manualItem.edges };
                              newEdges[side as keyof typeof manualItem.edges] = e.target.checked ? 'Reto' : 'Nenhum';
                              setManualItem({ ...manualItem, edges: newEdges });
                            }}
                            className="w-3 h-3 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{side === 'top' ? 'Topo' : side === 'bottom' ? 'Base' : side === 'left' ? 'Esq.' : 'Dir.'}</span>
                        </div>
                        {manualItem.edges[side as keyof typeof manualItem.edges] !== 'Nenhum' && (
                          <select
                            value={manualItem.edges[side as keyof typeof manualItem.edges]}
                            onChange={(e) => {
                              const newEdges = { ...manualItem.edges };
                              newEdges[side as keyof typeof manualItem.edges] = e.target.value;
                              setManualItem({ ...manualItem, edges: newEdges });
                            }}
                            className="w-full bg-transparent text-[9px] outline-none text-primary border-t border-white/5 pt-1"
                          >
                            {services.filter(s => s.category === 'edge').length > 0 ? (
                              services.filter(s => s.category === 'edge').map(s => (
                                <option key={s.id} value={s.name} className="bg-secondary-dark">{s.name}</option>
                              ))
                            ) : (
                              EDGE_TYPES.filter(t => t !== 'Nenhum').map(type => (
                                <option key={type} value={type} className="bg-secondary-dark">{type}</option>
                              ))
                            )}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualAdd(false)}
                    className="flex-1 py-2 rounded-lg font-bold text-xs text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity text-xs"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary-dark border border-border-dark rounded-xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Editar Peça</h3>
                <button onClick={() => setEditingItem(null)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                    <input
                      required
                      value={editingItem.description}
                      onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
                    <select
                      required
                      value={editingItem.material_name}
                      onChange={e => setEditingItem({ ...editingItem, material_name: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Selecionar...</option>
                      {stockMaterials.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Largura (mm)</label>
                    <input
                      required
                      type="number"
                      value={editingItem.width}
                      onChange={e => setEditingItem({ ...editingItem, width: parseInt(e.target.value) || 0 })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Profundidade (mm)</label>
                    <input
                      required
                      type="number"
                      value={editingItem.length}
                      onChange={e => setEditingItem({ ...editingItem, length: parseInt(e.target.value) || 0 })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Acabamento</label>
                  <select
                    required
                    value={editingItem.finishing || 'Polido'}
                    onChange={e => setEditingItem({ ...editingItem, finishing: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
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

                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bordas</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['top', 'bottom', 'left', 'right'].map((side) => (
                      <div key={side} className="bg-background-dark p-2 rounded border border-border-dark space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingItem.edges[side as keyof typeof editingItem.edges] !== 'Nenhum'}
                            onChange={(e) => {
                              const newEdges = { ...editingItem.edges };
                              newEdges[side as keyof typeof editingItem.edges] = e.target.checked ? 'Reto' : 'Nenhum';
                              setEditingItem({ ...editingItem, edges: newEdges });
                            }}
                            className="w-3 h-3 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{side === 'top' ? 'Topo' : side === 'bottom' ? 'Base' : side === 'left' ? 'Esq.' : 'Dir.'}</span>
                        </div>
                        {editingItem.edges[side as keyof typeof editingItem.edges] !== 'Nenhum' && (
                          <select
                            value={editingItem.edges[side as keyof typeof editingItem.edges]}
                            onChange={(e) => {
                              const newEdges = { ...editingItem.edges };
                              newEdges[side as keyof typeof editingItem.edges] = e.target.value;
                              setEditingItem({ ...editingItem, edges: newEdges });
                            }}
                            className="w-full bg-transparent text-[9px] outline-none text-primary border-t border-white/5 pt-1"
                          >
                            {services.filter(s => s.category === 'edge').length > 0 ? (
                              services.filter(s => s.category === 'edge').map(s => (
                                <option key={s.id} value={s.name} className="bg-secondary-dark">{s.name}</option>
                              ))
                            ) : (
                              EDGE_TYPES.filter(t => t !== 'Nenhum').map(type => (
                                <option key={type} value={type} className="bg-secondary-dark">{type}</option>
                              ))
                            )}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-2 rounded-lg font-bold text-xs text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity text-xs"
                  >
                    Salvar
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
