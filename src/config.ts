import {
  AppConfig,
  ChannelConfig,
} from './types';
import {
  DEFAULT_ICONS,
  DEFAULT_GPIO_START,
  DEFAULT_MQTT,
  DEFAULT_TOPIC,
  HEX_RE,
  MAX_CHANNELS,
  MAX_GPIO,
  MIN_GPIO,
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
    gpio: DEFAULT_GPIO_START + i,
  };
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
    gpio:
      typeof c.gpio === 'number' && Number.isInteger(c.gpio) && c.gpio >= MIN_GPIO && c.gpio <= MAX_GPIO
        ? c.gpio
        : d.gpio,
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

export function nextFreeGpio(cfg: AppConfig, channelCount: number): number {
  const used = new Set<number>();
  for (let i = 0; i < channelCount; i++) {
    const gpio = channelCfg(cfg, i).gpio;
    if (Number.isInteger(gpio)) used.add(gpio);
  }

  for (let gpio = DEFAULT_GPIO_START; gpio <= MAX_GPIO; gpio++) {
    if (!used.has(gpio)) return gpio;
  }

  return Math.min(MAX_GPIO, DEFAULT_GPIO_START + channelCount);
}
