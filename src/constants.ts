export const DEFAULT_MQTT = 'wss://broker.hivemq.com:8884/mqtt';
export const DEFAULT_TOPIC = 'dcswitch/475688253278273537';
export const STORE_KEY = 'dcswitch.config.v2';
export const MIN_CHANNELS = 4;
export const RESPONSE_TIMEOUT_MS = 4000;

export const PALETTE: [string, string][] = [
  ['#34d399', 'Verde'],
  ['#38bdf8', 'Azul'],
  ['#fbbf24', 'Âmbar'],
  ['#fb7185', 'Rosa'],
  ['#a78bfa', 'Violeta'],
  ['#fb923c', 'Laranja'],
  ['#22d3ee', 'Ciano'],
  ['#f472b6', 'Fúcsia'],
];

export const ICONS = [
  '💡', '🔌', '🌀', '🔥', '❄️', '🚪', '🌿', '📺',
  '🔒', '🔔', '🏠', '⚡', '🛋️', '🚿', '🎵', '🚗',
];

export const DEFAULT_ICONS = ['💡', '🔌', '🌀', '🔥'];

export const HEX_RE = /^#[0-9a-f]{6}$/i;
