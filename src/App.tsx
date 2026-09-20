import { useCallback, useMemo, useState } from 'react';
import { Settings, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AppConfig, BrokerState, ToastMsg } from './types';
import {
  channelCfg,
  channelDefaults,
  loadConfig,
  saveConfig,
  topicPrefix,
} from './config';
import { MIN_CHANNELS } from './constants';
import { useMqtt } from './useMqtt';
import { SwitchCard } from './components/SwitchCard';
import { EditDialog } from './components/EditDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { Toast } from './components/Toast';

function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [cfg, setCfg] = useState<AppConfig>(() => loadConfig());
  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const showToast = useCallback((message: string, kind: 'info' | 'error' = 'info') => {
    setToast({ id: Date.now(), message, kind });
  }, []);

  const persistCfg = useCallback(
    (next: AppConfig) => {
      setCfg(next);
      if (!saveConfig(next)) showToast('Não foi possível guardar as alterações neste browser.', 'error');
    },
    [showToast],
  );

  const { states, deviceOnline, brokerState, pending, toggleRelay, setAll, lastUpdate } =
    useMqtt(cfg, params);

  const brokerConnected = brokerState === 'connected';
  const haveState = states.some((s) => s !== null);
  const knownCount = states.filter((s) => s !== null).length;
  const onCount = states.filter((s) => s === true).length;
  const totalCards = Math.max(MIN_CHANNELS, states.length);

  const canControl = useMemo(() => {
    if (!brokerConnected) return false;
    if (deviceOnline === false) return false;
    return haveState;
  }, [brokerConnected, deviceOnline, haveState]);

  const statusInfo = useMemo(() => {
    if (brokerState === 'error') return { text: 'Erro na ligação ao servidor', cls: 'err', icon: AlertCircle };
    if (brokerState === 'offline') return { text: 'Sem ligação ao servidor', cls: 'err', icon: AlertCircle };
    if (brokerState === 'reconnecting') return { text: 'A reconectar…', cls: 'warn', icon: Loader2 };
    if (brokerState === 'connecting') return { text: 'A ligar ao servidor…', cls: 'warn', icon: Loader2 };
    if (deviceOnline === false) return { text: 'Dispositivo offline', cls: 'err', icon: AlertCircle };
    if (deviceOnline === true || haveState) return { text: 'Dispositivo online', cls: 'ok', icon: CheckCircle2 };
    return { text: 'Ligado · à espera do dispositivo…', cls: 'warn', icon: Loader2 };
  }, [brokerState, deviceOnline, haveState]);

  const StatusIcon = statusInfo.icon;

  const handleToggle = useCallback(
    (i: number) => {
      if (!canControl) {
        if (!brokerConnected) showToast('Sem ligação ao servidor.', 'error');
        else if (deviceOnline === false) showToast('O dispositivo está offline.', 'error');
        else if (!haveState) showToast('Ainda sem estado do dispositivo.', 'error');
        return;
      }
      toggleRelay(i);
    },
    [canControl, brokerConnected, deviceOnline, haveState, showToast, toggleRelay],
  );

  const handleSetAll = useCallback(
    (target: boolean) => {
      if (!canControl) {
        if (!brokerConnected) showToast('Sem ligação ao servidor.', 'error');
        else if (deviceOnline === false) showToast('O dispositivo está offline.', 'error');
        else if (!haveState) showToast('Ainda sem estado do dispositivo.', 'error');
        return;
      }
      const known = states.filter((s) => s !== null);
      if (target && known.every(Boolean)) {
        showToast('Já estão todos ligados.');
        return;
      }
      if (!target && known.every((s) => !s)) {
        showToast('Já estão todos desligados.');
        return;
      }
      setAll(target);
    },
    [canControl, brokerConnected, deviceOnline, haveState, states, setAll, showToast],
  );

  const openEditor = (i: number) => {
    setEditIndex(i);
    setEditOpen(true);
  };

  const handleSaveEdit = (name: string, color: string, icon: string) => {
    const next: AppConfig = {
      ...cfg,
      channels: [...cfg.channels],
    };
    while (next.channels.length <= editIndex) next.channels.push(null);
    next.channels[editIndex] = { name, color, icon };
    persistCfg(next);
    setEditOpen(false);
    showToast('Interruptor atualizado.');
  };

  const handleResetEdit = () => {
    const d = channelDefaults(editIndex);
    setCfg((prev) => {
      const next: AppConfig = { ...prev, channels: [...prev.channels] };
      while (next.channels.length <= editIndex) next.channels.push(null);
      next.channels[editIndex] = { name: '', color: d.color, icon: d.icon };
      saveConfig(next);
      return next;
    });
  };

  const handleSaveSettings = (mqtt: string, topic: string) => {
    if (mqtt && !/^(wss?|mqtts?):\/\//i.test(mqtt)) {
      showToast('O servidor tem de começar por ws:// ou wss://', 'error');
      return;
    }
    persistCfg({ ...cfg, mqtt, topic });
    setSettingsOpen(false);
    showToast('Definições guardadas.');
  };

  const handleResetAll = () => {
    if (!confirm('Repor nomes, cores, ícones e definições de ligação?')) return;
    persistCfg({ channels: [], mqtt: '', topic: '' });
    setSettingsOpen(false);
    showToast('Tudo reposto.');
  };

  const prefix = topicPrefix(cfg, params);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0b1120] text-[#e8edf7] select-none">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 max-w-[760px] w-full mx-auto px-4 pt-4.5 pb-1.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex-none grid place-items-center text-[22px] bg-gradient-to-br from-[#34d399] to-[#38bdf8] shadow-lg">
            <Zap className="w-5 h-5 text-[#06222b]" />
          </div>
          <div>
            <h1 className="text-[1.15rem] font-bold leading-tight m-0">Painel de Controlo</h1>
            <div
              className={`pill inline-flex items-center gap-1.5 mt-0.5 text-[0.78rem] ${
                statusInfo.cls === 'ok'
                  ? 'text-[#34d399]'
                  : statusInfo.cls === 'warn'
                    ? 'text-[#fbbf24]'
                    : 'text-[#f87171]'
              }`}
              role="status"
              aria-live="polite"
            >
              <StatusIcon
                className={`w-2 h-2 ${statusInfo.cls === 'warn' || statusInfo.cls === 'err' ? 'animate-pulse' : ''}`}
              />
              <span>{statusInfo.text}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Definições de ligação"
          className="w-[42px] h-[42px] rounded-[14px] flex-none grid place-items-center bg-[#111a2e] border border-[#24304b] hover:bg-[#17223a] active:scale-95 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Summary + bulk actions */}
      <section className="max-w-[760px] w-full mx-auto px-4 pt-2.5 flex items-center justify-between gap-2.5 flex-wrap">
        <div className="text-[0.9rem] text-[#8b98b3]">
          {knownCount ? (
            <>
              <b className="text-[#e8edf7] text-[1.05rem]">{onCount}</b> de {totalCards} ligados
            </>
          ) : (
            <>
              <b className="text-[#e8edf7] text-[1.05rem]">–</b> interruptores ligados
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSetAll(true)}
            disabled={!canControl || (knownCount > 0 && onCount === knownCount)}
            className="px-3.5 py-2 rounded-full text-[0.82rem] font-semibold bg-[#111a2e] border border-[#24304b] hover:bg-[#17223a] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ligar todos
          </button>
          <button
            type="button"
            onClick={() => handleSetAll(false)}
            disabled={!canControl || (knownCount > 0 && onCount === 0)}
            className="px-3.5 py-2 rounded-full text-[0.82rem] font-semibold bg-[#111a2e] border border-[#24304b] hover:bg-[#17223a] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Desligar todos
          </button>
        </div>
      </section>

      {/* Grid */}
      <main
        className={`flex-1 w-full max-w-[760px] mx-auto p-4 grid grid-cols-2 gap-3.5 content-start sm:gap-4.5 sm:px-4 ${
          !canControl ? 'opacity-60' : ''
        }`}
        aria-label="Interruptores"
      >
        {Array.from({ length: totalCards }, (_, i) => (
          <SwitchCard
            key={i}
            conf={channelCfg(cfg, i)}
            state={states[i] ?? null}
            isPending={pending.has(i)}
            deviceOnline={deviceOnline}
            brokerConnected={brokerConnected}
            onToggle={() => handleToggle(i)}
            onEdit={() => openEditor(i)}
          />
        ))}
      </main>

      <footer className="text-center px-4 pt-2.5 pb-4.5 text-[0.74rem] text-[#5d6b88]">
        {lastUpdate
          ? `Última atualização às ${lastUpdate.toLocaleTimeString('pt-PT')} · ${prefix}`
          : 'Toque num cartão para ligar/desligar · use o lápis para editar nome, cor e ícone'}
      </footer>

      <EditDialog
        open={editOpen}
        editIndex={editIndex}
        current={channelCfg(cfg, editIndex)}
        onSave={handleSaveEdit}
        onCancel={() => setEditOpen(false)}
        onReset={handleResetEdit}
      />

      <SettingsDialog
        open={settingsOpen}
        cfg={cfg}
        paramsHaveOverride={params.has('mqtt') || params.has('topic')}
        onSave={handleSaveSettings}
        onCancel={() => setSettingsOpen(false)}
        onResetAll={handleResetAll}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default App;
