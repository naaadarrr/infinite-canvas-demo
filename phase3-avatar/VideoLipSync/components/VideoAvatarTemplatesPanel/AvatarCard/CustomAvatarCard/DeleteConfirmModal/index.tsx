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
        className='relative w-full max-w-sm mx-4 p-6 bg-[#1e1e1e] rounded-2xl border border-white/10 shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex flex-col items-center text-center'>
          <div className='w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4'>
            <AlertTriangle className='w-6 h-6 text-red-400' />
          </div>

          <h3 className='text-lg font-medium text-white mb-2'>
            Delete Video Avatar?
          </h3>

          <p className='text-sm text-white/60 mb-6'>
            Are you sure you want to delete this video avatar? This action
            cannot be undone.
          </p>

          <div className='flex gap-3 w-full'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors'
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
