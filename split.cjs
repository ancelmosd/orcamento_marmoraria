const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const viewsPos = {
  ClientsView: 361,
  MaterialsView: 1036,
  ServicesView: 1538,
  QuotesView: 1762,
  SettingsView: 2215,
  QuickQuoteView: 3178,
  CutPlanView: 4024,
  END: 5432
};

const viewsSorted = Object.entries(viewsPos).sort((a,b)=>a[1]-b[1]);

const importsHeader = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Package, TrendingUp, TrendingDown, Clock, Search, Plus, 
  X, Check, AlertCircle, FileText, Settings, Download, Trash2,
  Phone, MapPin, Calculator, Calendar, History, Save, Edit2, 
  ArrowRight, FileOutput, GripHorizontal, Box, Layers, Scissors, 
  RotateCw, Construction, Database, Upload, ArrowUpRight, ArrowDownRight,
  Filter, DollarSign, Bolt, Camera, Eye
} from 'lucide-react';
import { Client, Material, Service, DescriptionTemplate, QuoteItem, QuoteService, ModuleTemplate, ModulePart, Supply } from '../types';

export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
}

`;

for (let i = 0; i < viewsSorted.length - 1; i++) {
  const name = viewsSorted[i][0];
  const start = viewsSorted[i][1] - 1;
  const end = viewsSorted[i+1][1] - 1;
  
  let piece = lines.slice(start, end).join('\n');
  
  let finalCode = importsHeader;
  
  if (name === 'QuotesView') {
     // includes SummaryItem
     finalCode += "import PhotoGallery from './PhotoGallery';\n\n";
  }
  
  if (name === 'SettingsView') {
     // Config for SettingsView since SummaryItem is before it
     const idxSummary = piece.indexOf('function SettingsView');
     if(idxSummary !== -1) {
         const summaryStr = piece.slice(0, idxSummary);
         piece = piece.slice(idxSummary);
         fs.writeFileSync('src/components/QuotesView.tsx', fs.readFileSync('src/components/QuotesView.tsx','utf-8') + '\n' + summaryStr);
     }
  }

  // Prepend export default to the function
  finalCode += piece.replace(/^function/m, 'export default function');
  
  fs.writeFileSync('src/components/' + name + '.tsx', finalCode);
  console.log('Written ' + name);
}
