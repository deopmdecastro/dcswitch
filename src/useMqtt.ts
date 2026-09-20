import { useCallback, useEffect, useRef, useState } from 'react';
import mqtt, { type MqttClient } from 'mqtt';
import { AppConfig, BrokerState, RelayState } from './types';
import { topicPrefix, mqttUrl, initialStates } from './config';
import { MIN_CHANNELS, RESPONSE_TIMEOUT_MS } from './constants';

interface UseMqttOptions {
  /** Chamado quando um comando não recebe resposta do dispositivo a tempo. */
  onNoResponse?: (channel: number) => void;
}

interface UseMqttResult {
  states: RelayState[];
  deviceOnline: boolean | null;
  brokerState: BrokerState;
  pending: Set<number>;
  toggleRelay: (i: number) => void;
  setAll: (target: boolean) => void;
  lastUpdate: Date | null;
}

export function useMqtt(
  cfg: AppConfig,
  params: URLSearchParams,
  { onNoResponse }: UseMqttOptions = {},
): UseMqttResult {
  const [states, setStates] = useState<RelayState[]>(initialStates);
  const [deviceOnline, setDeviceOnline] = useState<boolean | null>(null);
  const [brokerState, setBrokerState] = useState<BrokerState>('connecting');
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const clientRef = useRef<MqttClient | null>(null);
  const pendingTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const bulkTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const statesRef = useRef<RelayState[]>(states);
  const onNoResponseRef = useRef(onNoResponse);
  onNoResponseRef.current = onNoResponse;

  const settlePending = useCallback((i: number) => {
    setPending((prev) => {
      if (!prev.has(i)) return prev;
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
    const t = pendingTimers.current.get(i);
    if (t) {
      clearTimeout(t);
      pendingTimers.current.delete(i);
    }
  }, []);

  const sendToggle = useCallback(
    (i: number) => {
      const client = clientRef.current;
      if (!client || !client.connected) return;
      const prefix = topicPrefix(cfg, params);
      client.publish(`${prefix}/cmd`, JSON.stringify({ action: 'toggle', channel: i }));
      setPending((prev) => {
        const next = new Set(prev);
        next.add(i);
        return next;
      });
      const existing = pendingTimers.current.get(i);
      if (existing) clearTimeout(existing);
      pendingTimers.current.set(
        i,
        setTimeout(() => {
          // Sem resposta: deixa de mostrar "a aplicar" e avisa.
          settlePending(i);
          onNoResponseRef.current?.(i);
        }, RESPONSE_TIMEOUT_MS),
      );
    },
    [cfg, params, settlePending],
  );

  const toggleRelay = useCallback(
    (i: number) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      sendToggle(i);
    },
    [sendToggle],
  );

  const setAll = useCallback(
    (target: boolean) => {
      let delay = 0;
      statesRef.current.forEach((s, i) => {
        if (s !== null && s !== target) {
          // Pequeno intervalo entre comandos para não sobrecarregar o firmware/broker.
          const t = setTimeout(() => {
            bulkTimers.current.delete(t);
            sendToggle(i);
          }, delay);
          bulkTimers.current.add(t);
          delay += 90;
        }
      });
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
    },
    [sendToggle],
  );

  useEffect(() => {
    const prefix = topicPrefix(cfg, params);
    const stateTopic = `${prefix}/state`;
    const statusTopic = `${prefix}/status`;
    const url = mqttUrl(cfg, params);
    const timers = pendingTimers.current;
    const bulk = bulkTimers.current;

    const fresh = initialStates();
    statesRef.current = fresh;
    setStates(fresh);
    setDeviceOnline(null);
    setBrokerState('connecting');
    setPending(new Set());
    setLastUpdate(null);
    timers.forEach((t) => clearTimeout(t));
    timers.clear();

    let client: MqttClient;
    try {
      client = mqtt.connect(url, {
        clientId: `dcswitch_react_${Math.random().toString(16).slice(2)}`,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
      });
    } catch {
      setBrokerState('error');
      return;
    }

    clientRef.current = client;

    client.on('connect', () => {
      setBrokerState('connected');
      client.subscribe([stateTopic, statusTopic]);
    });
    client.on('reconnect', () => setBrokerState('reconnecting'));
    client.on('close', () => {
      setBrokerState((prev) => (prev === 'connected' ? 'offline' : prev));
    });
    client.on('offline', () => setBrokerState('offline'));
    client.on('error', () => setBrokerState('error'));

    client.on('message', (topic: string, payload: Uint8Array) => {
      const text = new TextDecoder().decode(payload);

      if (topic === statusTopic) {
        setDeviceOnline(text.trim().toLowerCase() === 'online');
        return;
      }
      if (topic !== stateTopic) return;

      let data: { states?: unknown[] };
      try {
        data = JSON.parse(text);
      } catch {
        return;
      }
      if (!data || !Array.isArray(data.states)) return;

      // Calcula o novo estado fora do setState (sem efeitos colaterais no updater).
      const prev = statesRef.current;
      const next = [...prev];
      data.states.forEach((value, i) => {
        const v = !!value;
        if (next[i] !== v) settlePending(i);
        next[i] = v;
      });
      while (next.length < MIN_CHANNELS) next.push(null);
      statesRef.current = next;
      setStates(next);
      setLastUpdate(new Date());
    });

    return () => {
      client.removeAllListeners();
      // Um cliente ainda a ligar pode emitir 'error' (ex.: connack timeout) depois de terminado;
      // sem nenhum listener o EventEmitter lançaria uma exceção não tratada.
      client.on('error', () => {});
      client.end(true);
      clientRef.current = null;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      bulk.forEach((t) => clearTimeout(t));
      bulk.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.mqtt, cfg.topic]);

  return { states, deviceOnline, brokerState, pending, toggleRelay, setAll, lastUpdate };
}
