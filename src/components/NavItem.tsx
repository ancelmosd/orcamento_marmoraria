import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, collapsed }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${active
        ? 'bg-primary text-white shadow-lg shadow-primary/20'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
        }`}
    >
      <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-primary'} transition-colors`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </span>
      {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
    </button>
  );
};
