# Evaluation: #1452 Slice 3 — reusable `PluginServiceContext` host factory (PR #1944)

Formal IMPL-EVAL, native opposite-family route (Claude · Fable 5.1 session, separate from the
Codex implementation session, per `.llm/harness/workflow/lane-policy.md`). Read-only on product
code; this file is the only write made by this session. Nothing committed or pushed.

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-s3--1452` |
| PR | #1944 `feat(plugin): publish reusable PluginServiceContext host factory` → `main`, OPEN, not draft |
| Evaluated head | `e703a5ebc7272d1b636192110b73745596751d1e` — `git rev-parse HEAD` in `/home/agent/projects/netscript/worktrees/007-leaf-1452-s3` and PR `headRefOid` both match |
| Trusted base | `850cc7757` (`origin/main`, "fix(docs): repair the README fence debt…" #1935) |
| Product commits | `18ace6ac3` (feature + tests + auth guard); `8cd55070d`, `e703a5ebc` are run-artifact carriers only |
| Evaluator identity | Claude Code, model `claude-fable-5-1`, 2026-09-02; generator was Codex (GPT-5.x) — generator ≠ evaluator invariant holds |
| Labels / milestone | `status:impl-eval`, `area:plugins`, `wave:v1`, `type:feat`, `priority:p2`, `orchestrator:features` · milestone `0.0.7` |

## Scope check

`git diff --name-only 850cc7757..e703a5ebc`:

- `packages/plugin/src/sdk/runtime/plugin-service-context.ts` (+2: `readonly appsettings?: unknown`)
- `packages/plugin/src/sdk/runtime/plugin-service-context-factory.ts` (async factory, optional `getAppsettings`/`getEnvironment`)
- `packages/plugin/src/sdk/runtime/plugin-service-context-factory_test.ts` (extended + new default-env test)
- `packages/plugin/src/sdk/runtime/plugin-service-context-generated-consumer_test.ts` (new boot test)
- `plugins/auth/services/src/init.ts` (structural narrowing guard)
- `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` (generated carrier, permitted)
- eight `.llm/runs/feat-plugin-service-context-s3--1452/*.md` artifacts

Nothing under `packages/cli` (`git diff --stat origin/main..e703a5ebc -- packages/cli` is empty), so no
collision with #1664 / Slice B #1943. `packages/plugin/deno.json` diff: **0 lines**. `deno.lock` diff:
**0 lines**.

## Judgement 1 — does `Closes #1452` hold?

Issue #1452 read live (`gh issue view 1452`): OPEN, milestone 0.0.7, four acceptance rows as plain
bullets (no checkboxes — the PR's stated reason for omitting an `acceptance-evidence` block is
correct; `close-gate` is already **pass** on this head).

| # | Acceptance row | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Generic host-context factory covering lazy DB/KV, contracts, logger, env, appsettings | PASS | `plugin-service-context-factory.ts` `createPluginServiceContext` (now `async`): `db.getClient` = `memoizeAsyncResolver(getDatabaseClient)`; `kv = new LazyPluginServiceKv(getKv)` (memoised inside the class, unchanged from S1/S2); `contracts.base = baseContract`; `logger = createPluginLogger(pluginName)`; `env`; `appsettings`. `plugin-service-context.ts` adds `readonly appsettings?: unknown`. Test `createPluginServiceContext resolves assembly values once and adapters lazily` asserts db/kv resolutions are 0 before and after `await`, exactly 1 after two concurrent uses, and appsettings/env resolutions are exactly 1 before the promise settles. |
| 2 | Consumer override points for project DB adapters and environment resolution | PASS | `getDatabaseClient` (required) is the DB override; new `getEnvironment?: () => Promise<Readonly<Record<string,string>>>` overrides env, with `Deno.env.toObject()` only as the fallback (`?? Promise.resolve(...)`). Tests: `assertStrictEquals(context.env, environment)` for an injected env; `captures Deno.env by default` for the fallback and `appsettings === undefined`. Auth (`init.ts:28`) and sagas (`main.ts:55`) merge `{ ...Deno.env.toObject(), ...ctx.env }`, so an injected env wins end-to-end. |
| 3 | Generated-consumer test proving workers/auth/sagas boot with the public factory | PASS | `plugin-service-context-generated-consumer_test.ts` — see Judgement 3. Ran independently: `1 passed, 0 failed`, exit 0. |
| 4 | CLI scaffold delegates to the seam instead of emitting a full `LazyPluginKv` | PASS (shipped in #1842, re-proven here) | `packages/cli/src/kernel/assets/plugins/service-context.ts.template` imports `createPluginServiceContext as createHostPluginServiceContext` from `@netscript/plugin/sdk` and returns `createHostPluginServiceContext(pluginName, { getDatabaseClient, getKv })`; no `LazyPluginKv` body. The boot test materialises this exact, unchanged template and executes it, so delegation is proven at runtime, not just by string inspection. |

All four rows have code + test evidence. `Closes #1452` is **not** an overclaim.

## Judgement 2 — binding invariant

- `git diff 850cc7757..e703a5ebc -- packages/plugin/deno.json` → **empty**. Imports remain only
  `@netscript/contracts@0.0.6` and `@netscript/service@0.0.6` (plus std).
- `grep` over non-test `packages/plugin/src` for `@netscript/kv|config|aspire` or `kv/mod` imports:
  the single hit is the JSDoc `@example` line in the factory (`import { getKv } from '@netscript/kv'`),
  which is documentation, not a module edge.
- The boot test's relative imports into `packages/kv` and `plugins/*` live in a `_test.ts` file,
  which `deno publish` excludes (dry-run listing in worklog; test files are not in `exports`).
- MCP export corpus: `check:mcp-export-corpus` exit 0, 35 packages / 273 subpaths / 7816 symbols,
  SHA `628133…5d7c` matches the committed carrier.

Invariant holds.

## Judgement 3 — the boot test is real

Read `plugin-service-context-generated-consumer_test.ts` in full and ran it in isolation
(`deno test --allow-all <file>`: `ok | 1 passed | 0 failed`, exit 0, with service startup and
"Service shutdown completed" logs for sagas/auth/workers visible in captured output).

What it does: creates a temp fixture dir under `plugins/auth/`, copies the **unchanged** CLI
template to `services/_shared/plugin-service-context.ts`, writes a stub `database/mod.ts`, sets
`PORT=0`, `NETSCRIPT_AUTH_BACKEND=kv-oauth`, a base64 `NETSCRIPT_AUTH_KV_OAUTH_KEY`,
`NETSCRIPT_SAGA_STORE=kv`, opens in-memory Deno KV, dynamically imports the generated module, then
for workers → auth → sagas calls the real default-export factory from `plugins/*/services/src/main.ts`
(which go through `createPluginService(...).serve()` → `Deno.serve` with `onListen` in
`packages/service/src/builder/service-listener.ts:104-116`), asserts `addr.transport === 'tcp'` and
`addr.port > 0` (a bound ephemeral listener), requests `/health` and asserts 200 with
`status: 'healthy'`, and in `finally` stops all three services in reverse order, closes KV,
restores the four env keys, and removes the fixture. Post-run `git status --short` is clean and no
`plugins/auth/.generated-service-context-*` directory remains.

This is a genuine start → ready → stop lifecycle, not a shape test. See L1 for one nuance.

## Judgement 4 — auth guard

`plugins/auth/services/src/init.ts`: `initializeAuthService` and `serviceAppsettings` now take the
generic `PluginServiceContext`; `appsettings` is narrowed through `isAuthServiceAppsettings`, whose
structural checks (`auth`/`Auth` groups; optional string `backend`/`Backend`; `audit.salt` /
`Audit.Salt` optional string; `environment`/`Environment` string record) mirror
`AuthServiceAppsettings` in `backend-registry.ts:32-44` field-for-field. No `as` cast, `any`, or
lint suppression remains in the changed files. Behaviour for well-formed settings is identical;
malformed settings now degrade to `undefined` (previously a trusting cast) — a strictly safer
narrowing. `plugins/auth` tests: 27 passed, 0 failed.

## Gates (independent re-run, this session, all from the worktree at `e703a5ebc`)

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| Type-check plugin | `run-deno-check.ts --root packages/plugin --ext ts,tsx` | 0 | 158 files, 2 batches, 0 diagnostics |
| Tests plugin | `run-deno-test.ts -- --allow-all packages/plugin` | 0 | 97 passed, 0 failed, 0 ignored |
| Tests auth | `run-deno-test.ts -- --allow-all plugins/auth` | 0 | 27 passed, 0 failed, 0 ignored |
| Boot test alone | `deno test --allow-all …generated-consumer_test.ts` | 0 | 1 passed, 0 failed (36 ms) |
| README fences | `deno task docs:readme-fences` | 0 | PASS, `type_errors=7` (baseline 7, unchanged) |
| JSDoc examples | `deno task docs:jsdoc-examples` | 0 | PASS, failures=0, deferred `unboundName=116` (baseline 116, unchanged) |
| MCP corpus | `deno task check:mcp-export-corpus` | 0 | 7816 symbols, SHA matches committed carrier |
| doc-lint A/B | `run-deno-doc-lint.ts --root packages/plugin` at head vs a detached `origin/main` worktree | 1 / 1 | head 15 `privateTypeRef` / base 15 — **0 new diagnostics** (pre-existing baseline) |
| `deno.json` / `deno.lock` | `git diff 850cc7757..e703a5ebc -- packages/plugin/deno.json deno.lock` | — | 0 lines each |
| PR CI | `gh pr checks 1944` | — | build, check-test (10m33s), quality, code-quality, close-gate, core CI lane visibility all **pass**; scaffold lanes path-skipped |

Not run per brief: Aspire, Docker, browser, `e2e:cli`.

## Findings (severity-ranked)

No blocking findings.

- **L1 (low, non-blocking)** — The boot test proves the listener is bound (`addr.transport === 'tcp'`,
  `addr.port > 0`) but observes `/health` through `running.app.request('/health')` (in-process Hono
  dispatch) rather than `fetch('http://…:port/health')`. The same app object backs the listener,
  so the assertion is meaningful, but a socket-level probe would close the last gap. Follow-up
  candidate, not a defect against #1452's wording ("boot with the public factory").
- **L2 (low, pre-existing)** — `plugins/auth/services/src/main.ts:102` `hasAuthAppsettings` narrows
  via `'appsettings' in ctx` to `AuthPluginServiceContext`. With the base now declaring
  `appsettings?: unknown`, that guard is type-unsound (a non-object salt could type as `string`).
  Optional chaining keeps it runtime-safe; it predates this slice and is the same debt the prior
  evaluator noted. Recommend routing it through `isAuthServiceAppsettings` in a later fix slice.
- **L3 (info)** — The boot test writes its fixture inside `plugins/auth/` (so the generated module
  resolves `@netscript/plugin/sdk` via that package's import map). Cleanup is in `finally` and
  verified clean after the run; acceptable.

## Verdict

All four live #1452 acceptance rows are satisfied with code and test evidence; the closing keyword
is justified; `@netscript/plugin` takes no concrete KV/config/Aspire dependency and its `deno.json`
is byte-identical to base; the generated-consumer test genuinely boots and tears down the real
workers/auth/sagas services through the unchanged CLI template; the auth change is a safe
structural narrowing with no cast left; every requested gate re-ran green or baseline-flat with
zero new diagnostics; scope excludes `packages/cli`.

[PHASE: IMPL-EVAL] [VERDICT: PASS]
