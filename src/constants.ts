export const DEFAULT_MQTT = 'wss://broker.hivemq.com:8884/mqtt';
export const DEFAULT_TOPIC = 'dcswitch/475688253278273537';
export const STORE_KEY = 'dcswitch.config.v2';
export const MIN_CHANNELS = 4;
export const MAX_CHANNELS = 16;
export const RESPONSE_TIMEOUT_MS = 4000;

// As 4 primeiras cores são as dos interruptores por omissão (verde, azul, âmbar, ciano).
export const PALETTE: [string, string][] = [
  ['#19e68c', 'Verde'],
  ['#1fb0ff', 'Azul'],
  ['#ffbe1a', 'Âmbar'],
  ['#22e0f0', 'Ciano'],
  ['#ff5f8f', 'Rosa'],
  ['#a78bfa', 'Violeta'],
  ['#ff8a3d', 'Laranja'],
  ['#f062d0', 'Fúcsia'],
];

export const ICONS = [
  '💡', '🔌', '🌀', '❄️', '🔥', '🚪', '🌿', '📺',
  '🔒', '🔔', '🏠', '⚡', '🛋️', '🚿', '🎵', '🚗',
];

export const DEFAULT_ICONS = ['💡', '🔌', '🌀', '❄️'];

export const HEX_RE = /^#[0-9a-f]{6}$/i;
