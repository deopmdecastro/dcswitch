import {
  AppConfig,
  ChannelConfig,
} from './types';
import {
  DEFAULT_ICONS,
  GPIO_POOL,
  GPIO_SET,
  DEFAULT_MQTT,
  DEFAULT_TOPIC,
  HEX_RE,
  MAX_CHANNELS,
  MIN_CHANNELS,
  PALETTE,
  STORE_KEY,
} from './constants';

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AppConfig>;
      return {
        channels: Array.isArray(p.channels) ? p.channels : [],
        mqtt: typeof p.mqtt === 'string' ? p.mqtt : '',
        topic: typeof p.topic === 'string' ? p.topic : '',
        channelCount:
          typeof p.channelCount === 'number'
            ? Math.min(MAX_CHANNELS, Math.max(MIN_CHANNELS, Math.floor(p.channelCount)))
            : undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return { channels: [], mqtt: '', topic: '' };
}

export function saveConfig(cfg: AppConfig): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
    return true;
  } catch {
    return false;
  }
}

export function channelDefaults(i: number): ChannelConfig {
  return {
    name: `Relé ${i + 1}`,
    color: PALETTE[i % PALETTE.length][0],
    icon: DEFAULT_ICONS[i % DEFAULT_ICONS.length],
    gpio: GPIO_POOL[i % GPIO_POOL.length],
  };
}

/** Aceita apenas GPIOs da lista de pinos utilizáveis. */
export function isValidGpio(g: unknown): g is number {
  return typeof g === 'number' && Number.isInteger(g) && GPIO_SET.has(g);
}

/**
 * GPIOs já ocupados pelos interruptores existentes.
 * `skip` permite ignorar o próprio canal quando se está a editá-lo.
 */
export function usedGpios(cfg: AppConfig, count: number, skip = -1): Map<number, number> {
  const used = new Map<number, number>();
  for (let i = 0; i < count; i++) {
    if (i === skip) continue;
    used.set(channelCfg(cfg, i).gpio, i);
  }
  return used;
}

/**
 * Primeiro GPIO da lista que ainda não esteja atribuído a nenhum interruptor.
 * Devolve null se já estiverem todos ocupados.
 */
export function nextFreeGpio(cfg: AppConfig, count: number, skip = -1): number | null {
  const used = usedGpios(cfg, count, skip);
  return GPIO_POOL.find((g) => !used.has(g)) ?? null;
}

export function channelCfg(cfg: AppConfig, i: number): ChannelConfig {
  const d = channelDefaults(i);
  const c = cfg.channels[i];
  if (!c) return d;
  return {
    name:
      typeof c.name === 'string' && c.name.trim()
        ? c.name.trim().slice(0, 24)
        : d.name,
    color:
      typeof c.color === 'string' && HEX_RE.test(c.color)
        ? c.color.toLowerCase()
        : d.color,
    icon: typeof c.icon === 'string' && c.icon ? c.icon : d.icon,
    gpio: isValidGpio(c.gpio) ? c.gpio : d.gpio,
  };
}

export function mqttUrl(cfg: AppConfig, params: URLSearchParams): string {
  return params.get('mqtt') || cfg.mqtt || DEFAULT_MQTT;
}

export function topicPrefix(cfg: AppConfig, params: URLSearchParams): string {
  return (params.get('topic') || cfg.topic || DEFAULT_TOPIC).replace(/\/+$/, '');
}

export function initialStates(): (boolean | null)[] {
  return new Array(MIN_CHANNELS).fill(null);
}

export function configuredChannelCount(cfg: AppConfig, liveCount = 0): number {
  return Math.min(
    MAX_CHANNELS,
    Math.max(MIN_CHANNELS, cfg.channelCount ?? 0, cfg.channels.length, liveCount),
  );
}
