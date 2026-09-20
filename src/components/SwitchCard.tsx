import { memo } from 'react';
import { Pencil } from 'lucide-react';
import { ChannelConfig, RelayState } from '../types';
import { CardFace } from './CardFace';

interface SwitchCardProps {
  conf: ChannelConfig;
  state: RelayState;
  isPending: boolean;
  /** Sem servidor ou com o dispositivo offline: mostra o último estado, esbatido. */
  stale: boolean;
  deviceOnline: boolean | null;
  brokerConnected: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

function SwitchCardInner({
  conf,
  state,
  isPending,
  stale,
  deviceOnline,
  brokerConnected,
  onToggle,
  onEdit,
}: SwitchCardProps) {
  const isOn = state === true;

  // Rótulos curtos, para caberem ao lado do interruptor. O estado "a aplicar" é
  // indicado pelo ponto a pulsar e pela borda a "respirar", sem trocar o texto.
  let label: string;
  if (state === true) label = 'Ligado';
  else if (state === false) label = 'Desligado';
  else if (deviceOnline === false || !brokerConnected) label = 'Offline';
  else label = 'Aguarda';

  return (
    <article
      className="card"
      style={{ ['--c' as string]: conf.color }}
      data-on={isOn}
      data-pending={isPending}
      data-stale={stale}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-busy={isPending}
        aria-label={`${conf.name}: ${label}${isPending ? ' (a aplicar)' : ''}`}
        onClick={onToggle}
        className="card-main"
      >
        <CardFace name={conf.name} icon={conf.icon} label={label} />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${conf.name}`}
        className="edit-btn"
      >
        <Pencil className="w-[18px] h-[18px]" strokeWidth={2.2} />
      </button>
    </article>
  );
}

export const SwitchCard = memo(SwitchCardInner);
