import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';

export function normalizeSearchText(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function evaluateFormula(formula: string | number | null | undefined, L: number, P: number): number {
  try {
    if (formula === null || formula === undefined || formula === '') return 0;
    
    // Garantir que a fórmula seja uma string e limpar espaços
    const formulaStr = String(formula).trim();
    
    // Se for apenas um número, retornar ele logo
    if (!isNaN(Number(formulaStr))) return Number(formulaStr);

    // Replace L and P (case insensitive) with their values
    const expression = formulaStr
      .replace(/L/gi, L.toString())
      .replace(/P/gi, P.toString());
    
    // Safety check: only allow numbers, operators, and parentheses
    if (!/^[0-9+\-*/().\s]*$/.test(expression)) {
      return 0;
    }
    
    // Evaluate the expression
    // eslint-disable-next-line no-eval
    const result = eval(expression);
    return isNaN(result) ? 0 : result;
  } catch (e) {
    return 0;
  }
}

interface CustomListProps {
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  onSearch: (term: string) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function CustomList({ items, renderItem, onSearch, placeholder = "Buscar...", emptyMessage = "Nenhum item encontrado." }: CustomListProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input
          type="text"
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background-dark border border-border-dark rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, idx) => <div key={item.id || idx}>{renderItem(item)}</div>)
        ) : (
          <p className="text-center py-8 text-slate-500 text-sm italic">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
