import React from 'react';

interface StatCardProps {
  label: string;
  value: any;
  trend?: number;
  icon: React.ReactNode;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, icon, color }) => {
  const getColorClasses = (colorName: string) => {
    switch (colorName) {
      case 'primary': return 'text-primary bg-primary/10';
      case 'emerald': return 'text-emerald-500 bg-emerald-500/10';
      case 'blue': return 'text-blue-500 bg-blue-500/10';
      case 'yellow': return 'text-yellow-400 bg-yellow-400/10';
      case 'orange': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="bg-secondary-dark p-6 rounded-2xl border border-border-dark flex flex-col gap-4 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${getColorClasses(color)} transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black mt-1 group-hover:text-primary transition-colors">{value}</p>
      </div>
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-[0.03] flex items-center justify-center pointer-events-none group-hover:scale-150 transition-transform duration-700`}>
         {icon}
      </div>
    </div>
  );
};
