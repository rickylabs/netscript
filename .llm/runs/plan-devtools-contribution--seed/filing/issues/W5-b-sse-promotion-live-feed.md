# [devtools W5-b] Promote `createSSEStream` / `createKvWatchSSE` to public + live feed

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W5-b] Promote \`createSSEStream\` / \`createKvWatchSSE\` to public + live feed` |
| Labels | `type:feat`, `area:fresh`, `area:kv`, `priority:p1`, `status:triage`, `epic:dev-dashboard`, `wave:v1`, `gate:jsr`, `gate:e2e` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** All labels verified in `.github/labels.yml`. `gate:jsr` is mandatory here — this slice
changes a **public export map** (`packages/fresh/deno.json`), which is the RFC §13.3 consumer-gate
trigger.

**Milestone note.** `0.0.15` — see `W3-a-devtools-host-root.md`; same basis.

---

*Issue body begins below.*

Part of #<epic>

## Context

`createSSEStream` (`packages/fresh/src/runtime/server/sse.ts:148`) and `createKvWatchSSE` (`:339`)
are **shipped but unexported** — they exist, are absent from `server/mod.ts` and from
`packages/fresh/deno.json`, and have zero importers outside their own test (RFC §8, verified). The
DevTools live feed consumes them, so this slice promotes them rather than re-implementing a second
SSE helper (axiom: wrap, do not reinvent; gate F-2). Because the promotion edits a **published
package's export map**, it is a downstream contract change and carries the consumer gate — this is
the one slice in the wave where getting the surface wrong is a breaking change for consumers, not an
internal detail.

## Scope

Verbatim from RFC §14:

- `packages/fresh/deno.json` export map
- `src/runtime/server/sse.ts`

Introduces: **`createSSEStream` promoted to public**, plus `createKvWatchSSE`, and the DevTools live
feed that consumes them.

## Out of scope

- `createKvPrefixWatchSSE` (`sse.ts:416`). Promoting it is a one-line addition, but the public
  surface is a deliberate decision, not a convenience — if the owner or implementer wants it in v1,
  it must be added to this issue's Acceptance explicitly, with its own doc + example rows. Left out
  by default.
- Any bidirectional transport. RFC L9 fixes SSE as **one-directional**; a client→server channel here
  would reopen the class W5-a closed.
- Resolving the `@netscript/fresh` A3-vs-A4 archetype dispute. RFC §13.1 deliberately defuses it by
  standing the host up outside `@netscript/fresh`; this slice touches `fresh`'s export map only and
  must not be used to settle the dispute by implication.

## Acceptance

- [ ] `createSSEStream` and `createKvWatchSSE` are exported from `packages/fresh`'s export map and
      reachable from a consumer import (not merely re-exported from an internal barrel).
- [ ] gate: **consumer gate** — `deno task publish:dry-run` passes, and the emitted **file list** is
      reviewed and recorded in the PR (asserted, not assumed).
- [ ] gate: `deno doc --lint` passes over **every** `packages/fresh` entrypoint. Both promoted
      functions carry an explicit return type, a module doc-comment on their entrypoint, a JSDoc
      one-liner, and a worked `@example`. **Slow types fail the publish bar** — no widened unions, no
      inferred public return types.
- [ ] No **barrel re-export of upstream** is introduced by the promotion (AP-14 / gate F-15).
- [ ] `publish.exclude` still covers `*_test.ts` and fixtures after the change; the sse test does not
      enter the published tarball.
- [ ] gate: e2e — a **live panel updates** in the DevTools host from a real KV write, without a page
      reload; the assertion observes the second value, not merely a non-empty first render.
- [ ] The stream is one-directional: a test asserts the endpoint rejects/ignores any client→server
      payload and that no WebSocket or MessagePort path was added.
- [ ] gate: `deno task check`, `deno task lint`, `deno task arch:check`, `deno task quality:scan`
      pass for `packages/fresh`.
- [ ] Deprecation/compat statement recorded in the PR: the promotion is **additive only** — no
      existing export changed shape.

## Dependencies

- **Hard:** W5-a (the read contract the feed is served behind).
- **Blocks:** W6-a.
- Doctrine note: this is an export-map change on an existing package that already carries a
  **Restructure** verdict. Add exports; do not restructure `packages/fresh` inside this slice.
