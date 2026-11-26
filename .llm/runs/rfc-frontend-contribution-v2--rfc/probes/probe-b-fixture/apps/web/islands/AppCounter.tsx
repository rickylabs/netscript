import { options } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';

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

export default function AppCounter({ initialCount = 0 }: { initialCount?: number }) {
  recordPreactIdentity('host-app');
  const [hydrated, setHydrated] = useState(false);
  const [count, setCount] = useState(initialCount);
  const sig = useSignal(initialCount);
  const sharedSig = getSharedSignal();

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div
      id='host-app-island'
      data-hydrated={String(hydrated)}
      data-count={String(count)}
      data-signal={String(sig.value)}
      data-shared-signal={String(sharedSig.value)}
    >
      <button
        id='host-app-btn'
        type='button'
        onClick={() => {
          setCount((c) => c + 1);
          sig.value += 1;
          sharedSig.value += 1;
        }}
      >
        Host App: {count} / sig={sig.value} / shared={sharedSig.value}
      </button>
    </div>
  );
}
