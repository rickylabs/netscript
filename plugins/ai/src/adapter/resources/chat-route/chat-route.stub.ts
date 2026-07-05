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

import { useState } from 'preact/hooks';
import {
  createNetScriptChatConnection,
  projectChatSnapshot,
  type NetScriptChatMessage,
  type RenderPart,
} from '@netscript/fresh/ai';
import { Markdown } from '../components/ui/markdown.tsx';

const connection = createNetScriptChatConnection({
  endpoint: '/api/ai/chat-stream',
});

function renderPart(part: RenderPart): preact.JSX.Element {
  if (part.kind === 'text') {
    return <Markdown>{part.text}</Markdown>;
  }
  return <pre class="ai-part">{JSON.stringify(part, null, 2)}</pre>;
}

function renderMessage(message: NetScriptChatMessage): preact.JSX.Element {
  return (
    <li class={\`ai-message ai-message--\${message.role}\`}>
      {projectChatSnapshot(message).parts.map(renderPart)}
    </li>
  );
}

/** Interactive AI chat island. */
export default function ChatIsland(): preact.JSX.Element {
  const [input, setInput] = useState('');
  const snapshot = connection.useSnapshot();

  async function send(event: Event): Promise<void> {
    event.preventDefault();
    const text = input.trim();
    if (text.length === 0) return;
    setInput('');
    await connection.send({ role: 'user', text });
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
        <button type="submit" disabled={snapshot.streaming}>Send</button>
        {snapshot.streaming
          ? <button type="button" onClick={() => connection.stop()}>Stop</button>
          : null}
      </form>
    </section>
  );
}
`,
  tokens: [],
});
