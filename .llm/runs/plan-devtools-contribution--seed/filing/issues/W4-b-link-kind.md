# [devtools W4-b] `link` contribution kind — deep-link rendering + disabled-with-reason

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W4-b] \`link\` contribution kind — deep-link rendering + disabled-with-reason` |
| Labels | `type:feat`, `area:fresh`, `priority:p2`, `status:triage`, `epic:dev-dashboard`, `wave:v1`, `gate:e2e` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** All labels verified in `.github/labels.yml`. No `gate:jsr` here: the link **types**
land in W1-b; this slice wires the host renderer and does not change `devtools-core`'s export map.
If the implementation does change that map, add `gate:jsr` and run the consumer gate.

**Milestone note.** `0.0.15` — see `W3-a-devtools-host-root.md`; same basis.

---

*Issue body begins below.*

Part of #<epic>

## Context

RFC-0002 §11.2 makes the Aspire/Scalar/DevTools boundary a merge criterion: a capability that Aspire
or Scalar owns **and** that is genuinely deep-linkable cannot ship as a NetScript-owned surface
(AC-1, adopted verbatim from #400). The `link` kind is what makes that boundary usable instead of
merely restrictive — it is how a NetScript surface hands off. §11.6's helper returns a **value with a
reason**, so a missing base renders a disabled affordance naming the missing setting rather than a
broken href.

## Scope

Verbatim from RFC §14:

- the host renderer

Introduces: **link rendering + disabled-with-reason**, over the `DevToolsLink` /
`resolveDevToolsLink()` contract landed in W1-b.

## Out of scope

- The link grammar and its unit tests — those are **W1-b**.
- Any filtered Aspire view. `?filters=` is an opaque internal serialization with no public formatter;
  RFC §11.6 makes it **unrepresentable**, and adding a variant for it is out of scope by design.
- Contributing links *into* Scalar (fork F-17 — **declined**, the vendored
  `@scalar/api-reference@1.44.15` predates `pluginUrls`).

## Acceptance

- [ ] gate: e2e — a journey step deep-links to `/traces/detail/{traceId}?spanId=` and the target
      resolves in a running Aspire dashboard.
- [ ] A link whose base is absent renders **disabled with its reason**
      (`{ ok: false, reason: 'no-base' }`), naming the missing setting in the UI. It never renders a
      broken or partial href.
- [ ] `reason: 'not-linkable'` renders distinctly from `'no-base'` — the operator can tell "you did
      not configure it" from "this capability is not deep-linkable" (RFC §11.2 `DL?` column).
- [ ] The Aspire base is read from `Dashboard:Frontend:PublicUrl` configuration. `localhost:18888`
      appears **nowhere** as a constant; asserted by a repo grep in the test.
- [ ] `?filters=` is **never** emitted by any rendered link; asserted negatively over the rendered
      output.
- [ ] A browser-token landing renders only when `Dashboard:Frontend:BrowserToken` is configured;
      otherwise the link carries `note: 'will-prompt-for-token'`. Any URL-borne token uses the
      **fragment**, never the query string (RFC §9, T-7 / INV-7).
- [ ] No panel hand-concatenates a link URL — every href in the host comes from the §11.6 helper;
      asserted by a fitness check or `quality:scan` rule.
- [ ] gate: `deno task arch:check` and `deno task quality:scan` pass for the touched roots.

## Dependencies

- **Hard:** W1-b (typed deep-link helper) and W3-a (host root).
- **Hard:** W3-b, per RFC §9 — no DevTools surface is built before production absence is proven.
- **Blocks:** W6-a.
- **Open probes that must close before the helper's contract freezes** (RFC §11.6, OF-IA-6): whether
  the generated AppHost sets `Dashboard:Frontend:PublicUrl` and exposes
  `Dashboard:Frontend:BrowserToken` (research OQ5), and the Scalar tag array (research OQ8). Both are
  cheap reads; if either is still open, record it in `drift.md` rather than assuming.
