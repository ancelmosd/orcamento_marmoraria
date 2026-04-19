import React, { useState, useEffect } from 'react';
import { 
  Users, Package, Calculator, History, Construction, 
  Clock, Bell, CheckSquare, Bolt, Info, Settings 
} from 'lucide-react';
import { DashboardStats, Material } from '../types';
import { StatCard } from './StatCard';
import { ShortcutButton } from './ShortcutButton';

interface DashboardViewProps {
  stats: DashboardStats;
  onAction: (action: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, onAction }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => a.quantity - b.quantity);
        setMaterials(sorted.slice(0, 3));
      })
      .catch(err => console.error("Error fetching materials for dashboard:", err));

    fetch('/api/quotes')
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setQuotes(sorted.slice(0, 5));
      })
      .catch(err => console.error("Error fetching quotes for dashboard:", err));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-primary text-sm font-semibold uppercase tracking-wider">Painel Administrativo</p>
        <h1 className="text-4xl font-black tracking-tight">Visão Geral</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Orçamentos Pendentes" value={stats.pendingQuotes} trend={stats.pendingQuotesTrend} icon={<History />} color="primary" />
        <StatCard label="Orçamentos Aprovados" value={stats.approvedQuotes} trend={stats.approvedQuotesTrend} icon={<CheckSquare />} color="emerald" />
        <StatCard label="Total de Clientes" value={stats.totalClients} trend={stats.totalClientsTrend} icon={<Users />} color="blue" />
        <StatCard label="Faturamento Mensal" value={`R$ ${(stats.monthlyRevenue || 0).toLocaleString()}`} trend={stats.monthlyRevenueTrend} icon={<Calculator />} color="emerald" />
        <StatCard label="Em Produção" value={stats.inProduction} trend={stats.inProductionTrend} icon={<Construction />} color="yellow" />
        <StatCard label="Total A Receber" value={`R$ ${(stats.totalReceivable || 0).toLocaleString()}`} icon={<Clock />} color="blue" />
        <StatCard label="Total Em Atraso" value={`R$ ${(stats.totalOverdue || 0).toLocaleString()}`} icon={<Bell />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bolt className="text-primary w-5 h-5" /> Atalhos Rápidos
          </h2>
          <div className="space-y-3">
            <ShortcutButton icon={<Users />} label="Novo Cliente" sub="Cadastrar novo contato" onClick={() => onAction('new-client')} />
            <ShortcutButton icon={<Package />} label="Entrada de Material" sub="Atualizar estoque" onClick={() => onAction('material-entry')} />
            <ShortcutButton icon={<Calculator />} label="Novo Orçamento" sub="Gerar calculadora" onClick={() => onAction('new-quote')} />
          </div>

          <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Info className="text-primary w-4 h-4" /> Status do Estoque
            </h3>
            <div className="space-y-4">
              {materials.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum material cadastrado.</p>
              ) : materials.map(m => (
                <StockProgress
                  key={m.id}
                  label={m.name}
                  value={Math.min(100, (m.quantity / 50) * 100)}
                  amount={`${m.quantity} m²`}
                  color={m.quantity < 10 ? 'orange' : 'primary'}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="text-primary w-5 h-5" /> Últimos Orçamentos
            </h2>
            <button onClick={() => onAction('view-history')} className="text-primary text-sm font-bold hover:underline">Ver todos</button>
          </div>
          <div className="bg-secondary-dark rounded-xl border border-border-dark overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Data</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Valor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum orçamento recente.</td>
                  </tr>
                ) : quotes.map(q => (
                  <TableRow
                    key={q.id}
                    client={q.client_name}
                    project={q.project_name}
                    date={new Date(q.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    value={`R$ ${q.total_value.toLocaleString()}`}
                    status={q.status}
                    onEdit={() => onAction(`edit-quote-${q.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function StockProgress({ label, value, amount, color = 'primary' }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${color === 'orange' ? 'text-orange-500' : 'text-white'}`}>{amount}</span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full">
        <div className={`h-1.5 rounded-full ${color === 'orange' ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function TableRow({ client, project, date, value, status, onEdit }: any) {
  const statusColors: any = {
    'Pendente': 'text-orange-500 bg-orange-500/10',
    'Aprovado': 'text-emerald-500 bg-emerald-500/10',
    'Em Produção': 'text-yellow-400 bg-yellow-400/10',
    'Entregue': 'text-indigo-500 bg-indigo-500/10',
    'Cancelado': 'text-red-500 bg-red-500/10',
    'Enviado': 'bg-blue-500/10 text-blue-400',
    'Rascunho': 'bg-slate-500/10 text-slate-400'
  };

  return (
    <tr
      className="hover:bg-white/5 transition-colors group cursor-pointer"
      onClick={onEdit}
    >
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm">{client}</span>
          <span className="text-slate-500 text-xs">{project}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-400 text-sm">{date}</td>
      <td className="px-6 py-4 font-bold text-sm">{value}</td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[status] || 'text-slate-500 bg-slate-500/10'}`}>{status}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end">
          <div className="p-1.5 bg-white/5 rounded-md group-hover:bg-primary group-hover:text-white transition-colors text-primary">
            <Settings size={14} />
          </div>
        </div>
      </td>
    </tr>
  );
}
