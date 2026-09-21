import { useEffect, useState } from 'react';
import { ChannelConfig } from '../types';
import { GPIO_POOL, ICONS, PALETTE } from '../constants';
import { channelDefaults } from '../config';
import { CardFace } from './CardFace';
import { Dialog } from './Dialog';

interface EditDialogProps {
  open: boolean;
  editIndex: number;
  current: ChannelConfig;
  canDelete: boolean;
  /** GPIO -> índice do interruptor que já o ocupa (sem contar com o que está a ser editado). */
  takenGpios: Map<number, number>;
  onSave: (name: string, color: string, icon: string, gpio: number) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function EditDialog({
  open,
  editIndex,
  current,
  canDelete,
  takenGpios,
  onSave,
  onDelete,
  onCancel,
}: EditDialogProps) {
  const [draft, setDraft] = useState<ChannelConfig>(current);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // O rascunho só é reiniciado quando o diálogo abre (ou muda de interruptor).
  // Não depende de `current`, senão cada mensagem MQTT apagava o que estava a ser escrito.
  useEffect(() => {
    if (open) {
      setDraft(current);
      setConfirmDelete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editIndex]);

  const defaults = channelDefaults(editIndex);
  const preview = {
    name: draft.name.trim() || defaults.name,
    color: draft.color,
    icon: draft.icon,
  };
  const matchedPalette = PALETTE.some(([hex]) => hex === draft.color);
  const gpioTakenBy = takenGpios.get(draft.gpio);

  return (
    <Dialog open={open} onClose={onCancel} labelledBy="edit-title">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (gpioTakenBy !== undefined) return;
          onSave(draft.name.trim(), draft.color, draft.icon, draft.gpio);
        }}
        className="p-5 flex flex-col gap-5"
      >
        <h2 id="edit-title" className="text-[1.15rem] font-extrabold m-0">
          Editar interruptor {editIndex + 1}
        </h2>

        {/* Pré-visualização com o mesmo aspeto do cartão real */}
        <div className="flex justify-center">
          <div
            className="card w-full max-w-[190px]"
            style={{ ['--c' as string]: preview.color }}
            data-on="true"
          >
            <div className="card-main" aria-hidden="true">
              <CardFace name={preview.name} icon={preview.icon} label="Ligado" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="edit-name" className="field-label">
            Nome
          </label>
          <input
            type="text"
            id="edit-name"
            data-autofocus
            maxLength={24}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder={`Ex.: ${defaults.name} · Luz da sala`}
            autoComplete="off"
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="edit-gpio" className="field-label">
            GPIO
          </label>
          <select
            id="edit-gpio"
            value={draft.gpio}
            onChange={(e) => setDraft((d) => ({ ...d, gpio: Number(e.target.value) }))}
            aria-invalid={gpioTakenBy !== undefined}
            aria-describedby="edit-gpio-hint"
            className="field-input"
          >
            {GPIO_POOL.map((g) => {
              const taken = takenGpios.get(g);
              return (
                <option key={g} value={g}>
                  {`GPIO ${g}`}
                  {taken !== undefined ? ` · em uso pelo interruptor ${taken + 1}` : ''}
                </option>
              );
            })}
          </select>
          <p
            id="edit-gpio-hint"
            role={gpioTakenBy !== undefined ? 'alert' : undefined}
            className={`text-[0.78rem] mt-1.5 ${
              gpioTakenBy !== undefined ? 'text-[var(--err)]' : 'text-[var(--muted)]'
            }`}
          >
            {gpioTakenBy !== undefined
              ? `O GPIO ${draft.gpio} já está atribuído ao interruptor ${gpioTakenBy + 1}.`
              : 'Pino do ESP32 que comanda este relé. Tem de coincidir com a ligação física.'}
          </p>
        </div>

        <div>
          <span className="field-label" id="edit-icons">
            Ícone
          </span>
          <div className="grid grid-cols-8 gap-1.5" role="group" aria-labelledby="edit-icons">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, icon: ic }))}
                aria-pressed={ic === draft.icon}
                aria-label={`Ícone ${ic}`}
                className="icon-choice"
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label" id="edit-colors">
            Cor
          </span>
          <div className="flex flex-wrap gap-2.5 items-center" role="group" aria-labelledby="edit-colors">
            {PALETTE.map(([hex, label]) => (
              <button
                key={hex}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, color: hex }))}
                aria-pressed={hex === draft.color}
                aria-label={label}
                className="swatch"
                style={{ background: hex }}
              />
            ))}
            <label
              className="swatch relative overflow-hidden block cursor-pointer"
              data-pressed={!matchedPalette}
              style={{
                background: matchedPalette
                  ? 'conic-gradient(#ff6b7a, #ffbe1a, #19e68c, #1fb0ff, #a78bfa, #ff6b7a)'
                  : draft.color,
              }}
            >
              <input
                type="color"
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value.toLowerCase() }))}
                aria-label="Cor personalizada"
                className="absolute inset-[-8px] w-[60px] h-[60px] opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                onDelete();
              }}
              onBlur={() => setConfirmDelete(false)}
              className="btn btn-ghost btn-danger mr-auto"
            >
              {confirmDelete ? 'Confirmar apagar' : 'Apagar'}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setDraft({ name: '', color: defaults.color, icon: defaults.icon, gpio: draft.gpio })
            }
            className={`btn btn-ghost ${canDelete ? '' : 'mr-auto'}`}
          >
            Repor
          </button>
          <button type="button" onClick={onCancel} className="btn">
            Cancelar
          </button>
          <button type="submit" disabled={gpioTakenBy !== undefined} className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Dialog>
  );
}
