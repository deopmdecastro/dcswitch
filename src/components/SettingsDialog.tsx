import { useEffect, useState } from 'react';
import { AppConfig } from '../types';
import { DEFAULT_MQTT, DEFAULT_TOPIC } from '../constants';
import { Dialog } from './Dialog';

interface SettingsDialogProps {
  open: boolean;
  cfg: AppConfig;
  paramsHaveOverride: boolean;
  onSave: (mqtt: string, topic: string) => void;
  onCancel: () => void;
  onResetAll: () => void;
}

const WS_RE = /^(wss?|mqtts?):\/\//i;

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
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (open) {
      setMqtt(cfg.mqtt);
      setTopic(cfg.topic);
      setError('');
      setConfirmReset(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onClose={onCancel} labelledBy="settings-title">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const url = mqtt.trim();
          if (url && !WS_RE.test(url)) {
            setError('O endereço tem de começar por ws:// ou wss://');
            return;
          }
          onSave(url, topic.trim().replace(/\/+$/, ''));
        }}
        className="p-5 flex flex-col gap-5"
      >
        <h2 id="settings-title" className="text-[1.15rem] font-extrabold m-0">
          Definições de ligação
        </h2>

        <div>
          <label htmlFor="set-mqtt" className="field-label">
            Servidor MQTT (WebSocket)
          </label>
          <input
            type="text"
            inputMode="url"
            id="set-mqtt"
            data-autofocus
            value={mqtt}
            onChange={(e) => {
              setMqtt(e.target.value);
              if (error) setError('');
            }}
            placeholder={DEFAULT_MQTT}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={!!error}
            aria-describedby={error ? 'set-mqtt-err' : undefined}
            className="field-input"
          />
          {error && (
            <p id="set-mqtt-err" role="alert" className="text-[0.78rem] mt-1.5 text-[var(--err)]">
              {error}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="set-topic" className="field-label">
            Prefixo do tópico
          </label>
          <input
            type="text"
            id="set-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={DEFAULT_TOPIC}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="set-topic-hint"
            className="field-input"
          />
          <p id="set-topic-hint" className="text-[0.78rem] text-[var(--muted)] mt-1.5">
            {paramsHaveOverride
              ? 'Atenção: os parâmetros ?mqtt= / ?topic= do endereço têm prioridade sobre estas definições.'
              : 'Tem de coincidir com o definido no firmware do ESP32. Deixe vazio para usar o valor por omissão.'}
          </p>
        </div>

        <div className="flex gap-2 justify-end items-center">
          <button
            type="button"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              onResetAll();
            }}
            onBlur={() => setConfirmReset(false)}
            className="btn btn-ghost btn-danger mr-auto"
          >
            {confirmReset ? 'Confirmar: repor tudo' : 'Repor tudo'}
          </button>
          <button type="button" onClick={onCancel} className="btn">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Dialog>
  );
}
