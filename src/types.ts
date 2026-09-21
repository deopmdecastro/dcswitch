export type RelayState = boolean | null;

export type BrokerState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'error';

export interface ChannelConfig {
  name: string;
  color: string;
  icon: string;
  gpio: number;
}

export interface AppConfig {
  channels: (ChannelConfig | null)[];
  mqtt: string;
  topic: string;
  channelCount?: number;
}

export type ToastKind = 'info' | 'error';

export interface ToastMsg {
  id: number;
  message: string;
  kind: ToastKind;
}
