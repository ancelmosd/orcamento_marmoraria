import React from 'react';

interface ShortcutButtonProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}

export const ShortcutButton: React.FC<ShortcutButtonProps> = ({ icon, label, sub, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-secondary-dark p-4 rounded-xl border border-border-dark flex items-center gap-4 hover:border-primary/50 hover:bg-white/5 transition-all text-left group"
    >
      <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm tracking-tight">{label}</p>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{sub}</p>
      </div>
    </button>
  );
};
