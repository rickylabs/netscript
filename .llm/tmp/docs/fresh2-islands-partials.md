# Extract: Fresh 2.x Islands + Partials

> Source: usefresh.dev/docs/concepts/islands, fresh.deno.dev/docs/concepts/partials (404 — docs moved to usefresh.dev)
> Fetch date: 2026-06-11

## Key Facts

1. **Islands**: Files in `islands/` or `(_islands)/` folders. PascalCase or kebab-case. Rendered on server + hydrated on client.
2. **Props**: Serializable only — primitives, Uint8Array, URL, Date, RegExp, JSX Elements, Map, Set, Temporal objects, plain objects, arrays, Preact Signals (if inner value serializable). Functions NOT supported.
3. **Nesting islands**: Supported; nested islands act like normal Preact components but receive serialized props.
4. **Client-only code**: Use `IS_BROWSER` from `fresh/runtime`.
5. **Partials**: Fresh 2 supports partials (f-partial) for updating DOM regions without full page navigation. Exact docs were not retrievable (404) but this is a known Fresh 2 feature from deno-fresh skill.
6. **Vite plugin**: Fresh 2 uses Vite; `@fresh/plugin-vite` in deno.json.

## Implication for Plan D-10/D-11

- `ui:init` installs components into `components/ui/` (pure) and `islands/ui/` (interactive) — Fresh 2 island detection works by folder.
- Zag-powered components must live in `islands/ui/` since they use client-side state machines.
- Partials are the right mechanism for the dashboard data-table + filter-form updates (run 3).
- SSE widgets (jobs/heartbeat) are islands using `IS_BROWSER` guard + `EventSource`.
