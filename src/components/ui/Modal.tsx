'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  closeOnBackdropClick?: boolean;
  position?: 'center' | 'top';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
  closeOnBackdropClick = false,
  position = 'center',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Ensure body always starts at the top
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '4xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Alignment Container */}
      <div
        className={clsx(
          'flex min-h-full justify-center p-2.5 sm:p-4 md:p-6 text-center',
          position === 'top' ? 'items-start pt-3 sm:pt-6' : 'items-center'
        )}
      >
        {/* Modal Dialog Box */}
        <div
          className={clsx(
            'relative w-full text-left bg-white rounded-2xl shadow-2xl border border-slate-200/90 transform transition-all z-10 overflow-hidden flex flex-col',
            'max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)]',
            'animate-fade-in',
            maxWidthClasses[maxWidth]
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* Header (Always Fixed at Top, never shrinks) */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/95 shrink-0">
            <div className="text-base font-bold text-slate-800 flex items-center gap-2 flex-1 min-w-0 pr-2">
              {title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
              title="Tutup Form (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body Area (Takes remaining height, scrolls smoothly) */}
          <div
            ref={scrollRef}
            className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto modal-scroll-area flex-1 min-h-0 text-slate-700 text-sm"
          >
            {children}
          </div>

          {/* Footer (Always Fixed & Docked at Bottom, shrink-0, guaranteed visible) */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0 shadow-xs">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

