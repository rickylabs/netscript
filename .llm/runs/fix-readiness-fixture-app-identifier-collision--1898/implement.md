use harness

# Leaf brief — #1898 · fixture app injection collides with positional app identifiers

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1898`
- Branch: `fix/readiness-fixture-app-identifier-collision` @ **`7d18ef104`** (exact `main` at dispatch)
- Run dir: `.llm/runs/fix-readiness-fixture-app-identifier-collision--1898/`
- Push: explicit refspec — `git push origin HEAD:refs/heads/fix/readiness-fixture-app-identifier-collision`
- Closes exactly **#1898**. Priority **p0** — it is the last gate blocking `scaffold.runtime`.

## SKILL

Harness workflow per `.agents/skills/netscript-harness` + `.llm/harness/`; also
`.agents/skills/netscript-cli` (E2E gate surface), `.agents/skills/netscript-tools` (structured
wrappers are the verdict source), `.agents/skills/netscript-pr`.

## The defect — already proven, do not re-derive

Read `gh issue view 1898` in full. Summary:

`injectReadinessFixtureApps` (`prepare-readiness-fixture.ts`) generates its two fixture apps by
calling `generateRegisterApps` **in isolation** and splices the emitted blocks into the project's own
`register-apps.mts`. Since #1837 the apps generator names identifiers **positionally**
(`app_${appIndex}`), and isolated generation starts at index 0 — so it re-declares identifiers the
host module already has:

```
const app_0 = builder.addExecutable("app", ...);                    <-- project
const app_0 = builder.addExecutable("readiness-dead-port", ...);    <-- COLLISION
const app_1 = builder.addExecutable("listener-fault-controller", ...);
```

A duplicate `const` is a **SyntaxError** in the emitted `.mts`, so the fixture apps never register,
`listener-fault-controller` never binds **18999**, and `runtime.health.listener-unreachable` fails
with `ECONNREFUSED at localhost:18999`.

This was reproduced by running the real generator and the real injector against a realistic one-app
project. You should reproduce it yourself as your RED, not take it on trust.

## Required change

Give the injected blocks an identifier namespace that **cannot** collide with the host module.

- **Preferred:** rewrite the sliced block's identifiers to a fixture-specific namespace. Note the
  blocks reference **suffixed** identifiers too — `app_0_workdir`, `app_<n>_otel` and any others — so
  the rename must cover the whole block consistently, not just the `addExecutable` line. A partial
  rename produces a module that parses but references an undeclared symbol, which is worse than the
  current loud failure.
- **Acceptable but weaker:** offset the fixture generation index past the host's app count. Reject
  this if you cannot guarantee the host count is stable between generation and injection — a silent
  future collision is exactly the class of defect being fixed.

**Do not** change `generate-register-apps.ts`. Its positional naming is #1837's intent and other
consumers now depend on it. If you conclude the generator must change, stop and report.

## Required RED → GREEN

1. **RED, tests only, zero product files.** Build a realistic host `register-apps.mts` from
   `generateRegisterApps` (a project with at least one app), run `injectReadinessFixtureApps` on it,
   and assert **no duplicate `const` declaration** — which must fail today. Use **real generator
   output**, never a hand-written fixture string; a hand-written host is exactly how this class of
   defect keeps escaping.
2. **GREEN.** The namespace fix.
3. Record both SHAs and observed RED counts in `worklog.md`.

## Tests — the parse check is the load-bearing one

- No duplicate `const` after injection, over real generator output.
- **The emitted module actually parses/type-checks after injection.** Asserting only that the text
  changed would pass a partial rename that leaves a dangling reference. This is the assertion that
  makes the fix real.
- Both fixture apps still register under their correct resource names
  (`apps.set("readiness-dead-port", …)`, `apps.set("listener-fault-controller", …)`).
- Injection remains idempotent-safe: re-injecting still throws rather than silently duplicating.

## Ceiling

```
packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts
packages/cli/e2e/tests/application/gates/prepare-readiness-fixture_test.ts
.llm/runs/fix-readiness-fixture-app-identifier-collision--1898/**
```

**Do not** modify `deno.lock` — stop and report if it moves. **Do not** run `deno task e2e:cli`; you
hold no runtime lease and the hosted lane is contended. **Do not** touch
`listener-unreachable-fixture.ts` or its 30 s `REPORT_DEADLINE_MS` — that window is pre-existing and
is **not** the cause; adjusting it would mask this defect.

## Gates (record exit codes)

```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts
```

A root e2e lint **REFUSAL (exit 2)** from the detached `desktop-native` fixture missing catalog `zod`
is a known pre-existing baseline — record it as REFUSAL, never PASS, and use the focused lint on the
touched directory instead.

## PR

Open a **draft** on your first commit with `status:impl`, milestone `0.0.7`, labels
`type:fix, area:cli, area:tooling, area:aspire, gate:e2e, priority:p0, orchestrator:fixes, ci:full`,
body containing **`Closes #1898`** verbatim plus the RED/GREEN SHAs, gate exit codes and the ceiling.
Leave the DoD unticked — the supervisor mirrors acceptance; never hand-tick.

Reply with the GREEN SHA, the PR number and gate exit codes. Do not mark ready, do not merge.
