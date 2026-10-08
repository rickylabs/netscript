import { type JSX, options } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { fetchServerSentEvents, useChat } from '@tanstack/ai-preact';
import { pairedChannel, readRoute, sendRoute } from './contracts.ts';

const hookCounts = new Map<string, number>();
const previousHook = Reflect.get(options, '__h');
Reflect.set(options, '__h', (component: unknown, index: unknown, kind: unknown) => {
  if (typeof previousHook === 'function') {
    Reflect.apply(previousHook, options, [component, index, kind]);
  }
  if (typeof component !== 'object' || component === null || typeof index !== 'number') return;
  const props: unknown = Reflect.get(component, 'props');
  if (typeof props !== 'object' || props === null || Reflect.get(props, 'fixtureChat') !== true) {
    return;
  }
  const channel: unknown = Reflect.get(props, 'channel');
  if (typeof channel !== 'string') return;
  if (index === 0) hookCounts.set(channel, 0);
  hookCounts.set(channel, Math.max(hookCounts.get(channel) ?? 0, index + 1));
});

interface ChatProps {
  readonly channel: 'A' | 'B';
  readonly fixtureChat: true;
  readonly onUnmount: () => void;
}
function RouteChat({ channel, onUnmount }: ChatProps): JSX.Element {
  const urls = useMemo(() => ({
    send: sendRoute.href({ search: { id: channel } }),
    read: readRoute.href({ search: { id: channel } }),
  }), [channel]);
  const [count, setCount] = useState(0);
  const links = Array.from(
    { length: count + 1 },
    () => pairedChannel.getLinkProps({ path: { channel } }),
  );
  const conditional = count % 2 ? pairedChannel.partialHref({ path: { channel } }) : '';
  const [state, setState] = useState({ marker: 'typed-state', value: 0 });
  const increment = useCallback(() => {
    setState((previous) => ({ ...previous, value: previous.value + 1 }));
    setCount((previous) => previous + 1);
  }, []);
  const connection = useMemo(
    () => fetchServerSentEvents(urls.send, { reconnect: { delayMs: 10, maxAttempts: 2 } }),
    [urls.send],
  );
  const chat = useChat({
    threadId: channel,
    connection,
    live: true,
    initialMessages: [{
      id: `seed-${channel}`,
      role: 'assistant',
      parts: [{ type: 'text', content: `transcript-${channel}` }],
    }],
  });
  const [resumes, setResumes] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    return onUnmount;
  }, []);
  const resume = async () => {
    await chat.sendMessage(`resume-${channel}`);
    setResumes((previous) => previous + 1);
  };
  return (
    <section
      id='chat'
      data-channel={channel}
      data-hydrated={String(hydrated)}
      data-hooks={hookCounts.get(channel) ?? 0}
      data-state={state.marker}
      data-count={state.value}
      data-resumes={resumes}
      data-conditional={conditional}
      data-read={urls.read}
    >
      <h2>{`Channel ${channel}`}</h2>
      <div id='transcript'>
        {chat.messages.map((message) => (
          <p key={message.id}>
            {message.parts.map((part) => part.type === 'text' ? part.content : '').join('')}
          </p>
        ))}
      </div>
      <nav>
        {links.map((props, index) => (
          <a key={index} href={props.href} f-partial={props['f-partial']} f-client-nav>
            {`Link ${index}`}
          </a>
        ))}
      </nav>
      <button type='button' onClick={increment}>Rerender links</button>
      <button type='button' onClick={resume}>Resume chat</button>
      <output id='chat-error'>{chat.error?.message ?? ''}</output>
    </section>
  );
}
export default function RouteHarness({ channel }: { readonly channel: 'A' | 'B' }): JSX.Element {
  const [mounted, setMounted] = useState(true);
  const [unmounted, setUnmounted] = useState(false);
  const onUnmount = useCallback(() => setUnmounted(true), []);
  return (
    <main data-unmounted={String(unmounted)}>
      {mounted && <RouteChat key={channel} channel={channel} fixtureChat onUnmount={onUnmount} />}
      <button type='button' onClick={() => setMounted(false)}>Unmount chat</button>
    </main>
  );
}
