import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Search, Plus, X, Layers, ArrowRight } from 'lucide-react';
import { ModuleTemplate } from '../types';

interface ModuleLibraryProps {
  onAddModule?: (module: ModuleTemplate) => void;
  onClose?: () => void;
}

export default function ModuleLibrary({ onAddModule, onClose }: ModuleLibraryProps) {
  const [templates, setTemplates] = useState<ModuleTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/module-templates')
      .then(r => r.json())
      .then(setTemplates)
      .catch(console.error);
  }, []);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-secondary-dark border-l border-border-dark w-80 shadow-2xl">
      <div className="p-6 border-b border-border-dark flex justify-between items-center bg-background-dark/30">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Layers size={18} />
          </div>
          <h2 className="font-bold text-lg">Biblioteca</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-4 border-b border-border-dark bg-background-dark/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar módulo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-background-dark border border-border-dark rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {filteredTemplates.map(template => (
          <motion.div
            key={template.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-background-dark border border-border-dark hover:border-primary/50 transition-all group cursor-pointer"
            onClick={() => onAddModule?.(template)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="bg-slate-800 p-2 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                <Box size={16} />
              </div>
              <button className="p-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={16} />
              </button>
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors">{template.name}</h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{template.description}</p>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase">
              <span>{template.parts.length} peças</span>
              <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <Box className="mx-auto w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm italic">Nenhum módulo encontrado</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-dark bg-background-dark/30">
        <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest">
          Clique para adicionar ao orçamento
        </p>
      </div>
    </div>
  );
}
