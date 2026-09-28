'use client';

import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  onClick?: () => void;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'blue' | 'emerald' | 'amber' | 'purple';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  onClick,
  showPercentage = true,
  size = 'md',
  variant = 'blue'
}) => {
  const p = Math.max(0, Math.min(100, Math.round(Number(percentage) || 0)));

  const variantStyles = {
    blue: {
      bar: 'bg-blue-600',
      bg: 'bg-blue-50/70',
      text: 'text-blue-700',
      border: 'border-blue-100',
    },
    emerald: {
      bar: 'bg-emerald-500',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    amber: {
      bar: 'bg-amber-500',
      bg: 'bg-amber-50/70',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    purple: {
      bar: 'bg-purple-600',
      bg: 'bg-purple-50/70',
      text: 'text-purple-700',
      border: 'border-purple-100',
    }
  };

  const style = variantStyles[variant] || variantStyles.blue;

  const content = (
    <div className="w-full min-w-[130px] space-y-1 py-1">
      <div className="flex items-center justify-between text-[11px] leading-none">
        {label ? (
          <span className="font-semibold text-slate-600">{label}</span>
        ) : <span />}
        {showPercentage && (
          <span className={clsx('font-bold font-mono text-[11px]', style.text)}>
            {p}%
          </span>
        )}
      </div>

      {/* Outer track */}
      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner relative">
        {/* Inner fill */}
        <div
          className={clsx('h-full rounded-full transition-all duration-300 ease-out shadow-xs', style.bar)}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-1.5 -m-1 rounded-xl hover:bg-slate-100/90 active:bg-slate-200/60 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/40 group cursor-pointer"
        title="Klik untuk membuka detail & checklist progress"
      >
        {content}
      </button>
    );
  }

  return content;
};
