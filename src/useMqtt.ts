import { useCallback, useEffect, useRef, useState } from 'react';
import mqtt, { type MqttClient } from 'mqtt';
import { AppConfig, BrokerState, RelayState } from './types';
import { topicPrefix, mqttUrl, initialStates } from './config';
import { MIN_CHANNELS, RESPONSE_TIMEOUT_MS } from './constants';

interface UseMqttResult {
  states: RelayState[];
  deviceOnline: boolean | null;
  brokerState: BrokerState;
  pending: Set<number>;
  toggleRelay: (i: number) => void;
  setAll: (target: boolean) => void;
  lastUpdate: Date | null;
}

export function useMqtt(cfg: AppConfig, params: URLSearchParams): UseMqttResult {
  const [states, setStates] = useState<RelayState[]>(initialStates);
  const [deviceOnline, setDeviceOnline] = useState<boolean | null>(null);
  const [brokerState, setBrokerState] = useState<BrokerState>('connecting');
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const clientRef = useRef<MqttClient | null>(null);
  const pendingTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const statesRef = useRef<RelayState[]>(states);
  statesRef.current = states;

  const settlePending = useCallback((i: number) => {
    setPending((prev) => {
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
      client.publish(
        `${prefix}/cmd`,
        JSON.stringify({ action: 'toggle', channel: i }),
      );
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
          settlePending(i);
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
      const current = statesRef.current;
      let delay = 0;
      current.forEach((s, i) => {
        if (s !== null && s !== target) {
          setTimeout(() => sendToggle(i), delay);
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

    setStates(initialStates());
    setDeviceOnline(null);
    setBrokerState('connecting');
    setPending(new Set());
    pendingTimers.current.forEach((t) => clearTimeout(t));
    pendingTimers.current.clear();

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

      setStates((prev) => {
        const next = [...prev];
        data.states!.forEach((value, i) => {
          const v = !!value;
          if (next[i] !== v) settlePending(i);
          next[i] = v;
        });
        while (next.length < MIN_CHANNELS) next.push(null);
        return next;
      });
      setLastUpdate(new Date());
    });

    return () => {
      client.removeAllListeners();
      client.end(true);
      clientRef.current = null;
      pendingTimers.current.forEach((t) => clearTimeout(t));
      pendingTimers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.mqtt, cfg.topic]);

  return { states, deviceOnline, brokerState, pending, toggleRelay, setAll, lastUpdate };
}
