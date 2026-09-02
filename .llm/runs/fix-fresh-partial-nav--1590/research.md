# Research — Fresh partial-navigation coordinator

## Run baseline

| Field           | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Issue           | `#1590`                                                                              |
| Branch          | `fix/fresh-partial-nav-ordering`                                                     |
| Baseline        | `7ae7fe2dad941ed70e5806965fd964b9746d8fe1` (`origin/main`, fetched 2026-08-31)       |
| Package         | `packages/fresh` — Archetype 4 (DSL/builder) plus frontend and browser-runtime scope |
| Installed Fresh | `@fresh/core` 2.3.3; `@fresh/plugin-vite` 1.1.2                                      |
| Research date   | 2026-08-31                                                                           |

This research re-baselines the issue against current `main`, the exact installed JSR sources,
Fresh's 2.3.3 tag, the current EIS Chat workaround, and its recorded browser evidence. The 2.3.3
client source from the Deno cache differs from Fresh tag commit
`39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7` only in the JSR-rewritten Preact import and cache
metadata; the behavioral source and line numbering below match.

## Sources read

- Current issue body and metadata via `gh issue view 1590`; milestone 0.0.7, no issue comments.
- `packages/fresh/deno.json` and `deno.lock`: both `@fresh/core@2` and `@fresh/core@^2.3.3` resolve
  to 2.3.3. `packages/fresh` is currently 0.0.6 and has no navigation subpath.
- Installed `@fresh/core` 2.3.3 client runtime and the matching
  [Fresh tag source](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/partials.ts).
- Installed `@fresh/plugin-vite` 1.1.2 development server and `@remix-run/node-fetch-server` 0.12.0
  request listener.
- Fresh 2.3.3 `reviver.ts`, `preact_hooks.ts`, `shared.ts`, and partial tests.
- `packages/fresh` exports, README, Vite plugin, route manifest, defer island, existing browser
  test, CI change classifier, and durable `fresh-browser` gate.
- Architecture Doctrine sections 01, 02, 04–10; Archetype 4, frontend scope, gate matrix, Plan-Gate,
  and the JSR publishability rubric.
- Current EIS Chat `apps/dashboard/lib/client-nav.ts` at `39b863d54ec180bb24c1e423f4df1886b20cf773`,
  plus its committed rapid-navigation worklog and implementation-evaluation browser matrix.
- The #1349 cycle-1 `FAIL_PLAN` and cycle-2 repair: exact authority references, closed
  public/private decisions, file ceilings, and complete gates must precede an implementation
  dispatch.

## What Fresh 2.3.3 does

### Request and history sequence

Fresh installs document-level listeners at module evaluation. Its click path calls
`maybePushHistory(nextUrl)` before issuing the partial request, then calls the private
`fetchPartials()` function
([`partials.ts` lines 115–178](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/partials.ts#L115-L178)).
`maybePushHistory()` first snapshots the current entry with `replaceState`, then immediately pushes
the intended URL
([lines 74–107](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/partials.ts#L74-L107)).
Button-driven partial refreshes call `fetchPartials(partialUrl, partialUrl, false)` directly
([lines 179–195](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/partials.ts#L179-L195));
forms and `popstate` have separate listeners. A client-nav anchor can push a page URL while fetching
a different `f-partial` URL. GET forms pass their action URL and partial URL separately and set
`shouldNavigate=true` without first pushing history (`partials.ts` lines 252–323). Consequently,
request-path prefix alone cannot distinguish a page intent from named-region work.

`fetchPartials()` adds `fresh-partial=true`, performs an ordinary `fetch`, follows the response URL,
awaits `applyPartials`, and only afterward may call `maybeReplaceHistory(actualUrl)`
([lines 353–387](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/partials.ts#L353-L387)).
There is no request identity, generation, `AbortController`, stale check, route-change event, or
public programmatic navigation function in this flow.

### Body application is unconditional

`applyPartials()` awaits `res.text()`, parses it, imports island modules, changes `document.title`,
mutates the document head, and finally revives body partials
([lines 396–531](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/partials.ts#L396-L531)).
There is no freshness check between body consumption and those document mutations. Consequently, a
late A response can repaint after B and then execute the A-associated history replacement.

This establishes the compatibility seam: Fresh does not export `fetchPartials` or an apply hook. For
2.3.3, ordering must be enforced before `Response.text()` is allowed to return to Fresh, and the
late history replacement must be correlated with the same generation. A caller-only workaround
cannot suppress both mutations reliably. The observable seam is an intent token captured from the
anchor/form/popstate event (or the package's programmatic activation), consumed by Fresh's
immediately following partial fetch, and correlated with the ensuing history mutation. The
`/partials/**` route convention is useful for identifying NetScript region-form work, but is not a
general page/region classifier by itself.

## Why drain means “read to EOF and discard”

The installed `@remix-run/node-fetch-server` request listener creates an `AbortController` for the
server `Request`, registers `res.once('close', () => controller.abort())`, and passes that signal to
Fresh
([`request-listener.ts` lines 126–170](https://jsr.io/@remix-run/node-fetch-server/0.12.0/src/lib/request-listener.ts);
the abort wiring is lines 131–148). Fresh's Vite development plugin builds that request, awaits the
app response, and forwards caught errors through Vite's `next(error)` path
([`dev_server.ts` lines 113–167](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/plugin-vite/src/plugins/dev_server.ts#L113-L167)).
A browser transport cancellation can therefore abort server work and surface the rejection as the
Vite error overlay.

EIS Chat reproduced that path under Fresh 2.3.3. Its
[committed workaround](https://github.com/rickylabs/eis-chat/blob/39b863d54ec180bb24c1e423f4df1886b20cf773/apps/dashboard/lib/client-nav.ts#L75-L117)
explicitly removed physical cancellation and drained late response bodies. The associated
[worklog](https://github.com/rickylabs/eis-chat/blob/39b863d54ec180bb24c1e423f4df1886b20cf773/.llm/runs/agent-netscript-services-cache-abort-fix--g3cachefix/worklog.md#L5-L23)
recorded rapid client navigation with no `AbortSignal` overlay, request failure, page error, or
document reload. Its
[browser evaluation](https://github.com/rickylabs/eis-chat/blob/39b863d54ec180bb24c1e423f4df1886b20cf773/.llm/runs/agent-netscript-0.0.5-g3-deferred-navigation--g3defer/impl-eval-fix-cycle.md#L92-L153)
then exercised eight response gaps from 0 through 800 ms and observed the same document, the last
URL/heading, settled regions, zero abort errors, and every superseded HTTP response completing
normally.

For this coordinator, **drain** is therefore locked to:

1. keep the browser transport alive;
2. consume the response body to EOF with the original `text()` or `arrayBuffer()` reader;
3. discard the consumed value if its generation is stale; and
4. reject only Fresh's logical apply path with a package-owned sentinel after the drain.

Detaching a reader, calling `body.cancel()`, abandoning a resolved `Response`, or aborting an
internal controller is not a drain. If a response becomes stale while Fresh is awaiting `text()`,
the wrapper must let that original read finish before returning the logical drop. If it is already
stale when headers arrive, the wrapper must consume `arrayBuffer()` before the logical drop. A
caller-provided abort is observed logically for in-scope Fresh GET requests, while the coordinator
must insulate the transport long enough to drain.

## Region identity in Fresh 2.3.3

Fresh's server hook serializes a partial marker as
`frsh:partial:<name>:<mode>:<normalized vnode key>`
([`preact_hooks.ts` lines 147–160](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/server/preact_hooks.ts#L147-L160)).
The client reviver reads that name and key into a `PartialComp` VNode
([`reviver.ts` lines 293–306](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/reviver.ts#L293-L306)
and
[437–449](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/reviver.ts#L437-L449)).
`PartialComp` registers itself in `ACTIVE_PARTIALS` by `this.props.name` only in
`componentDidMount`; it has no update registration hook
([`reviver.ts` lines 58–70](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/reviver.ts#L58-L70)).

Response application parses the same marker and looks up `ACTIVE_PARTIALS.get(partialName)` before
mutating the mounted instance
([`partials.ts` lines 533–623](https://github.com/denoland/fresh/blob/39b5f06f8a7d7fa02dd2e2950f2291d04ef9fea7/packages/fresh/src/runtime/client/partials.ts#L533-L623)).
An unkeyed dynamic child may therefore be reconciled as the old `PartialComp`: its `name` prop
changes, but the registry entry remains under the old name. A later response for the new name emits
`Partial "…" not found` and is skipped.

Fresh already supplies the mechanism needed to avoid this. Giving the partial VNode `key={name}`
serializes that key into the comment boundary; a name change then changes the VNode identity and
forces a remount, which runs `componentDidMount` for the new name. Fresh's own tests prove keyed
partial reordering preserves the intended identities (`partials_test.tsx` lines 608–678), although
they do not cover a dynamic name change.

**Scope reduction:** NetScript does not need to rewrite server HTML markers. A documented wrapper
around Fresh's public `Partial` can set `key={name}` at render time. “Remount-safe” is measurable as
a name-changing A → B → A boundary receiving each matching region response, with no missing-partial
warning and with distinct serialized keys/remount identities.

## Package seam and doctrine

Doctrine classifies `packages/fresh` as Archetype 4 with a **Keep** verdict: preserve per-concern
builders and route contracts. The coordinator is behavior, not another fluent builder. The
principled location is a narrow `src/runtime/navigation/` concern exported as
`@netscript/fresh/navigation`, parallel to existing runtime subpaths such as `./interactive` and
`./streams`.

The public surface should contain only the explicit lifecycle and consumer contract:

- install/dispose the document coordinator;
- programmatically request a Fresh client navigation;
- subscribe to accepted route changes; and
- render a name-keyed Fresh partial boundary.

Generation state, response wrapping, the logical-drop sentinel, fetch/history ownership checks,
marker recognition, event transport, and test seams stay internal. Importing the subpath must be
safe in server/Deno contexts and have no side effects; global compatibility wrappers are installed
only by an explicit lifecycle call and restored on final disposal. This satisfies the runtime
ownership exception without turning the root package or builder graph into a browser singleton.

## Existing hosted browser lane

The repository already has the required hosted lane. Any `packages/fresh/**` change sets
`needs_fresh_browser=true` in `.github/scripts/ci-classify-changes.ts` (line 224). The `check-test`
job installs Chromium and `@playwright/cli`, then runs the durable `fresh-browser` gate from
`packages/fresh` (`.github/workflows/ci.yml` lines 252–265). The catalog maps that gate to
`deno task test:browser`, and the gate receipt stores exit code, Git SHA, command, duration, and
bounded stdout/stderr hashes/tails before CI uploads the JSON artifact.

No new workflow or classifier is required. Extending the existing browser test task and fixture is
enough to run the proof on hosted Ubuntu even though this host has no local Chromium.

## Research conclusion

Fresh 2.3.3 already provides partial fetching, body/head application, history, link/form/popstate
listeners, redirect fallback, marker keys, and keyed reconciliation. It does **not** provide
last-intent ordering, a safe stale-response hook, route subscription, or programmatic navigation.
The planned scope is therefore a version-bounded compatibility coordinator plus a keyed wrapper, not
a replacement navigation runtime and not an HTML-marker transformer.
