const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf-8');

function extractFunction(content, functionName) {
  const startStr = 'function ' + functionName + '(';
  const startIdx = content.indexOf(startStr);
  if (startIdx === -1) return null;
  
  let braceCount = 0;
  let inFunction = false;
  let endIdx = -1;
  
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      inFunction = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  
  if (endIdx !== -1) {
    return content.substring(startIdx, endIdx);
  }
  return null;
}

const views = ['ClientsView', 'MaterialsView', 'ServicesView', 'QuotesView', 'QuickQuoteView', 'CutPlanView', 'SettingsView'];

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
  return text.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
}
`;

for (const viewName of views) {
  const code = extractFunction(content, viewName);
  if (code) {
    let finalCode = importsHeader + '\n';
    
    if (viewName === 'QuotesView') {
       const summaryItemCode = extractFunction(content, 'SummaryItem');
       if (summaryItemCode) {
         finalCode += summaryItemCode + '\n\n';
       }
       finalCode += "import PhotoGallery from './PhotoGallery';\n\n";
    }
    
    finalCode += 'export default ' + code;
    fs.writeFileSync(`src/components/${viewName}.tsx`, finalCode);
    console.log(`Created ${viewName}.tsx`);
  } else {
    console.log(`Failed to extract ${viewName}`);
  }
}
