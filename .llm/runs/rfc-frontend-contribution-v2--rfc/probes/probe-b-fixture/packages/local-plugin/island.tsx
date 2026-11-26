import { options } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';
import { IS_BROWSER } from 'fresh/runtime';
import './island.css';

export interface LocalPluginIslandProps {
  initialCount?: number;
  label?: string;
}

const SHARED_SIGNAL_KEY = '__probeSharedSignalBus';

function getSharedSignal(): ReturnType<typeof signal<number>> {
  const g = globalThis as Record<string, unknown>;
  if (!g[SHARED_SIGNAL_KEY]) {
    g[SHARED_SIGNAL_KEY] = signal(10);
  }
  return g[SHARED_SIGNAL_KEY] as ReturnType<typeof signal<number>>;
}

function recordPreactIdentity(source: string): void {
  const g = globalThis as Record<string, unknown>;
  const map = (g.__probePreactOptions ??= new Set<unknown>()) as Set<unknown>;
  map.add(options);
  const sources = (g.__probePreactSources ??= []) as string[];
  if (!sources.includes(source)) sources.push(source);
}

export function LocalPluginIsland({ initialCount = 1, label = 'local-v1' }: LocalPluginIslandProps) {
  recordPreactIdentity('local-plugin');
  const [hydrated, setHydrated] = useState(false);
  const [count, setCount] = useState(initialCount);
  const localSig = useSignal(initialCount);
  const sharedSig = getSharedSignal();

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div
      id='local-plugin-island'
      class='local-plugin-island'
      data-island-version='v1'
      data-hydrated={String(hydrated)}
      data-is-browser={String(IS_BROWSER)}
      data-count={String(count)}
      data-signal={String(localSig.value)}
      data-shared-signal={String(sharedSig.value)}
    >
      <span id='local-plugin-label'>{label}</span>
      <button
        id='local-plugin-btn'
        type='button'
        onClick={() => {
          setCount((c) => c + 1);
          localSig.value += 1;
          sharedSig.value += 1;
        }}
      >
        Local Plugin: {count} / sig={localSig.value} / shared={sharedSig.value}
      </button>
    </div>
  );
}

export default LocalPluginIsland;
