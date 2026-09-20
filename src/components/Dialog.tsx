import { ReactNode, useEffect, useRef } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** id do elemento que dá nome ao diálogo (título). */
  labelledBy: string;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Moldura de diálogo acessível: fecha com Esc ou clicando no fundo,
 * prende o foco lá dentro e devolve-o ao elemento que o abriu.
 */
export function Dialog({ open, onClose, labelledBy, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    // Foco inicial: campo marcado com data-autofocus, ou o primeiro elemento focável.
    const first =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-3.5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="dialog-panel w-full max-w-[440px] max-h-[calc(100dvh-28px)] overflow-auto rounded-[28px]"
      >
        {children}
      </div>
    </div>
  );
}
