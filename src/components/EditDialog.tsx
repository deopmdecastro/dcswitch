import { useEffect, useState } from 'react';
import { ChannelConfig } from '../types';
import { ICONS, PALETTE } from '../constants';
import { channelDefaults } from '../config';

interface EditDialogProps {
  open: boolean;
  editIndex: number;
  current: ChannelConfig;
  onSave: (name: string, color: string, icon: string) => void;
  onCancel: () => void;
  onReset: () => void;
}

interface Draft {
  name: string;
  color: string;
  icon: string;
}

export function EditDialog({
  open,
  editIndex,
  current,
  onSave,
  onCancel,
  onReset,
}: EditDialogProps) {
  const [draft, setDraft] = useState<Draft>({
    name: current.name,
    color: current.color,
    icon: current.icon,
  });

  useEffect(() => {
    if (open) {
      setDraft({ name: current.name, color: current.color, icon: current.icon });
    }
  }, [open, current]);

  const previewConf: ChannelConfig = {
    name: draft.name.trim() || channelDefaults(editIndex).name,
    color: draft.color,
    icon: draft.icon,
  };

  const matchedPalette = PALETTE.some(([hex]) => hex === draft.color);

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
            onSave(draft.name.trim(), draft.color, draft.icon);
          }}
          className="p-5 flex flex-col gap-4"
        >
          <h2 className="text-[1.1rem] font-bold m-0">
            Editar interruptor {editIndex + 1}
          </h2>

          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="preview-card relative w-full max-w-[220px] rounded-[22px] p-4 flex flex-col gap-3.5"
              style={{ ['--c' as string]: previewConf.color }}
              data-on={true}
            >
              <span
                className="w-[50px] h-[50px] rounded-2xl text-[26px] grid place-items-center"
                style={{ background: previewConf.color }}
              >
                {previewConf.icon}
              </span>
              <span className="font-bold text-[1.05rem] leading-tight line-clamp-2">
                {previewConf.name}
              </span>
              <span className="flex items-center justify-between gap-2">
                <span
                  className="text-[0.74rem] font-bold tracking-wide uppercase"
                  style={{ color: previewConf.color }}
                >
                  Ligado
                </span>
                <span
                  className="w-[52px] h-[30px] rounded-full p-[3px] flex"
                  style={{ background: previewConf.color }}
                >
                  <span className="block w-6 h-6 rounded-full bg-white translate-x-[22px] transition-transform" />
                </span>
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="field">
            <label
              htmlFor="edit-name"
              className="block text-[0.78rem] font-semibold uppercase tracking-wide text-[var(--muted,#8b98b3)] mb-1.5"
            >
              Nome
            </label>
            <input
              type="text"
              id="edit-name"
              maxLength={24}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex.: Luz da sala"
              className="w-full px-3.5 py-3 rounded-[14px] bg-[var(--bg,#0b1120)] border border-[var(--border,#24304b)] text-[var(--text,#e8edf7)]"
            />
          </div>

          {/* Icons */}
          <div className="field">
            <span className="block text-[0.78rem] font-semibold uppercase tracking-wide text-[var(--muted,#8b98b3)] mb-1.5">
              Ícone
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, icon: ic }))}
                  aria-pressed={ic === draft.icon}
                  className="aspect-square rounded-xl text-xl grid place-items-center bg-[var(--bg,#0b1120)] border border-[var(--border,#24304b)] aria-[pressed=true]:border-[#7dd3fc] aria-[pressed=true]:bg-[var(--surface-2,#17223a)] aria-[pressed=true]:shadow-[0_0_0_2px_rgba(125,211,252,0.35)]"
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="field">
            <span className="block text-[0.78rem] font-semibold uppercase tracking-wide text-[var(--muted,#8b98b3)] mb-1.5">
              Cor
            </span>
            <div className="flex flex-wrap gap-2.5 items-center">
              {PALETTE.map(([hex, label]) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, color: hex }))}
                  aria-pressed={hex === draft.color}
                  aria-label={label}
                  className="w-[34px] h-[34px] rounded-full border-[3px] border-[var(--surface,#111a2e)] shadow-[0_0_0_1px_var(--border,#24304b)] aria-[pressed=true]:shadow-[0_0_0_2px_var(--text,#e8edf7)]"
                  style={{ background: hex }}
                />
              ))}
              <label
                className="swatch-custom relative overflow-hidden block w-[34px] h-[34px] rounded-full border-[3px] border-[var(--surface,#111a2e)] shadow-[0_0_0_1px_var(--border,#24304b)] cursor-pointer aria-[pressed=true]:shadow-[0_0_0_2px_var(--text,#e8edf7)]"
                aria-pressed={!matchedPalette}
                style={
                  matchedPalette
                    ? { background: 'conic-gradient(#f87171, #fbbf24, #34d399, #38bdf8, #a78bfa, #f87171)' }
                    : { background: draft.color }
                }
              >
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, color: e.target.value.toLowerCase() }))
                  }
                  aria-label="Cor personalizada"
                  className="absolute inset-[-8px] w-[60px] h-[60px] opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onReset}
              className="btn ghost px-3.5 py-2.5 rounded-[14px] font-semibold bg-transparent text-[var(--muted,#8b98b3)] mr-auto"
            >
              Repor
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
