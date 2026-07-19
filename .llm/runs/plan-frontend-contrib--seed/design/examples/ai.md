# Worked example — AI surfaces (draft, rev 2)

> **Draft — design document only.** Rev 2 integrates adversarial finding S-14: rev 1 pointed the
> durable-chat runtime at a generic proxy path it cannot use — `createNetScriptChatConnection`
> requires a durable-session target (`packages/fresh/src/runtime/ai/create-chat-connection.ts:378-424`)
> and its transport is the specialized stream proxy, not the gateway. **v1 architecture (chosen):
> the durable-session runtime.** The plugin's live chat route ships WITH its specialized proxy
> route (a generated route contribution wired to `@netscript/fresh/ai`'s stream-proxy handler +
> the host principal port for authorization). The gateway (`04 §4`) serves the plugin's ordinary
> oRPC procedures (`ai.models`); it does not carry the chat stream. The oRPC event-iterator
> client is the documented alternative for hosts that opt out of durable sessions.

## Today

- Backend: oRPC `chat` (SSE eventIterator) + `models`
  (`packages/plugin-ai-core/src/contracts/v1/ai.contract.ts:317-391`).
- Runtime plane exists: `@netscript/fresh/ai` — `createNetScriptChatConnection`,
  `projectChatSnapshot`, durable sessions, stream proxy
  (`packages/fresh/src/runtime/ai/mod.ts`).
- UI components exist: fresh-ui chat family (`message`, `prompt-input`, `model-selector`,
  `tool-call-card`, `src/ai/render-ui.tsx`).
- Delivery today is **scaffold-only**: `chatRouteScaffolder` emits `routes/chat.tsx` + a
  `ChatIsland` into the app (`plugins/ai/src/adapter/resources/chat-route/chat-route.ts:33`,
  `chat-route.stub.ts`). No live surface, no nav, no reusable widget.

## Contribution declaration

```ts
// plugins/ai/frontend/mod.ts
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  // contract defaults to { family: 'app', major: 1 }
  pluginKind: 'ai',
  base: '/ai',
  routes: [
    // LIVE: a ready-to-use chat console — durable sessions, model picker, tool calls.
    {
      kind: 'route',
      id: 'chat',
      path: '/chat',
      module: './routes/chat.tsx',
      nav: { label: 'Assistant', icon: 'sparkles', group: 'main' },
    },
    { kind: 'route', id: 'sessions', path: '/sessions', module: './routes/sessions.tsx' },
  ],
  islands: [
    { kind: 'island', id: 'chat', module: './islands/Chat.tsx' },
    { kind: 'island', id: 'assist-launcher', module: './islands/AssistLauncher.tsx' },
  ],
  zones: [
    // A compact "ask the assistant" launcher in the topbar; opens the chat as an overlay.
    { kind: 'zone', id: 'assist', zone: 'app.topbar.end', module: './components/AssistButton.tsx' },
  ],
  requires: { ports: ['ai-stream-proxy'], procedures: ['ai.chat', 'ai.models'] },
});
```

The live `Chat.tsx` island is the productionized `chat-route.stub.ts` content moved INTO the
plugin: `createNetScriptChatConnection` with a **durable-session target** served by the plugin's
own contributed stream-proxy route (the `@netscript/fresh/ai` handler + host principal
authorization — S-14), fresh-ui token styling. Session identity, reconnect, and cancel semantics
are the durable-stream plane's, already shipped; the contribution layer only mounts it.

## The starter stays — repositioned, not removed

`netscript plugin resource add ai chat-page --app .` keeps emitting an app-owned `chat.tsx` for
products building a bespoke chat UX (the current scaffolder, now targeted via `AppTarget`).
Docs frame the choice: **start live, eject to starter when you need to own the pixels.** The
eject path is honest: the starter is the same component source, scaffolded once, drift-tracked.

## Distributed AI (the owner's Axis-5 direction, mapped to this layer)

"Not one chat pane" (dashboard brief Axis 5) decomposes cleanly:

| Axis-5 need | Where it lands |
| --- | --- |
| Reusable assist affordances in arbitrary app surfaces | `AssistLauncher` island — any app page or plugin zone component can import & render it (islands are package exports) |
| Contextual "explain this / fix this" on other plugins' surfaces | those plugins declare a **capability requirement** on the ai plugin (`requires.ports: ['ai-assist']`) and render the launcher only when granted (`ctx.client.capabilities`) — the import of `AssistLauncher` is the published-export composition path, gated by the capability so a host without ai degrades cleanly (S-14) |
| Procedures-as-agent-tools (`DashboardAiToolContribution`) | **dashboard family extension**, not this base layer — the dashboard host's tool registry consumes it (`../canonical/00-overview.md` out-of-scope table) |

## After `netscript plugin install @netscript/plugin-ai`

`/ai/chat` serves with durable sessions; "Assistant" in nav; assist button in the topbar;
`routes.plugins.ai.chat.href()` typed everywhere. Zero app edits.
