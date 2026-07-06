# 219-fafix Plan

## Archetype

- Package: `@netscript/fresh`
- Selected archetype: Archetype 4, Public DSL / Builder, with runtime/API-handler behavior in `src/runtime/ai`.
- Current doctrine verdict: `@netscript/fresh` is listed as `Restructure`; this slice does not deepen the known builder monolith debt.

## Locked Decisions

- Preserve `/ai/chat/{sessionId}` as the default URL convention.
- Add `streamPath` as the named extension axis instead of adding an eis-chat-specific branch.
- String `streamPath` values are static prefixes; function `streamPath` values return full per-session subpaths.
- FA2 sends `Accept-Encoding: identity` before `fetch` so Deno can produce a `Response` that FA2 can sanitize.

## Gates

- Targeted ai tests.
- Scoped `run-deno-check`, `run-deno-lint`, and `run-deno-fmt` on `packages/fresh`.
- Package tests for `packages/fresh`.
- Full export-map `deno doc --lint` / package doc-lint.
- `deno task publish:dry-run`.
- Root `deno task check` and `deno task test`.

## Deferred Scope

- No eis-chat edits.
- No durable-streams runtime/plugin-streams-core edits.
- No `deno task e2e:cli`.
