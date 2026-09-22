export const DEFAULT_MQTT = 'wss://broker.hivemq.com:8884/mqtt';
export const LOCAL_MQTT = 'ws://127.0.0.1:9001/mqtt';
export const DEFAULT_TOPIC = 'dcswitch/475688253278273537';
export const STORE_KEY = 'dcswitch.config.v2';
export const MIN_CHANNELS = 4;
export const MAX_CHANNELS = 16;
export const RESPONSE_TIMEOUT_MS = 4000;
export const DEFAULT_GPIO_START = 5;
export const MIN_GPIO = 0;
export const MAX_GPIO = 48;

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

// GPIOs utilizáveis como saída no ESP32-S2 (o alvo do firmware).
// Ficam de fora: 0 (strapping/boot), 19 e 20 (USB), 26 a 32 (flash/PSRAM),
// 43 e 44 (UART da consola) e 46 (só de entrada).
// A ordem é a da atribuição automática: os quatro primeiros são os que o
// firmware já usa por omissão em RELAY_PINS, o resto entra por ordem crescente.
export const GPIO_POOL: number[] = [
  5, 6, 7, 8,
  1, 2, 3, 4,
  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21,
  33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 45,
];

export const GPIO_SET = new Set(GPIO_POOL);

export const HEX_RE = /^#[0-9a-f]{6}$/i;
