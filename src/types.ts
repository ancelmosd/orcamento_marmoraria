export interface Client {
  id: number;
  name: string;
  document: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Material {
  id: number;
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export interface Remnant {
  id: number;
  material_id: number;
  material_name?: string;
  width: number;
  length: number;
  quantity: number;
  location?: string;
  observations?: string;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  description: string;
  minutes_per_meter?: number;
  category: 'finish' | 'edge' | 'other';
}

export interface QuoteItem {
  id?: number;
  quote_id?: number;
  material_id: number;
  length: number;
  width: number;
  quantity: number;
  subtotal_m2: number;
  description?: string;
  material_name?: string;
}

export interface QuoteService {
  id?: number;
  quote_id?: number;
  service_id: number;
  quantity: number;
  unit_price: number;
  description?: string;
  service_name?: string;
}

export interface Quote {
  id: number;
  client_id: number;
  project_name: string;
  total_value: number;
  discount: number;
  status: 'Rascunho' | 'Pendente' | 'Enviado' | 'Aprovado';
  delivery_date?: string;
  created_at: string;
  client_name?: string;
  items?: QuoteItem[];
  services?: QuoteService[];
}

export interface DashboardStats {
  pendingQuotes: number;
  pendingQuotesTrend: number;
  approvedQuotes: number;
  approvedQuotesTrend: number;
  totalClients: number;
  totalClientsTrend: number;
  monthlyRevenue: number;
  monthlyRevenueTrend: number;
  inProduction: number;
  inProductionTrend: number;
  totalReceivable: number;
  totalOverdue: number;
  totalReceived: number;
}

export interface DescriptionTemplate {
  id: number;
  text: string;
}

export interface ModulePartService {
  service_id: number;
  dimension: 'width' | 'length' | 'fixed';
}

export interface ModulePartSupply {
  supply_id: number;
  sides: ('top' | 'bottom' | 'left' | 'right')[];
  quantity_per_unit?: number;
}

export interface Supply {
  id: number;
  name: string;
  price_per_meter: number;
  minutes_per_meter: number;
  unit: string;
}

export interface ModulePart {
  id: string;
  name: string;
  widthFormula: string; // e.g., "L - 20"
  lengthFormula: string; // e.g., "P"
  quantity: number;
  finish?: string;
  edges?: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  services?: ModulePartService[];
  supplies?: ModulePartSupply[];
}

export interface ModuleTemplate {
  id: number;
  name: string;
  description: string;
  parts: ModulePart[];
}
