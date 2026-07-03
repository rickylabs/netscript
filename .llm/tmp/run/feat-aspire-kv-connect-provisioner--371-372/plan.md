# Plan: Environment-aware shared cache/queue provisioner (#371 + #372)

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-aspire-kv-connect-provisioner--371-372`      |
| Branch         | `feat/aspire-kv-connect-provisioner` (PR-A); `feat/aspire-garnet-executable` stacked (PR-B) |
| Phase          | `plan`                                             |
| Target         | `packages/cli` (Aspire generator) + `packages/aspire` (config contract) |
| Archetype      | `6 - cli-tooling` (folds the small `packages/aspire` Archetype-1/2-style contract change) |
| Scope overlays | `service` (Aspire runtime work)                    |

## Archetype

Archetype 6 (CLI / Tooling): the dominant surface is the CLI's Aspire generator under
`packages/cli/src/kernel/templates/aspire/**` + kernel adapters. `packages/aspire/config.ts` is a
small additive contract change on an Archetype-2 package (verdict **Keep**); per the selection
rule the larger archetype governs the run and folds the smaller concern.

## Current Doctrine Verdict

- `@netscript/aspire`: **Keep** (Archetype 2) — "Rename helpers/ to role-named folders" (not in
  scope; additive schema change only).
- `@netscript/cli`: Archetype 6 v2 reference implementation (run `refactor-cli-doctrine-rewrite`).
  Changes must preserve the v2 shape (templates in `kernel/assets`, generators in
  `kernel/templates`, mutations in `kernel/adapters`).

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 (contract first) | The `CacheEntry`/topology schema seam lands before any generator branch. |
| A5 (wrap upstream) | Use SDK-native `addDotnetTool`/`addContainer`/endpoint references instead of hand-rolled provisioning. |
| A7/A11 (edges own IO) | Docker probing + token generation live in the generated `_aspire-compat` edge helper, not in generator logic. |
| A13 (typed vocabularies) | Backend selection is a typed enum dispatch, not stringly branches. |

## Goal

One environment-aware shared-cache/queue provisioner in the Aspire generator with two backend
arms, so multi-process NetScript apps get a real shared KV/queue on every host class with **no
app-code change**:

- **#371**: shared Deno KV Connect container resource (denokv image, http endpoint 4512,
  generated `DENO_KV_ACCESS_TOKEN`, `services__kv__http__0` + token injected into every
  `RequiresKv` consumer) — port of the historical `AddDenoKv`/`WithKvReference`.
- **#372**: Garnet as a self-provisioned dotnet-tool executable (tcp 6379, `GARNET_URI` injected)
  for Docker-less bare metal.
- **Shared**: config seam (`CacheEntry` engine/mode extension) + `Auto` environment-aware
  selection (Docker → container backend; Docker-less → Garnet executable) + the unified↔
  multi-process cache-provisioning switch (feeds #349): unified/local stays the zero-resource
  default; multi-process provisions the shared backend.

## Scope

- `packages/aspire/config.ts`: `CacheEngine` + `'DenoKv'`; cache-specific mode union
  `'Container' | 'External' | 'Executable' | 'Local' | 'Auto'` (Databases keep the existing
  2-value `ResourceMode`); `CacheEntry.ToolVersion?: string`; cross-reference validation for
  invalid engine×mode combos; schema tests.
- `packages/cli/.../register/generate-register-infrastructure.ts` + its template asset: DenoKv
  container branch, Garnet dotnet-tool executable branch, Local no-op branch, Auto runtime
  selection; `InfrastructureContext` gains a **cache consumer-env seam**
  (`cacheConsumerEnv`-style map: endpoint reference + explicit env pairs incl.
  `DENO_KV_ACCESS_TOKEN` / `GARNET_URI`).
- `generate-register-plugins.ts` / `generate-register-background.ts` /
  `generate-register-apps.ts`: consume the seam via ONE shared helper (emitted in
  `_aspire-compat`) instead of inlining injection — keeps the surface modular for the deferred
  Deploy-S4 apphost-compose weave.
- `_aspire-compat.ts.template`: `generateAccessToken()`, `isDockerAvailable()`, and the
  `applyCacheReference(...)` consumer-injection helper.
- `workspace-mutator.ts ensureSharedCache`: emit `Mode: 'Auto'` (environment-aware default) and
  support engine choice; DenoKv caches named `kv`.
- Generator unit tests (semantic, not snapshot) in `helpers/tests/`; e2e `scaffold.runtime` at
  merge-readiness; docs (CLI command docs + aspire README note incl. the
  `import '@netscript/kv/redis'` requirement).

## Non-Scope

- No `@netscript/kv` / `@netscript/queue` changes — SDK consumption verified working (research
  findings 5-7).
- No full #349 RFC-14 unified-mode work (process consolidation, queue roles) — only the
  cache-provisioning arm of that switch.
- No denokv-standalone-binary executable arm (Docker-less DenoKv); bare metal uses Garnet per
  #371's own constraint section.
- No changes to deployment-lane files (`kernel/adapters/aspire/` compose deploy target,
  `packages/config` deploy schema).

## Hidden Scope

- `generate-config-schema.ts` re-exports `CacheEntrySchema` into generated workspaces — enum
  additions flow into generated schema validation; generated-workspace type-check must stay green.
- `ensureSharedCache` currently hard-codes `{Engine:'Garnet',Mode:'Container'}`; changing its
  default changes what `plugin add` writes into EXISTING user projects on next run (append-only
  `??=`, so existing entries are not rewritten — verify in tests).
- Consumers currently `withReference(endpoint)` only; adding explicit env pairs must not break
  the Aspire dashboard resource graph (keep the reference AND add env).
- Generated permissions: KV Connect consumers need `--allow-net` (present in defaults) and
  `--unstable-kv` where `Deno.openKv` runs (already the case for KV consumers today).

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Two stacked PRs: PR-A = contract + DenoKv arm (+ Local default) → `Closes #371`; PR-B = Garnet dotnet-tool arm + Auto selection + `ensureSharedCache` default flip → `Closes #372`. | Same files are touched by both arms → parallel sub-PRs would conflict (netscript-pr rule: conflict-prone slices stay sequential); shared contract lands once in PR-A; each backend arm independently reviewable. |
| D2 | Garnet executable via SDK-native `addDotnetTool('…','garnet-server').withToolVersion(<pin>)` — not hand-rolled `.config/dotnet-tools.json` + `dotnet tool restore`. | SDK 13.4.4 has first-class dotnet-tool hosting with args/endpoints/waitFor (research F9); wrap-don't-reinvent (A5). #372's manifest ask predates this discovery; recorded as spec drift. Fallback if live semantics fail: `addExecutable('dotnet',['tool','run','garnet-server',…])` + emitted manifest. |
| D3 | DenoKv container arm ports the historical shape verbatim: `ghcr.io/denoland/denokv` (pinned tag, `latest` fallback), http endpoint name `http` targetPort 4512, bind mount `<data>/…`→`/data`, args `--sqlite-path /data/denokv.sqlite serve`, runtime arg `--init`, generated token in container env + every consumer. | Proven historical design (F8); matches `getDenoKvConnectionFromEnv` + `Deno.openKv` token contract (F5). |
| D4 | Consumer injection = endpoint `withReference` (dashboard graph) **plus explicit env**: `DENO_KV_ACCESS_TOKEN` for DenoKv; `GARNET_URI` (+`CACHE_PROVIDER=garnet`) for the executable arm. Injection goes through one `_aspire-compat` helper consumed by all register-* generators. | Explicit env decouples SDK detection from resource naming (today it only works because the cache is literally named `garnet`, F4/F6); single seam keeps the deferred Deploy-S4 apphost-compose weave from unwinding per-generator inline logic (coordinator requirement); mirrors the live eis-chat POC (F12). |
| D5 | `Auto` selection is decided at **apphost runtime** by `isDockerAvailable()` in `_aspire-compat` (probe container runtime, env-overridable via `NETSCRIPT_CACHE_MODE`), not at scaffold time. | `git clone && aspire start` must work on both host classes without regenerating; scaffold-time detection bakes in the dev machine's environment. |
| D6 | Engine×mode matrix: DenoKv = Local (default, no resource) / Container / Auto (docker→DenoKv container, else **Garnet executable cross-fallback**); Redis/Garnet = Container / External; Garnet additionally Executable / Auto. Invalid combos (e.g. Redis+Executable, DenoKv+External) fail cross-reference validation with actionable messages. | Encodes #371's "KV Connect needs Docker" constraint as typed selection instead of a runtime crash. |
| D7 | Access token generated at apphost runtime in `_aspire-compat` (crypto random, base64), injected via plain `withEnvironment`. | Matches historical helper; avoids coupling to SDK parameter/secret-store semantics for v1. SDK `addParameterWithGeneratedValue` upgrade noted as follow-up polish. |
| D8 | Topology switch v1 = the cache `Mode` seam + `ensureSharedCache` emitting `Mode:'Auto'`: unified stays `Local`/no-entry (zero resources, in-process KV); adding a KV-queue plugin (the thing that creates multi-process reality today, F4) provisions the environment-aware shared backend. No new top-level `Topology` field in v1. | The mutation seam that flips projects into multi-process already exists (`ensureSharedCache`); a parallel top-level flag would duplicate state and belongs to the #349 RFC proper. Recorded as deferred scope for #349. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| `addDotnetTool` live semantics (install location, offline) | safe to defer | Verified in the Garnet slice against a live `aspire start`; D2 names the fallback, which satisfies #372's literal ask — no rework either way (same config contract, same generator seam). |
| garnet-server ToolVersion pin value | safe to defer | Constant in `scaffold-versions.ts`; eis-chat proved 1.1.10; pick latest stable at slice time. |
| `CACHE_PROVIDER=garnet` belt-and-braces injection | safe to defer | Auto-detect already resolves via `GARNET_URI` (F6); include if e2e shows ambiguity. |
| denokv image tag pin vs `latest` | safe to defer | Constant next to the Garnet image pin in `generate-register-infrastructure.ts`. |
| redis-import presence in every generated RequiresKv entrypoint | safe to defer | Research OQ2; verified + fixed (if needed) inside the PR-B docs/templates slice. |
| Where the token surfaces for local debugging (dashboard masking) | safe to defer | D7 names the `addParameterWithGeneratedValue` upgrade as follow-up polish. |

No open decision forces rework if deferred; all rework-shaping choices are locked (D1-D8).

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| `addDotnetTool` behaves unexpectedly in 13.4.4 (install path, no network) | D2 fallback path (`dotnet tool run` + manifest) kept concrete; verify early in PR-B slice 1 with a live aspire start before building on it. |
| Endpoint-reference env naming differs from `services__<name>__<ep>__0` assumption | D4 explicit env carries the contract regardless; e2e asserts the consumer env, not the SDK's naming. |
| Docker probe false negatives/positives (docker installed but daemon down) | Probe = actual runtime liveness (`docker info`-equivalent) with short timeout; `NETSCRIPT_CACHE_MODE` env override documented as the escape hatch. |
| denokv container auth/proxy interaction with Aspire endpoint proxying | Historical AppHost ran the same shape successfully; validate live via aspire MCP (list_resources/console logs) mirroring the eis-chat method before IMPL-EVAL. |
| `ensureSharedCache` default change surprises existing projects | `??=` semantics preserve existing entries; unit test asserts no rewrite of an existing Cache entry. |
| Generated-output churn breaks scaffold.runtime e2e | Full `deno task e2e:cli run scaffold.runtime --cleanup` at merge-readiness for each PR (both change generated output). |
| Cross-fallback (DenoKv+Auto → Garnet exe) surprises users expecting KV Connect | Generated code logs the selected backend at apphost start; docs table states the matrix (D6). |
| Deferred Deploy-S4 apphost-compose weave collides later | Injection concentrated in one `_aspire-compat` helper + one `InfrastructureContext` seam (D4); slice plan flags which register-* files are touched so the coordinator can pre-sequence. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11/AP-25 (IO outside adapters/edges) | risk | Docker probe + token gen live in generated `_aspire-compat` (runtime edge) and generator code stays pure string assembly; CLI-side mutation stays in `kernel/adapters/plugin/workspace-mutator.ts`. |
| AP-18 (string-snapshot tests) | risk | Generator tests assert semantic fragments (method calls, env names, endpoint options) per existing test style, not whole-file snapshots. |
| AP-24 (switch-over-tagged-union) | risk | Backend dispatch keyed off the typed engine×mode matrix in one place; no stringly branching sprinkled across generators. |
| AP-19 (undocumented external tool requirements) | new | README/docs name the `garnet-server` dotnet tool + Docker/Docker-less matrix + `--unstable-kv`/`--allow-net` needs. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1/F-CLI-1/2 (file size) | yes | `generate-register-infrastructure.ts` grows; split cache-branch builders into a sibling module if >350 LOC adapter budget is threatened. |
| F-5/F-6/F-7 (surface/JSR/doc) | yes | `deno publish --dry-run` for `packages/aspire`; JSDoc on all new exported schema members. |
| F-10 (test shape) | yes | Semantic generator tests + schema tests. |
| F-CLI-22/23/24 (templates in assets, no giant literals, registry sync) | yes | Template changes stay under `kernel/assets/**`; TEMPLATE_KEYS untouched or updated in sync. |
| Static gates | yes | Scoped `run-deno-check/lint/fmt` on `packages/cli`, `packages/aspire` (`--ext ts,tsx`). |
| Runtime/Aspire validation | yes (touched) | Live `aspire start` resource checks via aspire MCP (kv container arm; garnet executable arm on this Docker-less Windows host = the real #372 environment). |
| Consumer gates | yes | Generated workspace `deno check --unstable-kv`; full `e2e:cli run scaffold.runtime --cleanup` per PR at merge-readiness. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `addParameterWithGeneratedValue` secret upgrade for KV token | create (polish debt) | D7; low severity. |
| Topology top-level flag (full #349 story) | none (tracked by #349) | D8 records the deliberate v1 boundary. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Schema tests | `deno test` on `packages/aspire` | New engine/mode matrix + validation messages pass |
| 2 | Generator unit tests | `deno test` on `packages/cli/src/kernel/templates/aspire/helpers/tests/` | Semantic assertions for all four branches + consumer injection |
| 3 | Static | `.llm/tools/run-deno-check.ts --root packages/cli --root packages/aspire --ext ts,tsx` (+lint/fmt wrappers) | green |
| 4 | Scaffold smoke | maintainer init + plugin add + `netscript generate` → inspect generated `register-infrastructure.mts` | Correct branch emitted per config |
| 5 | Runtime (aspire MCP) | `aspire start` on a generated project: (a) kv container mode w/ Docker, (b) garnet Auto mode on this Docker-less host | Resources Healthy; consumer env carries `services__kv__http__0`+token / `GARNET_URI`; cross-process enqueue→listen delivery (POC method) |
| 6 | Merge-readiness | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | exit 0, per PR |
| 7 | IMPL-EVAL | OpenHands qwen3.7-max, separate session | PASS |

## Dependencies

- Aspire TS SDK 13.4.4 surface (verified from generated `.aspire/modules/aspire.mts`).
- `garnet-server` NuGet tool (Microsoft-published; eis-chat proved v1.1.10).
- `ghcr.io/denoland/denokv` image availability.
- WSL Codex daemon for implementation slices; OpenHands for PLAN-EVAL/IMPL-EVAL.

## Drift Watch

- `addDotnetTool` semantics diverging from typings (would trigger D2 fallback → log drift).
- Endpoint env naming mismatch at e2e (would confirm D4's necessity → log observation).
- scaffold.runtime flakes unrelated to this work (db-init Prisma schema-engine flake is known —
  do not chase as regression).
- Deploy-S4 apphost-compose slice starting before PR-B merges (coordinator sequencing).
