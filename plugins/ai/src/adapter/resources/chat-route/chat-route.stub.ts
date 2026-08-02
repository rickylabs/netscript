/** Type-checked source stub for the generated AI chat island.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/**
 * App-owned chat island. Consumes the TanStack-backed durable-chat client from
 * `@netscript/fresh/ai` and renders assistant `RenderPart[]` through the app's
 * copy-based `Markdown` UI component. All AI work happens server-side in the
 * generated stream route — this island only streams and renders.
 */
export const chatRouteStub: StubSource<never> = defineStub({
  source: `/** App-owned AI chat island. Streams from ./chat-stream and renders parts. */

import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  createNetScriptChatConnection,
  projectChatSnapshot,
  type NetScriptChatMessage,
  type NetScriptChatSnapshot,
} from '@netscript/fresh/ai';
import { Markdown } from '../components/ui/markdown.tsx';

const connection = createNetScriptChatConnection({
  target: { sessionId: 'default' },
  streamPath: '/api/ai/chat-stream',
});

function renderMessage(message: NetScriptChatMessage): JSX.Element {
  return (
    <li class={\`ai-message ai-message--\${message.role}\`}>
      <Markdown>{message.content}</Markdown>
    </li>
  );
}

/** Interactive AI chat island. */
export default function ChatIsland(): JSX.Element {
  const [input, setInput] = useState('');
  const [snapshot, setSnapshot] = useState<Pick<NetScriptChatSnapshot, 'messages' | 'renderParts'>>(
    () => projectChatSnapshot([]),
  );
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    const chunks: unknown[] = [];
    void (async () => {
      setStreaming(true);
      try {
        for await (const chunk of connection.subscribe(abort.signal)) {
          chunks.push(chunk);
          setSnapshot(projectChatSnapshot(chunks));
        }
      } finally {
        setStreaming(false);
      }
    })();
    return () => abort.abort();
  }, []);

  async function send(event: Event): Promise<void> {
    event.preventDefault();
    const text = input.trim();
    if (text.length === 0) return;
    setInput('');
    await connection.send([{ id: crypto.randomUUID(), role: 'user', content: text }]);
  }

  return (
    <section class="ai-chat">
      <ul class="ai-chat__log">{snapshot.messages.map(renderMessage)}</ul>
      <form class="ai-chat__form" onSubmit={send}>
        <input
          value={input}
          onInput={(event) => setInput((event.target as HTMLInputElement).value)}
          placeholder="Ask anything…"
        />
        <button type="submit" disabled={streaming}>Send</button>
        {streaming
          ? <button type="button" onClick={() => connection.stop()}>Stop</button>
          : null}
      </form>
    </section>
  );
}
`,
  tokens: [],
});
