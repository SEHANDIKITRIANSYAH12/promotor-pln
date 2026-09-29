'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string | React.ReactNode;
  message?: string | React.ReactNode;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  children,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-600',
          btnBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 text-rose-600',
          btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
          icon: <Trash2 className="w-4 h-4" />
        };
    }
  };

  const style = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className={`w-7 h-7 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0`}>
            {style.icon}
          </div>
          <span className="text-sm font-bold">{title}</span>
        </div>
      }
      maxWidth="md"
      position="center"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-xl ${style.btnBg} text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5`}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              style.icon
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      }
    >
      <div className="py-2 text-xs text-slate-600 leading-relaxed space-y-3">
        {message && <div>{message}</div>}
        {children}
      </div>
    </Modal>
  );
};
