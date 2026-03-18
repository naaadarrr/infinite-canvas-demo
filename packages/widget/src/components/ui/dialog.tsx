/**
 * Adapter: Dialog for product-photography Manually Mask modal (resolves @/components/ui/dialog)
 */
import React from 'react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={() => onOpenChange(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogContent({ className = '', children }: DialogContentProps) {
  return (
    <div
      className={className}
      style={{
        background: '#1C1C1D',
        color: '#fff',
        border: '1px solid #353537',
        borderRadius: 12,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children?: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}>{children}</div>;
}

export function DialogTitle({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <h2 className={className} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
      {children}
    </h2>
  );
}
