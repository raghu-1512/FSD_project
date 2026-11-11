import React from 'react';
import { ExpiryStatus } from '../types';
import { CheckCircle2, AlertTriangle, AlertOctagon, Clock, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: ExpiryStatus | 'recalled' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'active' | 'closed';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  switch (status) {
    case 'safe':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{label || 'Safe'}</span>
        </span>
      );
    case 'expiring_later':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-50 text-sky-800 border border-sky-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{label || 'Expiring Later'}</span>
        </span>
      );
    case 'expiring_soon':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-900 border border-amber-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{label || 'Expiring Soon'}</span>
        </span>
      );
    case 'expired':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{label || 'Expired'}</span>
        </span>
      );
    case 'recalled':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-purple-100 text-purple-900 border border-purple-300 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-purple-700 shrink-0" />
          <span>{label || 'Recalled'}</span>
        </span>
      );
    case 'in_stock':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{label || 'In Stock'}</span>
        </span>
      );
    case 'low_stock':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>{label || 'Low Stock'}</span>
        </span>
      );
    case 'out_of_stock':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>{label || 'Out of Stock'}</span>
        </span>
      );
    case 'active':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <span>Active</span>
        </span>
      );
    case 'closed':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span>Closed / Resolved</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
          <span>{label || String(status)}</span>
        </span>
      );
  }
};
