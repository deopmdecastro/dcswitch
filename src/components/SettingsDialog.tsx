import { useEffect, useState } from 'react';
import { AppConfig } from '../types';
import { DEFAULT_MQTT, DEFAULT_TOPIC } from '../constants';

interface SettingsDialogProps {
  open: boolean;
  cfg: AppConfig;
  paramsHaveOverride: boolean;
  onSave: (mqtt: string, topic: string) => void;
  onCancel: () => void;
  onResetAll: () => void;
}

export function SettingsDialog({
  open,
  cfg,
  paramsHaveOverride,
  onSave,
  onCancel,
  onResetAll,
}: SettingsDialogProps) {
  const [mqtt, setMqtt] = useState(cfg.mqtt);
  const [topic, setTopic] = useState(cfg.topic);

  useEffect(() => {
    if (open) {
      setMqtt(cfg.mqtt);
      setTopic(cfg.topic);
    }
  }, [open, cfg]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,8,18,0.65)] backdrop-blur-sm p-3.5">
      <div
        className="dialog-content w-full max-w-[440px] max-h-[calc(100dvh-28px)] overflow-auto rounded-[26px] border border-[var(--border,#24304b)] bg-[var(--surface,#111a2e)] text-[var(--text,#e8edf7)] shadow-2xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const url = mqtt.trim();
            if (url && !/^(wss?|mqtts?):\/\//i.test(url)) return;
            onSave(url, topic.trim().replace(/\/+$/, ''));
          }}
          className="p-5 flex flex-col gap-4"
        >
          <h2 className="text-[1.1rem] font-bold m-0">Definições de ligação</h2>

          <div className="field">
            <label
              htmlFor="set-mqtt"
              className="block text-[0.78rem] font-semibold uppercase tracking-wide text-[var(--muted,#8b98b3)] mb-1.5"
            >
              Servidor MQTT (WebSocket)
            </label>
            <input
              type="url"
              id="set-mqtt"
              value={mqtt}
              onChange={(e) => setMqtt(e.target.value)}
              placeholder={DEFAULT_MQTT}
              className="w-full px-3.5 py-3 rounded-[14px] bg-[var(--bg,#0b1120)] border border-[var(--border,#24304b)] text-[var(--text,#e8edf7)]"
            />
          </div>

          <div className="field">
            <label
              htmlFor="set-topic"
              className="block text-[0.78rem] font-semibold uppercase tracking-wide text-[var(--muted,#8b98b3)] mb-1.5"
            >
              Prefixo do tópico
            </label>
            <input
              type="text"
              id="set-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={DEFAULT_TOPIC}
              className="w-full px-3.5 py-3 rounded-[14px] bg-[var(--bg,#0b1120)] border border-[var(--border,#24304b)] text-[var(--text,#e8edf7)]"
            />
            <p className="text-[0.75rem] text-[var(--muted,#8b98b3)] mt-1.5">
              {paramsHaveOverride
                ? 'Atenção: os parâmetros ?mqtt= / ?topic= do endereço têm prioridade sobre estas definições.'
                : 'Tem de coincidir com o definido no firmware do ESP32. Deixe vazio para usar o valor por omissão.'}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onResetAll}
              className="btn ghost danger px-3.5 py-2.5 rounded-[14px] font-semibold bg-transparent text-[var(--muted,#8b98b3)] mr-auto"
              style={{ color: 'var(--err, #f87171)' }}
            >
              Repor tudo
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn px-3.5 py-2.5 rounded-[14px] font-semibold border border-[var(--border,#24304b)] bg-[var(--surface-2,#17223a)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn primary px-3.5 py-2.5 rounded-[14px] font-semibold bg-gradient-to-br from-[#34d399] to-[#38bdf8] text-[#06222b] border-transparent"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
