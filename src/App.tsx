import { useCallback, useMemo, useState } from 'react';
import { Plus, RefreshCw, Settings, Zap } from 'lucide-react';
import { AppConfig, ToastMsg } from './types';
import {
  channelCfg,
  channelDefaults,
  configuredChannelCount,
  loadConfig,
  nextFreeGpio,
  saveConfig,
  topicPrefix,
  usedGpios,
} from './config';
import { MAX_CHANNELS, MIN_CHANNELS } from './constants';
import { useMqtt } from './useMqtt';
import { SwitchCard } from './components/SwitchCard';
import { EditDialog } from './components/EditDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { Toast } from './components/Toast';

type Tone = 'ok' | 'warn' | 'err';

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-[var(--ok)]',
  warn: 'text-[var(--warn)]',
  err: 'text-[var(--err)]',
};

function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [cfg, setCfg] = useState<AppConfig>(() => loadConfig());
  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [refreshingApp, setRefreshingApp] = useState(false);

  const showToast = useCallback((message: string, kind: 'info' | 'error' = 'info') => {
    setToast({ id: Date.now(), message, kind });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const persistCfg = useCallback(
    (next: AppConfig) => {
      setCfg(next);
      if (!saveConfig(next)) showToast('Não foi possível guardar as alterações neste browser.', 'error');
    },
    [showToast],
  );

  const { states, deviceOnline, brokerState, pending, toggleRelay, setAll, lastUpdate } = useMqtt(
    cfg,
    params,
    {
      onNoResponse: (i) =>
        showToast(`${channelCfg(cfg, i).name} não respondeu. Verifique o dispositivo.`, 'error'),
    },
  );

  const brokerConnected = brokerState === 'connected';
  const haveState = states.some((s) => s !== null);
  const knownCount = states.filter((s) => s !== null).length;
  const onCount = states.filter((s) => s === true).length;
  const totalCards = configuredChannelCount(cfg, states.length);
  const allOn = knownCount > 0 && onCount === knownCount;
  const allOff = knownCount > 0 && onCount === 0;
  const stale = !brokerConnected || deviceOnline === false;
  const canAddChannel = totalCards < MAX_CHANNELS;
  const canDeleteChannel = totalCards > MIN_CHANNELS;

  const canControl = brokerConnected && deviceOnline !== false && haveState;

  const statusInfo = useMemo((): { text: string; tone: Tone } => {
    if (brokerState === 'error') return { text: 'Erro na ligação ao servidor', tone: 'err' };
    if (brokerState === 'offline') return { text: 'Sem ligação ao servidor', tone: 'err' };
    if (brokerState === 'reconnecting') return { text: 'A reconectar…', tone: 'warn' };
    if (brokerState === 'connecting') return { text: 'A ligar ao servidor…', tone: 'warn' };
    if (deviceOnline === false) return { text: 'Dispositivo offline', tone: 'err' };
    if (deviceOnline === true || haveState) return { text: 'Dispositivo online', tone: 'ok' };
    return { text: 'Ligado · à espera do dispositivo…', tone: 'warn' };
  }, [brokerState, deviceOnline, haveState]);

  /** Explica porque não é possível controlar (ou devolve null se for possível). */
  const blockedReason = useCallback((): string | null => {
    if (!brokerConnected) return 'Sem ligação ao servidor.';
    if (deviceOnline === false) return 'O dispositivo está offline.';
    if (!haveState) return 'Ainda sem estado do dispositivo.';
    return null;
  }, [brokerConnected, deviceOnline, haveState]);

  const handleToggle = useCallback(
    (i: number) => {
      const reason = blockedReason();
      if (reason) {
        showToast(reason, 'error');
        return;
      }
      toggleRelay(i);
    },
    [blockedReason, showToast, toggleRelay],
  );

  const handleSetAll = useCallback(
    (target: boolean) => {
      const reason = blockedReason();
      if (reason) {
        showToast(reason, 'error');
        return;
      }
      if (target && allOn) {
        showToast('Já estão todos ligados.');
        return;
      }
      if (!target && allOff) {
        showToast('Já estão todos desligados.');
        return;
      }
      setAll(target);
    },
    [blockedReason, allOn, allOff, setAll, showToast],
  );

  const openEditor = (i: number) => {
    setToast(null); // não deixa um aviso antigo por cima do diálogo
    setEditIndex(i);
    setEditOpen(true);
  };

  const openSettings = () => {
    setToast(null);
    setSettingsOpen(true);
  };

  const handleAddChannel = () => {
    if (!canAddChannel) {
      showToast(`Limite de ${MAX_CHANNELS} interruptores atingido.`, 'error');
      return;
    }

    const newIndex = totalCards;
    const gpio = nextFreeGpio(cfg, totalCards);
    if (gpio === null) {
      showToast('Já não há GPIOs livres no ESP32.', 'error');
      return;
    }

    const base = channelDefaults(newIndex);
    const next: AppConfig = {
      ...cfg,
      channels: [...cfg.channels],
      channelCount: newIndex + 1,
    };
    while (next.channels.length <= newIndex) next.channels.push(null);
    // O novo interruptor fica logo com o próximo GPIO livre atribuído.
    next.channels[newIndex] = { ...base, gpio };
    persistCfg(next);
    setEditIndex(newIndex);
    setEditOpen(true);
    showToast(`Interruptor ${newIndex + 1} adicionado no GPIO ${gpio}.`);
  };

  const handleSaveEdit = (name: string, color: string, icon: string, gpio: number) => {
    const next: AppConfig = {
      ...cfg,
      channels: [...cfg.channels],
      channelCount: Math.max(cfg.channelCount ?? 0, editIndex + 1),
    };
    while (next.channels.length <= editIndex) next.channels.push(null);
    // Se tudo coincide com os valores por omissão, guarda "sem personalização".
    const d = channelDefaults(editIndex);
    const isDefault =
      (!name || name === d.name) && color === d.color && icon === d.icon && gpio === d.gpio;
    next.channels[editIndex] = isDefault ? null : { name: name || d.name, color, icon, gpio };
    persistCfg(next);
    setEditOpen(false);
    showToast('Interruptor atualizado.');
  };

  const handleDeleteChannel = () => {
    if (!canDeleteChannel) {
      showToast(`Tem de existir pelo menos ${MIN_CHANNELS} interruptores.`, 'error');
      return;
    }

    const nextChannels = [...cfg.channels];
    while (nextChannels.length < totalCards) nextChannels.push(null);
    nextChannels.splice(editIndex, 1);

    const nextCount = Math.max(MIN_CHANNELS, totalCards - 1);
    persistCfg({
      ...cfg,
      channels: nextChannels.slice(0, nextCount),
      channelCount: nextCount,
    });
    setEditOpen(false);
    showToast(`Interruptor ${editIndex + 1} apagado.`);
  };

  const handleSaveSettings = (mqtt: string, topic: string) => {
    persistCfg({ ...cfg, mqtt, topic });
    setSettingsOpen(false);
    showToast('Definições guardadas.');
  };

  const handleResetAll = () => {
    persistCfg({ channels: [], mqtt: '', topic: '' });
    setSettingsOpen(false);
    showToast('Tudo reposto.');
  };

  const handleRefreshApp = useCallback(async () => {
    if (refreshingApp) return;
    setRefreshingApp(true);
    showToast('A procurar o ultimo deploy...');

    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          regs.map(async (reg) => {
            try {
              await reg.update();
              await reg.unregister();
            } catch {
              /* ignore */
            }
          }),
        );
      }

      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }

      await fetch(window.location.href, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
    } catch {
      /* O cache-bust abaixo ainda forca o browser a pedir a versao mais nova. */
    } finally {
      const next = new URL(window.location.href);
      next.searchParams.set('deployRefresh', Date.now().toString());
      window.location.replace(next.toString());
    }
  }, [refreshingApp, showToast]);

  const prefix = topicPrefix(cfg, params);

  return (
    <div className="shell">
      <div className="top-bar">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between gap-3 px-4 pt-5 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="logo-tile w-11 h-11 rounded-[15px] flex-none grid place-items-center">
            <Zap className="w-[22px] h-[22px] text-[#04202c]" strokeWidth={2.3} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-[-0.01em] m-0 truncate">
              Painel de Controlo
            </h1>
            <div
              className={`flex items-center gap-2 mt-0.5 text-[0.9rem] font-semibold ${TONE_TEXT[statusInfo.tone]}`}
              role="status"
              aria-live="polite"
            >
              <span className="status-ring" data-tone={statusInfo.tone} aria-hidden="true" />
              <span>{statusInfo.text}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={openSettings}
          aria-label="Definições de ligação"
          className="icon-btn w-11 h-11 rounded-[15px] flex-none grid place-items-center"
        >
          <Settings className="w-[22px] h-[22px]" strokeWidth={2} />
        </button>
      </header>
      </div>

      {/* Resumo + ações em bloco */}
      <section className="px-4 pt-3.5 pb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2.5">
        <div className="text-[0.92rem] font-medium text-[var(--soft)] whitespace-nowrap">
          <b className="text-[var(--text)] text-[1.15rem] font-extrabold">{knownCount ? onCount : '–'}</b>{' '}
          de {totalCards} ligados
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSetAll(true)}
            disabled={!canControl}
            data-primary={allOff}
            className="chip"
          >
            Ligar todos
          </button>
          <button
            type="button"
            onClick={() => handleSetAll(false)}
            disabled={!canControl}
            data-primary={allOn}
            className="chip"
          >
            Desligar todos
          </button>
          <button
            type="button"
            onClick={handleAddChannel}
            disabled={!canAddChannel}
            className="chip"
            aria-label="Adicionar novo interruptor"
          >
            <Plus className="inline-block w-4 h-4 mr-1 align-[-2px]" strokeWidth={2.4} aria-hidden="true" />
            Novo
          </button>
        </div>
      </section>

      {/* Interruptores */}
      <main className="flex-1 px-4 pt-4 pb-4 grid grid-cols-2 gap-3 content-start" aria-label="Interruptores">
        {Array.from({ length: totalCards }, (_, i) => (
          <SwitchCard
            key={i}
            conf={channelCfg(cfg, i)}
            state={states[i] ?? null}
            isPending={pending.has(i)}
            stale={stale}
            deviceOnline={deviceOnline}
            brokerConnected={brokerConnected}
            onToggle={() => handleToggle(i)}
            onEdit={() => openEditor(i)}
          />
        ))}
      </main>

      {/* Rodapé */}
      <footer className="px-4 pt-1 pb-5">
        <div className="footer-pill" style={{ borderRadius: 26 }}>
          <button
            type="button"
            onClick={handleRefreshApp}
            disabled={refreshingApp}
            data-refreshing={refreshingApp}
            className="refresh-deploy-btn"
            aria-label="Buscar ultimo deploy e atualizar a aplicacao"
            title="Buscar ultimo deploy"
          >
            <RefreshCw
              key={lastUpdate?.getTime() ?? 'idle'}
              className="sync-icon w-[18px] h-[18px]"
              strokeWidth={2.4}
              aria-hidden="true"
            />
          </button>
          {lastUpdate ? (
            <div className="min-w-0 flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:gap-x-2">
              <span className="whitespace-nowrap">
                Última atualização às{' '}
                <time dateTime={lastUpdate.toISOString()} className="tabular-nums">
                  {lastUpdate.toLocaleTimeString('pt-PT')}
                </time>
              </span>
              <span aria-hidden="true" className="hidden min-[500px]:inline">
                •
              </span>
              <span className="min-w-0 break-all text-[0.68rem] min-[500px]:text-[inherit] text-[#9ec0ff]">
                {prefix}
              </span>
            </div>
          ) : (
            <span>Toque num cartão para ligar/desligar · use o lápis para editar</span>
          )}
        </div>
      </footer>

      <EditDialog
        open={editOpen}
        editIndex={editIndex}
        current={channelCfg(cfg, editIndex)}
        canDelete={canDeleteChannel}
        takenGpios={usedGpios(cfg, totalCards, editIndex)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteChannel}
        onCancel={() => setEditOpen(false)}
      />

      <SettingsDialog
        open={settingsOpen}
        cfg={cfg}
        paramsHaveOverride={params.has('mqtt') || params.has('topic')}
        onSave={handleSaveSettings}
        onCancel={() => setSettingsOpen(false)}
        onResetAll={handleResetAll}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
