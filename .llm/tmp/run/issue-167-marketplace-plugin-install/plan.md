# Plan: Issue #167 — Deno-native JSR plugin installer (marketplace foundation)

## Run Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `issue-167-marketplace-plugin-install`                       |
| Branch         | `feat/plugin-install-jsr-dx` (off `origin/main`)             |
| Phase          | `plan`                                                       |
| Target         | `packages/cli` + 5 `@netscript/plugin-*` packages + e2e      |
| Archetype      | ARCHETYPE-5 (plugin) for the 5 plugins; CLI/tooling for CLI  |
| Scope overlays | service (process spawn + JSR network)                        |

## Archetype

Two surfaces: (1) the **CLI** (`packages/cli`) gains a new install pipeline — tooling-package shape;
(2) the **5 plugin packages** each gain a published scaffolder entrypoint + a formalized manifest —
ARCHETYPE-5 (plugin). The plugin changes are additive to their public surface (new `./scaffold`
export + versioned manifest), so the plugin publishability rubric (`jsr-audit`) applies to each.

## Current Doctrine Verdict

Plugin architecture is governed by `docs/architecture/doctrine/`. This work makes the **plugin the
owner of its own scaffolding** (doctrine "wrap, don't reinvent"; plugin public surface owns its
contributions) and removes the maintainer-only source-copy path from the userland install — aligning
the published install with doctrine rather than the monorepo-checkout shortcut.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| Contract first | Define the published plugin protocol/manifest + `ScaffolderContext`/`ScaffoldResult` before any scaffolder. |
| Wrap, don't reinvent | Reuse `deno x`/`deno add`/JSR HTTP APIs + the existing `dispatchPluginVerb` runner; do not hand-roll a registry. |
| Drift is explicit | The kind→package naming + protocol shape are recorded; e2e blind spot is closed, not papered over. |

## Goal

A real userland `jsr:@netscript/cli` install can `netscript plugin add <kind>` for every official kind
(and any third-party JSR plugin) with no monorepo checkout: resolve → JSR-validate → protocol-validate
(static) → confirm (third-party) → run the plugin's own dx scaffolder under confined Deno permissions →
integrity-verify. Maintainer mode defaults `--local-path`; prod defaults JSR. All four tutorials become
completable end-to-end on the next published alpha, and the path is locked by a true-userland e2e gate.

## Scope

- **CLI**: kind→package resolver + bare-kind alias map (verified `@netscript` scope); JSR validator
  (`meta.json`, `<ver>_meta.json` exports + sha256, `api.jsr.io` metadata); **static** protocol
  validator; third-party confirmation gate (`--skip-confirmation`/`--ci`); confined-permission flag
  builder + first-party trust tier; scaffold-runner (extend `dispatchPluginVerb` to a `scaffold`
  verb); integrity verify + post-install scripts; `--dry-run` + change preview; flag symmetry
  (`--jsr-url`/`--local-path`); seed the kind registry from JSR-fetched manifests; keep the workspace
  mutators (appsettings/netscript.config/imports/Aspire regen).
- **Plugin protocol**: promote `scaffold.plugin.json` to a versioned, zod-validated, published
  contract; define `ScaffolderContext`/`ScaffoldResult` protocol interface (shared types).
- **5 plugins** (`workers`, `sagas`, `triggers`, `streams`, `auth`): each ships a dx-runnable
  `./scaffold` entrypoint emitting its artifacts (port from CLI `generatePlugin*`); `auth` also gains
  `./cli`. Each gets/keeps a conformant published manifest.
- **e2e**: new true-userland install gate (project outside any checkout; published-or-local CLI; real
  install of a plugin; assert artifacts present AND no plugin source copied into userland). Keep the
  existing `scaffold.runtime` maintainer-path green.

## Non-Scope

- Renaming packages to `@netscript/<kind>` (Option B) — deferred; backlog.
- A standalone `@netscript/plugin-protocol` package — deferred; backlog (inline manifest first).
- `market.netscript.dev` discovery portal / `plugin search` — roadmap Phase 3, backlog.
- Signature/provenance curation — roadmap Phase 2, backlog.
- `plugin remove`/uninstall command — backlog (design writes to deterministic paths to enable it).
- Tutorial doc rewrite (#144) — sequenced AFTER this lands on a published alpha (separate task).

## Hidden Scope

- `auth` is the outlier: no `./cli` and no `./scaffolding` today — its scaffolder is net-new, heavier
  than the other four; allot a dedicated slice.
- Removing the checkout-walk/copier path (`official-plugin-source.ts`, `official-plugin-copier.ts`)
  without hollowing `scaffold.runtime`: the e2e readers
  (`runtime-gates.ts`/`database-gates.ts`/`registry-generator-fixture.ts`) currently read copied
  trees; the maintainer `--local-path` scaffold must still satisfy them, or the readers move to the
  scaffolder-emitted artifacts. This is the trickiest wiring slice.
- Pre-publish vs post-publish: the prod `deno x jsr:` path can only be exercised after alpha.13 ships;
  pre-merge validation uses the maintainer `--local-path` path. Plan the e2e accordingly (local-path
  userland gate pre-merge; prod-JSR smoke post-publish via `e2e-cli-prod`).
- `--minimum-dependency-age=0` needed to install fresh alpha plugins past JSR's age guard; default-off
  for third-party (supply-chain), opt-in for the netscript scope/e2e.

## Locked Decisions

| ID  | Decision | Rationale |
| --- | -------- | --------- |
| D1  | Keep `@netscript/plugin-<kind>` names + bare-kind→package **alias map** in resolver (Option A) | Zero republish, no break to alpha.12 consumers; the alias map IS the verified-scope/typosquat guard (deep-search AP-3). Option B deferred. |
| D2  | First-party `@netscript/*` scaffolders run trusted; third-party run under confined permission matrix + confirmation gate | Both research streams rank Deno permission-scoping #1; first-party trust matches today's `dispatchPluginVerb`. |
| D3  | Protocol validation is **static** (read published manifest / `_meta.json` exports) — never execute plugin code to classify it | VS Code `contributes` precedent; avoids the "run untrusted code to validate it" hole. |
| D4  | Plugin owns scaffolding via dx `./scaffold` verb (extend `dispatchPluginVerb`); CLI is orchestrator, no embedded templates | User mandate (Q2 "same principle"); clean separation both streams endorse. |
| D5  | Scaffolders write deterministic, self-contained modules/config (append-once, idempotent); avoid AST-rewriting user-authored controllers/routes | Declarative-over-imperative (Gatsby/Convex/VS Code); avoids fragile AST mutation (AP-4); enables clean removal. |
| D6  | Confined flag matrix for third-party: `--allow-read=<root>`, `--allow-write="<root subdirs>"`, `--deny-net` (prompt to grant), `--deny-run` | Deep-search #1 pattern + grounding security model converge. |
| D7  | Add `--dry-run` (in-memory, log writes, no disk) + pre-write change preview; mandate idempotent re-run | Best-in-class DX (Nx dry-run, Astro diff) the design omitted. |
| D8  | Manifest = versioned, zod-validated, published `scaffold.plugin.json` (schemaVersion bump); inline per plugin | Contract-first; standalone protocol package deferred (D3-backlog). |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Naming convention (A vs B) | **Resolved now (D1)** | Would force resolver rework if deferred → locked to A. |
| Trust tier for `-A` (D2) | Resolved now | Drives the permission builder → locked. |
| Standalone `@netscript/plugin-protocol` pkg | Safe to defer | Additive; inline-first forces no rework. Backlog. |
| `plugin remove` / uninstall | Safe to defer | Deterministic-path writes (D5) keep it cheap later. Backlog. |
| Marketplace portal / signature curation | Safe to defer | Roadmap Phase 2–3; foundation is forward-compatible. Backlog. |
| Readers vs scaffolder-artifacts in `scaffold.runtime` | **Resolve in S5/S11** | Must not hollow the maintainer e2e; pick "maintainer scaffold satisfies existing readers" vs "readers move to emitted artifacts" during the wiring slice with evidence. |

## Commit Slices

| # | Slice | Proves | Gate | Files (indicative) |
| - | ----- | ------ | ---- | ------------------ |
| S1 | Plugin protocol contract: versioned zod manifest + `ScaffolderContext`/`ScaffoldResult` types | Contract exists, validates a sample manifest | check, lint, test, jsr-audit | `kernel/domain/plugin-kind.ts`, new `kernel/domain/plugin-protocol.ts`, manifest zod schema |
| S2 | CLI resolver + JSR validator (static) | bare/scoped resolution + meta.json/_meta.json/api.jsr.io fetch + protocol classify, all without executing plugin code | check, lint, unit tests w/ fixtures | `public/features/plugins/add/` resolver + `infra/jsr/*` |
| S3 | Confirmation gate + confined-permission flag builder + trust tier | third-party prompt + `--skip-confirmation`/`--ci`; first-party trusted; flag matrix correct | check, lint, unit tests | `add/confirm-*`, `infra/permissions/*` |
| S4 | Scaffold-runner (extend `dispatchPluginVerb` → `scaffold` verb) + integrity (sha256) + post-scripts + `--dry-run` + preview + `--jsr-url`/`--local-path` | end-to-end install pipeline runs a scaffolder under confined flags; dry-run writes nothing | check, lint, unit tests | `dispatch/dispatch-plugin-verb.ts`, `add/add-plugin.ts`, integrity module |
| S5 | CLI wiring: seed registry from JSR manifests; retire checkout-walk/copier from the userland path; keep workspace mutators | official kinds resolve with NO monorepo checkout; no source copy | check, lint, arch:check, `scaffold.runtime` (maintainer path stays green) | `add-plugin.ts:88-148`, remove reliance on `official-plugin-source.ts`/`official-plugin-copier.ts` |
| S6 | `plugin-workers` dx `./scaffold` entrypoint (port `generatePlugin*`) + manifest | maintainer `--local-path add workers` emits artifacts via dx | check, lint, test, jsr-audit, publish:dry-run | `plugins/workers/src/scaffold/*`, `deno.json` exports/bin |
| S7 | `plugin-sagas` dx `./scaffold` + manifest | same, sagas | same | `plugins/sagas/...` |
| S8 | `plugin-triggers` dx `./scaffold` + manifest | same, triggers | same | `plugins/triggers/...` |
| S9 | `plugin-streams` dx `./scaffold` + manifest | same, streams | same | `plugins/streams/...` |
| S10 | `plugin-auth` `./cli` + dx `./scaffold` + manifest (net-new, heavier) | auth scaffolds prisma/service/routes via dx | same | `plugins/auth/...` |
| S11 | True-userland e2e install gate + keep `scaffold.runtime` green | install outside any checkout; artifacts present AND no source copied; resolves the readers question | `e2e:cli` (new suite) + `scaffold.runtime` | `packages/cli/e2e/...`, `plugin-add-gates.ts`, `create-default-runner.ts` |
| S12 | Arch-debt + context-pack close + backlog records (D3/uninstall/portal) | run artifacts complete | manual | `.llm/harness/debt/arch-debt.md`, run dir |

≤ 12 slices. Each plugin slice is independent (parallelizable on the daemon). S1→S2→S3→S4→S5 are
ordered (CLI core); S6–S10 depend on S1 (protocol) + S4 (runner); S11 depends on S5 + ≥1 plugin slice.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Removing copier hollows `scaffold.runtime` (readers depend on copied trees) | S5/S11 explicitly resolve readers; keep maintainer `--local-path` scaffold satisfying readers OR migrate readers to emitted artifacts with evidence; `scaffold.runtime` must stay green every slice. |
| Prod `deno x jsr:` path only testable post-publish | Pre-merge validate via `--local-path`; post-publish prod-JSR smoke via `e2e-cli-prod` after alpha.13; do not claim prod-green pre-publish. |
| Confined permissions too tight → first-party scaffolders fail | D2 first-party trust tier; integration-test each plugin scaffolder under its declared permission set. |
| `--minimum-dependency-age` widens supply chain | default-off third-party; opt-in for netscript scope/e2e only. |
| Scaffolder non-idempotent → corrupts config on re-run | D5/D7 idempotency mandate + a re-run test in each plugin slice. |
| Bare-name typosquatting | D1 alias map resolves bare names to verified `@netscript` scope only; warn on unverified third-party. |
| Slow types break JSR publish of new exports | jsr-audit on each plugin slice + `publish:dry-run`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 Unsandboxed scaffolder run | risk | Avoid via D2/D6 confined permissions. |
| AP-2 Non-idempotent injection | risk | Avoid via D5/D7 + re-run tests. |
| AP-3 Scope hijack / typosquat | risk | Avoid via D1 verified-scope alias map + warnings. |
| AP-4 Fragile user-file AST mutation | existing risk in old generators | Resolve via D5: emit self-contained modules; keep only append-once idempotent config wiring. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| `deno check --unstable-kv` (scoped wrapper) | yes | `run-deno-check.ts` compact PASS per changed root |
| `deno lint` (scoped) | yes | `run-deno-lint.ts` PASS |
| `deno fmt --check` (scoped, ts/tsx only) | yes | `run-deno-fmt.ts` PASS |
| `deno task test` (CLI + plugins units) | yes | resolver/validator/permission/integrity/idempotency unit tests green |
| `deno task arch:check` | yes | no new doctrine violation |
| `jsr-audit` per changed plugin surface + `publish:dry-run` | yes | publishable; no slow-type/surface regressions |
| `e2e:cli scaffold.runtime --cleanup` (maintainer path) | yes | stays green every slice |
| `e2e:cli <new userland-install suite>` | yes (new) | install outside checkout: artifacts present, no source copied |
| `e2e-cli-prod` (prod-JSR) | yes (post-publish) | after alpha.13: official kind installs from JSR |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `#67 dynamic plugin→package registry` | close/supersede | This program is the realized form. |
| `CRON-SUBSYSTEM-DUP` | none | Unrelated. |
| Standalone `@netscript/plugin-protocol` pkg | create (backlog) | Deferred D3. |
| `plugin remove`/uninstall | create (backlog) | Deferred. |
| Marketplace portal + signature curation | create (backlog) | Roadmap Phase 2–3. |

## Validation Plan

| Order | Gate | Command or check | Expected |
| ----- | ---- | ---------------- | -------- |
| 1 | check | `run-deno-check.ts --root packages/cli --root plugins/<p> --ext ts,tsx` | PASS |
| 2 | lint | `run-deno-lint.ts --root … --ext ts,tsx` | PASS |
| 3 | fmt | `run-deno-fmt.ts --root … --ext ts,tsx` | PASS |
| 4 | test | `deno task test` (CLI + plugin units) | PASS |
| 5 | arch | `deno task arch:check` | PASS |
| 6 | jsr | `jsr-audit` + `deno task publish:dry-run` | publishable |
| 7 | e2e (maintainer) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | passed, 0 failed |
| 8 | e2e (userland) | new suite (project outside checkout, `--local-path`) | artifacts present, no source copied |
| 9 | e2e (prod, post-publish) | `e2e-cli-prod` after alpha.13 | official kind installs from JSR |

## Dependencies

- Deno 2.9 (`deno x`, permission flags) — confirmed present.
- JSR registry HTTP APIs (`jsr.io`, `api.jsr.io`) — confirmed shapes.
- Publishing alpha.13 (via `deno task release:cut`) to validate the prod-JSR path post-merge.
- Implementation lane: WSL Codex daemon-attached slices (framework source). PLAN-EVAL: OpenHands
  minimax-M3. IMPL-EVAL: OpenHands qwen3.7-max. (Harness delegation contract.)

## Drift Watch

- If S5 forces migrating `scaffold.runtime` readers off copied trees → log as `significant` drift.
- If a plugin's artifacts can't be emitted idempotently via dx without AST-editing user files → log
  and reconsider D5 for that plugin.
- If JSR API shapes differ from grounding at impl time → log and adjust the validator.
- If naming Option A alias map proves insufficient (e.g. collision) → log; do not silently adopt B.
