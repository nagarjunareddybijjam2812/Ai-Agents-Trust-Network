import React from 'react';
import type { DecisionStatus } from '../types/trust.js';
import { CheckCircle2, AlertTriangle, ShieldX } from 'lucide-react';

interface Props {
  status: DecisionStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const DecisionBadge: React.FC<Props> = ({ status, size = 'md', showLabel = true }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  if (status === 'ACCEPTED') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs ${sizeClasses[size]}`}
        title="ACCEPTED: Supported by authoritative evidence and acceptable policy risk"
      >
        <CheckCircle2 size={iconSizes[size]} className="text-emerald-400 shrink-0" />
        {showLabel && <span>ACCEPTED</span>}
      </span>
    );
  }

  if (status === 'NEEDS_REVIEW') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs ${sizeClasses[size]}`}
        title="NEEDS_REVIEW: Material uncertainty, incomplete verification, or unresolved disagreement"
      >
        <AlertTriangle size={iconSizes[size]} className="text-amber-400 shrink-0" />
        {showLabel && <span>NEEDS_REVIEW</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs ${sizeClasses[size]}`}
      title="ABSTAINED: System cannot responsibly produce an affirmative answer under configured policy"
    >
      <ShieldX size={iconSizes[size]} className="text-rose-400 shrink-0" />
      {showLabel && <span>ABSTAINED</span>}
    </span>
  );
};
