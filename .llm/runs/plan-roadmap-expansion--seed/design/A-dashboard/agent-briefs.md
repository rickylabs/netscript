# Topic A — per-slice agent briefs (dev-dashboard)

> One brief per slice, per the owner's "one Fable/agent per feature/layer/CLI option" model. Lane =
> **WSL Codex daemon-attached** for all framework/plugin source (mobile-visible, steerable);
> **Claude** for the design-sync/prototype (design artifacts, not `packages/`/`plugins/` source).
> **OpenHands** evaluates (never self-certify). Each brief carries a `## SKILL` chapter + model/effort
> routing. These are draft briefs — the supervisor issues them after owner ratification + PLAN-EVAL
> PASS.

## Lane + routing legend

- **WSL Codex** — framework/plugin implementation (`packages/`, `plugins/`, `@netscript/aspire`,
  `@netscript/fresh-ui`). Model default gpt-5-codex / high effort for contract+seam slices, medium
  for panel wiring. Daemon-attached; record worktree + thread id + steering command per harness.
- **Claude** — design-sync + Fresh prototype only (DDX-15). Opus medium.
- **OpenHands** — IMPL-EVAL (qwen 3.7 max) + the `scaffold.runtime` E2E gate. PLAN-EVAL for the epic
  plan = minimax M3.
- Fable 5 — reserve for a single deliberately-spawned sub-agent only if one slice proves
  extraordinarily complex (per cost policy); default is NOT Fable.

Shared `## SKILL` baseline for every framework slice: `netscript-harness` (always-on) +
`netscript-doctrine` (any `packages/`/`plugins/` change) + `netscript-pr` (branch/PR/labels) +
`netscript-tools` (validation evidence, lock hygiene) + `netscript-deno-toolchain` (deps/`deno doc`).
Slice-specific skills added per brief below.

---

## DDX-0 — fresh-ui L3 blocks promotion (precursor)  · WSL Codex · high
**Objective:** add the missing L3 `blocks/` layer to `@netscript/fresh-ui` (§5.2 of proposal).
**Deliverables:** byte-diff script + report of 32 pairs; markdown build-path reconciled; `registry/
blocks/` with 7 blocks (breadcrumbs, context-rail, plugin-gated-view, activity-feed, connector,
entity-rail, tree-nav) + per-block CSS + real `*.d.ts` + `*.prompt.md`; `netscript ui:add <block>`
copies block + L2 deps; NO `data-grid` block; NO MCP components.
**## SKILL:** baseline + `fresh-ui-horizontal` (L0–L4 ladder, copy-source registry model, `--ns-*`
tokens, layout objects) + `deno-fresh` (Fresh islands/routing).
**Validation:** `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts --root packages/fresh-ui
--ext ts,tsx`; `netscript ui:add` smoke; arch:check.
**Gotchas:** blocks ship REAL prop types (the weak-`.d.ts` is a design-sync-tool artifact only, A/02);
truth chain is the real `.tsx`, never `previews/`.

## DDX-1 — @netscript/aspire seam extension (command + app kinds)  · WSL Codex · high
**Objective:** extend Seam A with `command` (hard) + `app` (preferred) kinds (§2.2, §6).
**Deliverables:** `AspireResourceKind` union + `AspireBuilder` port methods + `composeAppHost()`
lowering to raw-SDK `withCommand`/`addExecutable`+`withHttpEndpoint`+`withBrowserLogs`; command
`arguments`(`InteractionInput[]`)+`confirmationMessage` path (NO `IInteractionService`); Seam-B
fallback documented.
**## SKILL:** baseline + `aspire` (13.4.6 pin, withCommand three-surface model, `withBrowserLogs`
#218 prior art, InteractionInput).
**Validation:** package wrappers on `packages/aspire`; arch:check; a fixture plugin that contributes
one command + verifies it appears as an `aspire resource` CLI command.
**Gotchas:** pin is 13.4.6 (`.github/toolchain.env`, `scaffold-versions.ts`) — do NOT bump. Command
visibility default UI+API. Keep the capability in core (thinness), not per-plugin glue.

## DDX-2 — plugin-dashboard-core scaffold + contract seam  · WSL Codex · high
**Objective:** create the fat core with domain/ports/contract (§1.2, §1.3).
**Deliverables:** doctrine-layered package; domain models; 4 ports; `DashboardContract extends
BasePluginContract` (oRPC ContractProcedures, Standard-Schema outputs); base-seam soundness test.
**## SKILL:** baseline + `netscript-doctrine` (ARCHETYPE-2 integration core; layering A1/A8);
`netscript-cli` (contract/scaffold conventions).
**Validation:** package wrappers on `packages/plugin-dashboard-core`; arch:check; the soundness test
(`deno test --unstable-kv`); `deno doc` clean on the public surface.
**Gotchas:** extend the SOUND base contract (`contract-base/domain/base-contract.ts`), not the
phantom-typed service seam (MEMORY plugin-service-type-unsoundness). Only the 2 accepted casts.

## DDX-3 — TelemetryQueryPort + aspire-otlp-http adapter  · WSL Codex · high
**Objective:** implement the telemetry consumer seam (§4).
**Deliverables:** `aspire-otlp-http` adapter over `/api/telemetry/{traces,traces/{id},logs,spans,
resources}` (OTLP-JSON), base-URL/api-key via `DASHBOARD_ENV_VARS` + `.netscript/e2e/aspire-start.
json`; generalize `telemetry-trace.ts.template`'s `fetchDashboardTraces()`; `streamLogs`→`?follow`
NDJSON. Port stays source-swap-stable for Topic-B.
**## SKILL:** baseline + `aspire` + (coordinate with) the telemetry-revamp epic owner.
**Validation:** adapter unit tests against a recorded OTLP-JSON fixture; contract test asserting
`parentSpanId` tree reconstruction (mirror `otel-gates.ts`).
**Gotchas:** in-memory only, 10k eviction — no dashboard-side persistence. Confirm `/api/telemetry/*`
stability posture (OQ-3) before hardcoding as long-term contract. Co-design the port with Opus-B.

## DDX-4 — plugins/dashboard thin plugin  · WSL Codex · medium
**Objective:** the thin plugin manifest + scaffold + E2E join (§1.1, §1.4).
**Deliverables:** `scaffold.plugin.json` (provider.kind `dashboard` + officialSource); `definePlugin`
public surface; `scaffold.ts`; `adapter/plugin.ts` (install/doctor/info/update/remove);
`adapter/resources/` typesafe codegen (#157 — no string templates); contract re-export;
`verify-plugin.ts`; join `scaffold.plugins`/`scaffold.runtime`.
**## SKILL:** baseline + `netscript-cli` (plugin scaffold/install mechanics, officialSource copy
path, dynamic-kind registration).
**Validation:** `deno task e2e:cli run scaffold.plugins`; confirm `netscript plugin install
@netscript/plugin-dashboard` registers kind with NO CLI core change.
**Gotchas:** follow the harness-observed streams layout (top-level `services/`, `contracts/`), not
doctrine-text nesting. `defaultRequiresDb/Kv:false` for beta.6 (prefs client-side).

## DDX-13 — Introspection endpoint (/_netscript/*)  · WSL Codex · medium
**Objective:** machine-readable dev introspection API (§3 panels 1/2).
**Deliverables:** JSON endpoint listing plugins/routes/jobs/topics/contract-versions, derived from
scaffold/registry (Nitro `/_nitro/tasks` pattern).
**## SKILL:** baseline + `netscript-cli` + `deno-fresh`.
**Validation:** endpoint contract test; consumed by DDX-6/DDX-7 fixtures.

## DDX-15 — Claude design-sync artifact + panel prototype  · Claude · Opus medium
**Objective:** the MANDATORY design-sync (§7).
**Deliverables:** `plugins/dashboard/.design-sync/` (config.json, conventions.md reusing NS One/
fresh-ui L0–L4, previews per panel + promoted block with real content, NOTES.md re-sync recipe) +
Fresh panel-shell prototype leveraging fresh-ui seams.
**## SKILL:** `netscript-harness` + `fresh-ui-horizontal` + `deno-fresh` + `netscript-doctrine`
(design read-only). Under the documentation/design-authoring exception (no `packages/`/`plugins/`
source — the `.design-sync/` tree + prototype are design artifacts).
**Validation:** OpenHands per-panel design review; `deno task --cwd <dashboard> build` closure
flatten produces ds-css-flat.css.
**Gotchas:** `srcDir` → real components, never `previews/` (A/02 trap). Flatten tokens + layout
objects + `-ns-*` utilities + component CSS (NOT tokens+ui only). Framework wiring stays WSL Codex.

## DDX-5 — Fresh build-console shell + app-registration + IA  · WSL Codex · high
**Objective:** the 7-panel shell + Aspire app registration (§3).
**Deliverables:** SidebarShell IA on fresh-ui + L3 blocks; dashboard registered as Aspire `app`
(DDX-1) or Seam-B fallback with `withHttpEndpoint`+`withBrowserLogs`; auto-launch, fixed port, live
updates; islands wired to core ports; consumes DDX-15 contract.
**## SKILL:** baseline + `deno-fresh` + `fresh-ui-horizontal` + `aspire`.
**Validation:** Fresh build + type-check; dashboard resource appears in `aspire start` (E2E).
**Gotchas:** prefer single multiplexed stream over many concurrent subscriptions (HTTP/1.1 6-conn
ceiling, A/05).

## DDX-6…12 — panels (one agent each)  · WSL Codex · medium (DDX-8 high)
Each panel brief = the acceptance criteria in `epic-and-issues.md` + `## SKILL` = baseline +
`deno-fresh` + `fresh-ui-horizontal` + (`aspire` for 6/10/11/12, telemetry-coordination for 8/9/11).
Validation = panel island type-check + a data-source fixture test + panel smoke in DDX-16.
- **DDX-8 (Flow/Trace) is high-effort and the flagship** — coordinate tightly with Opus-B; its
  render target is the Flow-B grouped trace. Do not start until DDX-3 + telemetry fan-in links land.
- **DDX-10 (Plugin Control)** exercises DDX-1 command `arguments` — the A2 interaction path.

## DDX-14 — CLI surface + auto-launch  · WSL Codex · low-medium
**## SKILL:** baseline + `netscript-cli`. Optional `--kind dashboard`/`BARE_PLUGIN_PACKAGE_ALIASES`
shortcut; auto-launch on dev run. Validation: CLI unit + E2E smoke.

## DDX-16 — E2E scaffold.runtime dashboard join + panel smoke  · OpenHands gate
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` with `dashboard` added alongside
workers/sagas/triggers/streams. This is the merge-readiness gate for the beta.6 core set — run at
evaluator/merge pass, not per intermediate loop (expensive).

---

## Sequencing for the supervisor

1. **Wave 1 (parallel, unblocked):** DDX-0, DDX-1, DDX-2.
2. **Wave 2:** DDX-3, DDX-4 (need DDX-2); DDX-15 (needs DDX-0). DDX-13 after DDX-4.
3. **Wave 3:** DDX-5 (needs DDX-0+DDX-4+DDX-15, soft DDX-1).
4. **Wave 4 (panels, parallel):** DDX-6, DDX-7, DDX-9, DDX-10, DDX-11, DDX-12, DDX-14. **DDX-8 gated
   on telemetry-revamp fan-in links + triggers bugfix.**
5. **Wave 5:** DDX-16 merge-readiness gate.

Each slice: branch `feat/dev-dashboard-<slice>`, commit-per-slice, push, PR comment, append
`commits.md`; IMPL-EVAL (OpenHands qwen 3.7 max) before the next dependent wave.
