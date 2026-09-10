import React from 'react';
import { Send, Eye, FileSignature, CheckCircle2, Archive, AlertCircle, ShieldAlert } from 'lucide-react';

export const StatusBadge = ({ status, className = '' }) => {
  const configs = {
    'Dikirim': {
      bg: 'bg-sky-50 border-sky-200 text-sky-700',
      icon: Send,
      dot: 'bg-sky-500'
    },
    'Dibaca': {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      icon: Eye,
      dot: 'bg-indigo-500'
    },
    'Diparaf': {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: FileSignature,
      dot: 'bg-amber-500'
    },
    'Disetujui': {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      dot: 'bg-emerald-500'
    },
    'Diarsipkan': {
      bg: 'bg-slate-100 border-slate-300 text-slate-700',
      icon: Archive,
      dot: 'bg-slate-500'
    }
  };

  const current = configs[status] || {
    bg: 'bg-gray-100 border-gray-200 text-gray-700',
    icon: null,
    dot: 'bg-gray-400'
  };

  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg} ${className}`}>
      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" /> : <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />}
      <span>{status}</span>
    </span>
  );
};

export const SifatBadge = ({ sifat }) => {
  const configs = {
    'Sangat Rahasia': 'bg-rose-50 text-rose-700 border-rose-200',
    'Rahasia': 'bg-red-50 text-red-600 border-red-200',
    'Terbatas': 'bg-amber-50 text-amber-800 border-amber-200',
    'Penting': 'bg-amber-50 text-amber-700 border-amber-200',
    'Biasa': 'bg-slate-50 text-slate-600 border-slate-200',
    'Biasa/Terbuka': 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const style = configs[sifat] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${style}`}>
      {sifat === 'Sangat Rahasia' || sifat === 'Rahasia' ? (
        <ShieldAlert className="w-3 h-3 text-rose-600" />
      ) : null}
      {sifat}
    </span>
  );
};

