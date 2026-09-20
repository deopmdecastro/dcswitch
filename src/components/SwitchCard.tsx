import { memo } from 'react';
import { ChannelConfig, RelayState } from '../types';
import { Pencil } from 'lucide-react';

interface SwitchCardProps {
  conf: ChannelConfig;
  state: RelayState;
  isPending: boolean;
  deviceOnline: boolean | null;
  brokerConnected: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

function SwitchCardInner({
  conf,
  state,
  isPending,
  deviceOnline,
  brokerConnected,
  onToggle,
  onEdit,
}: SwitchCardProps) {
  const unknownLabel =
    deviceOnline === false || !brokerConnected ? 'Offline' : 'Aguarda';
  const label = state === true ? 'Ligado' : state === false ? 'Desligado' : unknownLabel;
  const isOn = state === true;
  const isUnknown = state === null;
  const color = conf.color;

  return (
    <article
      className="card relative"
      style={{ ['--c' as string]: color }}
      data-on={isOn}
      data-pending={isPending}
      data-unknown={isUnknown}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isOn}
        aria-label={`${conf.name}: ${label}`}
        className="card-main w-full text-left flex flex-col justify-between gap-3.5 min-h-[172px] p-4 rounded-[22px] transition-all duration-300 active:scale-[0.97]"
      >
        <span
          className="icon w-[50px] h-[50px] rounded-2xl text-[26px] leading-none grid place-items-center transition-all duration-300"
          aria-hidden="true"
        >
          {conf.icon}
        </span>
        <span className="name font-bold text-[1.05rem] leading-tight overflow-hidden line-clamp-2 break-words">
          {conf.name}
        </span>
        <span className="meta flex items-center justify-between gap-2">
          <span className="state-text text-[0.74rem] font-bold tracking-wide uppercase truncate min-w-0">
            {label}
          </span>
          <span className="switch w-[52px] h-[30px] rounded-full p-[3px] flex-none block transition-all duration-300" aria-hidden="true">
            <span className="thumb block w-6 h-6 rounded-full bg-white transition-transform duration-250 shadow-md" />
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${conf.name}`}
        className="edit-btn absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-[11px] grid place-items-center backdrop-blur-sm transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </article>
  );
}

export const SwitchCard = memo(SwitchCardInner);
