import { useEffect, useState } from 'react';
import { ToastMsg } from '../types';

interface ToastProps {
  toast: ToastMsg | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2600);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={`fixed left-1/2 bottom-6 -translate-x-1/2 px-4 py-2.5 rounded-full text-[0.88rem] max-w-[calc(100%-32px)] text-center z-[60] transition-all duration-250 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } ${
        toast.kind === 'error'
          ? 'bg-[#1d2942] border border-[rgba(248,113,113,0.6)]'
          : 'bg-[#1d2942] border border-[var(--border,#24304b)]'
      }`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}
