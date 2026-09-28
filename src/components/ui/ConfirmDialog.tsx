'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
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
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini? Data yang dihapus tidak dapat dipulihkan.',
  confirmText = 'Ya, Hapus Data',
  cancelText = 'Batal',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            {variant === 'danger' ? <Trash2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <span>{title}</span>
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
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-600/20 flex items-center gap-1.5"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      }
    >
      <div className="py-2 text-xs text-slate-600 leading-relaxed">
        {message}
      </div>
    </Modal>
  );
};
