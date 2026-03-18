'use client';

import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='relative mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex flex-col items-center text-center'>
          <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20'>
            <AlertTriangle className='h-6 w-6 text-red-400' />
          </div>

          <h3 className='mb-2 text-lg font-medium text-white'>
            Delete Product Avatar?
          </h3>

          <p className='mb-6 text-sm text-white/60'>
            This product avatar will be permanently removed from your
            collection. This action cannot be undone.
          </p>

          <div className='flex w-full gap-3'>
            <button
              onClick={onClose}
              className='flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10'
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className='flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600'
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
