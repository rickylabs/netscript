# [devtools W5-a] DevTools read contract + in-process MCP

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W5-a] DevTools read contract + in-process MCP` |
| Labels | `type:feat`, `area:cli`, `area:sdk`, `priority:p1`, `status:triage`, `epic:dev-dashboard`, `wave:v1` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** All labels verified in `.github/labels.yml`. `area:sdk` covers the MCP composition;
swap for `area:telemetry` only if the implementation lands there instead — do not invent a label.

**Milestone note.** `0.0.15` — see `W3-a-devtools-host-root.md`; same basis.

---

*Issue body begins below.*

Part of #<epic>

## Context

RFC-0002 §8 / L9 makes the data plane a **host-owned, enumerated, deny-by-default read contract**,
served same-origin. The load-bearing property is structural rather than defensive: **no procedure
input accepts a URL-, origin-, host-, or path-shaped string**, so the confused-deputy shape is
removed by construction rather than validated against. MCP is composed **in-process**, read-kind
only, and is never exposed over HTTP — following Aspire's own 13.3 precedent, where the in-dashboard
agent UI was removed and agents were redirected to the CLI/MCP server (fork F-18).

## Scope

Verbatim from RFC §14:

- `packages/cli/.../devtools/server/`

Introduces: **enumerated deny-by-default procedures**.

## Out of scope

- SSE promotion and the live feed — **W5-b**.
- Any mutating procedure. RFC L8 keeps v1 read-only; INV-3/INV-5 (declared actions, origin + token
  discipline) are specified but not shipped here.
- Credentialed data access. Blocked on the RFC-A chain, **including an unfiled metadata child** —
  this slice must not invent a credential path to unblock itself.
- Riding the #934 gateway. RFC §8 explicitly refuses to share a production, RBAC-principaled data
  edge with a dev-only surface.

## Acceptance

- [ ] Every procedure is **explicitly enumerated**; anything not enumerated is denied. Adding a
      procedure is a source change, never configuration or reflection over a registry.
- [ ] gate: contract test asserting **no** procedure input accepts a url/origin/host/path-shaped
      string (the §8 invariant). The test enumerates the full input surface — a spot check on a
      subset does not satisfy this box.
- [ ] MCP is composed **in-process** and exposes **read-kind procedures only**; a test asserts no MCP
      surface is reachable over HTTP from the host's listener.
- [ ] Transport is **one-directional SSE** only. Asserted negatively: no WebSocket and no
      MessagePort/`postMessage` channel exists in the host — this is what forecloses the upstream
      `install-devtools` privileged-command class.
- [ ] gate: INV-7 redaction (**G-7**) — a serializer test in which a request carrying
      `Authorization` / `x-api-key` yields panel payloads with those values **absent**; the Aspire
      telemetry key stays server-side and never reaches the browser.
- [ ] gate: `deno task arch:check` and `deno task quality:scan` pass; `check-doctrine.ts --root
      packages/cli` passes F-2/F-3/F-4 for this A6 surface.
- [ ] gate: F-9 — required permissions declared in the README for every capability this server needs;
      no bare allow flags.

## Dependencies

- **Hard:** W3-a (host root); W3-b per RFC §9.
- **Blocks:** W5-b, W6-a.
- **Sequencing constraint inherited, not invented:** anything needing a credential-bearing typed
  client waits on the RFC-A chain; anything reading runtime-automation state waits on #1446's
  A2b/A3b/A2d per its P-6 entry criterion. Neither is a reason to widen this slice.
