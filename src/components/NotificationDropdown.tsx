import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckSquare, X } from 'lucide-react';

interface NotificationDropdownProps {
  show: boolean;
  notifications: any[];
  onClose: () => void;
  onItemClick: (n: any) => void;
  onDismiss: (key: string) => Promise<void>;
  onDismissAll: (keys: string[]) => Promise<void>;
  showToast: (m: string) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  show,
  notifications,
  onClose,
  onItemClick,
  onDismiss,
  onDismissAll,
  showToast,
  setNotifications
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 mt-2 w-80 bg-secondary-dark border border-border-dark shadow-2xl rounded-xl z-50 overflow-hidden"
        >
          <div className="p-3 border-b border-border-dark font-bold flex justify-between items-center bg-background-dark/50">
            <span>Avisos de Atraso</span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const keys = notifications.map(n => `${n.type}-${n.id}`);
                      await onDismissAll(keys);
                      setNotifications([]);
                      showToast("Todas as notificações foram dispensadas.");
                    }}
                    className="text-[9px] font-bold text-slate-400 hover:text-red-400 px-2 py-1 rounded hover:bg-white/5 transition-all uppercase tracking-wider"
                  >
                    Limpar Tudo
                  </button>
                  <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>
                </>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center text-center text-slate-500 gap-2">
                <CheckSquare className="w-8 h-8 text-emerald-500/50" />
                <p className="text-sm">Tudo em dia!</p>
              </div>
            ) : (
              <div className="divide-y divide-border-dark">
                {notifications.map(n => (
                  <div
                    key={`${n.type}-${n.id}`}
                    className="p-4 hover:bg-white/5 cursor-pointer flex gap-3 transition-colors group"
                  >
                    <div
                      className="flex-1 flex flex-col gap-1"
                      onClick={() => onItemClick(n)}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${n.type === 'payment_overdue' ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
                          {n.type === 'payment_overdue' ? 'Pagamento Atrasado' : 'Entrega Atrasada'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">#{n.id}</span>
                      </div>
                      <p className="text-sm font-bold mt-1 text-slate-100">{n.client_name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">
                          {n.type === 'payment_overdue' ? `Valor: R$ ${n.amount?.toLocaleString()}` : n.project_name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500">
                          {n.due_date ? new Date(n.due_date).toLocaleDateString('pt-BR') : (n.delivery_date?.split('-').reverse().join('/'))}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const key = `${n.type}-${n.id}`;
                        await onDismiss(key);
                        setNotifications(prev => prev.filter(notif => !(notif.type === n.type && notif.id === n.id)));
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-all self-start mt-1 shrink-0"
                      title="Dispensar notificação"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
