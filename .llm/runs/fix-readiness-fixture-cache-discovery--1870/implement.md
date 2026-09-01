use harness

# Slice brief — #1870 · readiness fixture must discover the configured cache, not assume Garnet

**Lane:** Fixes (`orchestrator:fixes`) · **Priority:** p0 · **Milestone:** 0.0.7
**Route:** Codex · OpenAI · GPT-5.6 Sol · medium (`normal_implementation`, `lane-policy.md`)
**Worktree:** `/home/agent/projects/netscript/worktrees/007-leaf-1870`
**Branch:** `fix/readiness-fixture-cache-discovery`, already created at **`d2b33a09b`** (exact main).
**Run dir:** `.llm/runs/fix-readiness-fixture-cache-discovery--1870/`

Read `research.md` in this run dir first — it is the issue body and contains the full proven
diagnosis, the measured generator output, and an open anomaly you must address.

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. Also load:

- `.agents/skills/netscript-cli` — the CLI/scaffold/E2E command surface, gate names, and what
  `scaffold.runtime` actually executes.
- `.agents/skills/netscript-tools` — the structured validation wrappers, gate evidence rules, raw
  git verification, and lock hygiene. Wrapper output is the verdict; raw `deno check .` is not.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone conventions and the **closing-keyword
  obligation** (`Closes #1870` in the PR *body*; a bare `#1870` does not auto-close).
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`, and wrap `deno task` runs
  in `rtk proxy`.

`packages/cli/e2e` is repo tooling, not framework source, so the doctrine archetype gates do not
apply — but the no-`any` / no-`as unknown as` rule does. Type the discovery result explicitly.

## What is broken

`scaffold.runtime` and `scaffold.runtime.sqlite` are **blocked on `main`** at gate
`runtime.readiness-fixture`:

```
error: generated register-infrastructure helper has no garnet health-check marker
  at injectListenerFaultHealthChecks (prepare-readiness-fixture.ts:63:11)
```

The D-101 listener-fault fixture hardcodes a **Garnet** cache named `garnet` with health key
`garnet_resp`. A real `netscript init` with the E2E's own flags, run at exact `d2b33a09b`, emits:

```ts
const cache_0 = await builder.addContainer('redis', 'docker.io/library/redis:7')
builder.addHealthCheck('redis_resp', async () => { … });
await cache_0.withHealthCheck('redis_resp');
caches.set('redis', cache_0);
```

Resource name `redis`, binding `cache_0`, key `redis_resp`. The searched-for statement never exists.

## Scope — discover, do not re-hardcode

Discover the RESP health attachment from the **generated project's own**
`aspire/.helpers/register-infrastructure.mts` — the artifact the fixture already reads and patches —
instead of from a hardcoded backend or a hardcoded reference config.

The machinery already exists in `prepare-readiness-fixture.ts` (added by #1837):
`HEALTH_ATTACHMENT_PATTERN` captures both the resource binding and the quoted key;
`uniqueHealthAttachment` enforces uniqueness. The sibling `listenerReadinessExpectation`
(`listener-readiness-gates.ts:33-58`) already derives `healthCheckKey: \`${resource}_resp\``. Follow
that existing shape rather than inventing a new one.

Three things must be discovered together and stay consistent:
1. the **health-check key** actually attached to the RESP cache (`<name>_resp`),
2. the **resource binding** identifier used in the generated helper (`cache_0`, `garnet`, …),
3. the **Aspire resource name** the fault gate waits on (`caches.set('<name>', …)`).

Keep it **fail-closed**. Today's contract is "exactly the two test-only checks, beside exactly the
two known real ones". The new contract is "exactly the two test-only checks, beside the *discovered*
real ones" — not "any health check present in the file". Specifically:
- there must be exactly **one** RESP attachment; zero or several is an error, not a pick-the-first;
- the injected key must remain `TEST_ONLY_GARNET_HEALTH_KEY` / `TEST_ONLY_POSTGRES_HEALTH_KEY`;
- `assertOwnedListenerFaultExpectation` must still refuse any target that is not the injected
  test-only check paired with the discovered real one.

`ListenerFaultExpectation.controllerListener` is the *synthetic listener's* internal name; leaving it
`'garnet'` for the RESP arm is fine and is **not** a hardcode to chase. What must stop being
hardcoded is the real resource/key the fixture attaches beside.

## Ceiling — do not touch anything outside this list

```
packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts
packages/cli/e2e/src/application/gates/scaffold/runtime/listener-readiness-gates.ts
packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts
packages/cli/e2e/src/application/gates/scaffold/runtime/<new discovery helper>.ts        (optional)
packages/cli/e2e/tests/application/gates/prepare-readiness-fixture_test.ts
packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts
packages/cli/e2e/tests/application/gates/<new discovery helper>_test.ts                  (optional)
.llm/runs/fix-readiness-fixture-cache-discovery--1870/**
```

**Hard prohibitions.**
- **No change under `packages/cli/src/**`.** This is an E2E-consumer defect. The generator is
  behaving correctly; if you conclude otherwise, **stop and report** rather than editing it.
- **Do not** change `SCAFFOLD_DEFAULTS.CACHE_BACKEND`, and **do not** make the E2E scaffold with
  `--cache-backend garnet` to satisfy the hardcodes. That hides the defect: it leaves the default
  (`redis`) runtime path unexercised by the merge-readiness gate.
- **Do not** touch `runtime-gates.ts` / `runtimeResources()` / `verify-listener-readiness.ts`. The
  `runtime.wait.garnet` gate is a **separate** concern; if your change appears to require it, stop
  and report — do not absorb it.
- **Do not** modify `deno.lock`. If it moves, stop and report.
- **Do not** delete or strip any `.llm/runs/**` directory, including other leaves'.

## Collision map — read before editing

- **PR #1858** (`fix/garnet-readiness-timeout`, draft) also edits
  `listener-readiness-gates.ts` (a 3-line Garnet wait-timeout change) and its test. **#1870 lands
  first**; #1858 rebases onto it. Do not adopt, cherry-pick, or reference #1858's changes.
- **PR #1865** (`fix/flow-b-fixture-plugin-marker`) owns `prepare-flow-b-fixture.ts` and
  `locate-workers-resource-block.ts`. No overlap with your ceiling — leave them alone.

## Required RED → GREEN shape

1. **RED commit, tests only.** A test that reproduces the failure using **real generator output for
   the default cache backend** — i.e. generate `register-infrastructure.mts` content via
   `generateRegisterInfrastructure` with `buildCacheBlock(SCAFFOLD_DEFAULTS.CACHE_BACKEND)` (or the
   equivalent already used in the e2e tests) and assert the current code throws
   `no garnet health-check marker`. The RED commit must contain **zero product files**.
2. **GREEN commit.** The discovery fix.
3. Record both SHAs and the observed RED failure counts in `worklog.md`.

## Also required — resolve or explicitly record the open anomaly

`runtime.readiness-fixture` **and** `runtime.wait.garnet` both passed in run `33425281612` at head
`bd239f916` (base `8f1fcb2bc`) on 2026-08-31, and `runtime.wait.garnet` cannot pass without a real
garnet resource. Yet scaffolding locally at that same base yields `redis`. Two explanations were
tested and refuted (see `research.md`).

While reproducing, **capture the E2E-scaffolded project's actual `register-infrastructure.mts` cache
block** and write what you find into `worklog.md`. If it is garnet-backed, say so plainly and name
what makes the E2E scaffold differ — do not invent a cause. If you cannot determine it, say that
plainly too. **Do not close the anomaly by assertion.**

## Tests

- Prove discovery against real generator output for **both** `redis` and `garnet` cache backends.
- Prove the fail-closed refusal is preserved: a file with no RESP attachment, and a file with two,
  must both be errors.
- Keep the existing `listener-readiness-gates_test.ts` cases meaningful rather than deleting the
  ones that encoded the old hardcodes.

## Gates (run and record exit codes in `worklog.md`)

```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts
```

`packages/cli/e2e` is not `packages/**` framework source, so `quality:gate` is not required — but do
not introduce `any` or `as unknown as`; the discovery result should be a typed interface.

**Do not run `deno task e2e:cli`.** Runtime execution requires a coordinator-granted host lease that
this slice does not hold. Hosted CI proves the gate.

## PR

Open as **draft** with `status:impl`, milestone `0.0.7`, labels:
`type:fix, area:cli, area:aspire, area:tooling, gate:e2e, priority:p0, orchestrator:fixes, ci:full`.

Body must contain **`Closes #1870`** (a bare `#1870` does not auto-close), the RED/GREEN SHAs, the
gate exit codes, the ceiling you actually touched, and the anomaly finding. Add the
`## Definition of Done` checklist from the issue verbatim, unticked — the supervisor mirrors
acceptance; **do not hand-tick acceptance boxes**.

Then stop and report. Do not mark ready-for-review, do not merge, and do not request the runtime
lease yourself.
