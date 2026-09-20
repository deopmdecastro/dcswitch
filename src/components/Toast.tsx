import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { ToastMsg } from '../types';

interface ToastProps {
  toast: ToastMsg | null;
  onDismiss: () => void;
}

const VISIBLE_MS = 3000;
const FADE_MS = 300;

export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const toastId = toast?.id ?? null;

  // Só reage a um toast novo (id diferente). Antes, qualquer re-render do painel
  // (ex.: uma mensagem MQTT) reiniciava o temporizador e o aviso nunca desaparecia.
  useEffect(() => {
    if (toastId === null) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), VISIBLE_MS);
    const clear = setTimeout(() => onDismissRef.current(), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(clear);
    };
  }, [toastId]);

  if (!toast) return null;

  const Icon = toast.kind === 'error' ? AlertCircle : Info;

  return (
    <div
      className="toast"
      data-kind={toast.kind}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      style={{
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, ${visible ? '0' : '16px'})`,
      }}
    >
      <Icon
        className="w-[18px] h-[18px] flex-none"
        style={{ color: toast.kind === 'error' ? 'var(--err)' : 'var(--soft)' }}
        aria-hidden="true"
      />
      <span>{toast.message}</span>
    </div>
  );
}
