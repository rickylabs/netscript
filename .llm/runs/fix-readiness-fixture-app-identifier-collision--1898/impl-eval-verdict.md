# IMPL-EVAL verdict — fix-readiness-fixture-app-identifier-collision--1898

PASS_IMPL

## Identity

| Field | Value |
| --- | --- |
| Head judged | `09e7b24b5fd2d4c2b24d018be81e93bc295afa89` (detached worktree `007-eval-1898`, clean) |
| Commit trail | RED `ad53835ee` (tests only) → GREEN `38dab6c79` → evidence `09e7b24b5` (artifacts only) |
| Lane | IMPL-EVAL, OpenRouter third-opinion route (`workflow/lane-policy.md`), separate session from generator and from the prior native Fable IMPL-EVAL (`230754ce-4127-481d-9dc6-b728a1e95b0a`) |
| Model — requested | `z-ai/glm-5.3-flash`, IMPL preset (max) per lane policy |
| Model — observed | `z-ai/glm-5.3-flash` on Claude Code; real reasoning trace and verified agentic turn (20+ tool calls this session) per protocol D-4; effort attested as the preset binding, no separate effort knob on this transport |
| Baseline | `7d18ef104824734932b5eac247637f4b9c770579` (PR base) |
| Runtime gate | `deno task e2e:cli` **NOT RUN** — prohibited by the leaf brief (no runtime lease, contended hosted lane). Per the brief this absence is explicitly **not** a FAIL reason; hosted two-tier proof remains supervisor-owned in #1858/#1885 integration. |

## Findings

| # | Question | Verdict | Evidence (command → observed) |
| --- | --- | --- | --- |
| F1 | Defect reproduces at RED; RED has zero product files | **CONFIRMED** | `git diff-tree -r ad53835ee --name-only` → 8 run-artifact files + 1 test file, **no product file**. RED extracted via `git archive ad53835ee` to `.llm/tmp/eval-1898-f1/` and the focused suite run there: wrapper exit `1`, `passed 4, failed 1, uniqueFailures 1`, failure = `duplicateConstBindings` = `["app_0_workdir","app_0","app_0_otel"]` — exactly the worklog's claim. |
| F2 | Collision gone on a multi-app host, any duplicate name | **CONFIRMED** | Probe `.llm/tmp/eval-1898-f2/probe-fix.ts` (real generator + real injector, worktree head): Host A (app + task + desktop, 3 apps, host declares `app_0..app_2` + `_workdir/_otel/_build`): duplicates `[]` incl. `let`/`var`. Host B (11 task apps, host declares `app_0..app_10` two-digit boundary): duplicates `[]`. Host E (tauri + app): duplicates `[]`. |
| F3 | No dangling references; partial rename cannot pass | **CONFIRMED** | Host A/B/E: every `readiness_fixture_*` referenced is `const`-declared (probe scan) and `deno check` passes. Mutation probe `probe-mutation.ts`: rename misses one `_otel` usage → `deno check` exit ≠ 0, `TS2304: Cannot find name 'app_0_otel'` — the committed compile assertion is a real guard, not decoration. |
| F4 | Emitted module parses (not string-count-only) | **CONFIRMED** | The committed test is **not** vacuous: `assertGeneratedModuleChecks` writes the injected source to a matching temp layout with typed stubs and runs `deno check --no-config`; `assertEquals(output.code, 0)`. Independently repeated on 4 host shapes (3-type diverse, 11-app, zero-app, tauri) — all `Check file:///…register-apps.mts`, exit 0. |
| F5 | Both fixture apps register; host untouched | **CONFIRMED** | Exact strings present: `apps.set("readiness-dead-port", readiness_fixture_app_0);` and `apps.set("listener-fault-controller", readiness_fixture_app_1);`; host registrations intact (`apps.set("api", app_0);` etc., `app_remote_0Endpoint` preserved). Pure-insertion proof: injected = `host[0:idx] + inserted + host[idx:]` at the first `  return apps;` — host prefix/suffix byte-identical, inserted text carries only fixture tokens. |
| F6 | Fail-closed on re-injection preserved | **CONFIRMED** | Re-injecting the raw injected output throws `readiness-dead-port fixture was already registered` (also with `includeListenerFaultController = false`, and the committed single-quote variant). Adversarial host containing an app literally named `readiness-dead-port` throws the same. |
| F7 | Ceiling and lock | **CONFIRMED** | `git diff 7d18ef104..HEAD --name-only` = exactly the two ceiling paths + 12 files under the run dir; nothing else. Generator untouched (empty diff), `listener-unreachable-fixture.ts` untouched, `REPORT_DEADLINE_MS` still `30_000`. `git rev-parse HEAD:deno.lock` = `origin/main:deno.lock` = `23cb256ba9f04168dda01dddfb493b480fb621f7` (origin/main = `e938ecd31`, matching the brief). PR head == judged head. |

Evaluator gates, run at head `09e7b24b5`:

| Gate | Result |
| --- | --- |
| `run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates` | exit 0 — passed 120, failed 0 |
| `run-deno-check.ts --root packages/cli/e2e --ext ts` | exit 0 — 190 files, 0 diagnostics |
| `run-deno-fmt.ts --root packages/cli/e2e --ext ts` | exit 0 — 190 files, 0 findings |
| `run-deno-lint.ts` (focused, touched dirs) | exit 0 — 36 files, 0 findings |
| Root e2e lint | not needed — the known `desktop-native`/`zod` REFUSAL baseline did not have to be crossed; focused lint used instead |

## What I tried that failed to break it

1. **Multi-app hosts (the F2 trap).** An index-offset fix passes one-app hosts and collides on two-app
   hosts; the shipped rename is host-count independent. Probed 3 diverse apps, 11 apps (two-digit
   `app_10`), tauri+app, and zero-app hosts — zero duplicates, zero dangling references, pure
   insertion every time.
2. **Regex-boundary attacks on the rename.** `namespaceFixtureAppBinding` uses
   `(?<![\w$])app_0(?=_|[^\w$]|$)` — derived identifiers (`_workdir`, `_otel`, `_build`,
   `app_remote_<n>Endpoint`), `$`-prefixed and digit-continued neighbors (`app_10`) all behave. The
   rewrite is block-local and the pure-insertion proof shows host text is never scanned.
3. **Partial-rename escape.** A rename that misses one usage produces `TS2304` under the committed
   compile assertion — the F3 failure mode cannot silently pass.
4. **Idempotency holes.** Raw-output re-injection, controller-less re-injection, and a host app that
   itself is named `readiness-dead-port` all throw fail-closed.
5. **Mechanism attack (see O1).** I tried to confirm the issue's SyntaxError story and instead
   refuted it — recorded below as an observation, since the F1–F7 questions still resolve.

## Blocking findings

None.

## Non-blocking observations

- **O1 — the issue's root-cause narrative is statically overstated (does not affect F1–F7).**
  Issue #1898 claims "a duplicate `const` is a SyntaxError in the emitted `.mts`", so fixture apps
  never registered. Host and fixture app blocks each live in their **own `if` block scope**
  (template: `if (config.Apps["…"]?.Enabled !== false) { const app_0 = … }`), so the duplicated
  names are sibling-scope declarations — legal JS/TS. Empirically: the **pre-fix** injector's
  output for the exact one-app host from the issue passes `deno check` with exit 0
  (`.llm/tmp/eval-1898-f1/eval-probe-prefix.ts`); the structure dump shows host `app_0` in one
  if-block and fixture `app_0` in a sibling. The text-level identifier collision is real (F1) and
  the fix removes it correctly, but the causal link "collision → module does not parse →
  listener never starts → ECONNREFUSED at 18999" is **not established** by this PR's evidence.
  Consequence: the deferred hosted runtime proof is not a formality — if the original
  `runtime.health.listener-unreachable` failure had a different cause, integration into
  #1858/#1885 may still fail. The RED test's own compile assertion was unreachable at RED (the
  duplicate-binding assertion aborts first), so RED proves the collision textually, not
  syntactically. Supervisor should weigh this when mirroring issue acceptance.
- **O2 — committed coverage is one-app-host.** The committed test exercises a single-app host;
  multi-app, two-digit-index, tauri, and zero-app shapes are only covered by this evaluation's
  scratch probes. Non-blocking because the fix is host-count independent by construction, but a
  second fixture app in the committed host input would close the gap cheaply later.
- **O3 — runtime gate not run.** `deno task e2e:cli` was prohibited for this session; no runtime
  receipt exists for head `09e7b24b5`. Explicitly not a FAIL reason per the brief; runtime proof
  comes with #1858/#1885 integration.
- **O4 — prior IMPL-EVAL concurrence.** A separate Fable session (`230754ce-…`) already posted
  `[PHASE: IMPL-EVAL] [VERDICT: PASS]` on PR #1899 with matching evidence (it cited `TS2552` for
  the same mutation class I reproduce as `TS2304` — same "cannot find name" class). This verdict is
  the independent OpenRouter third-opinion lane and concurs.
- **O5 — scratch artifacts.** Probe scripts live under `.llm/tmp/eval-1898-f2/` and the RED
  extraction under `.llm/tmp/eval-1898-f1/` (both gitignored, owner-controlled cleanup). No product
  code was edited and nothing outside this verdict was committed.

## Verdict basis

All seven deciding questions F1–F7 are CONFIRMED with command evidence at the judged head; the fix
is minimal, ceiling-compliant, fail-closed, and proven against the failure modes named in the brief.
The one substantive weakness (O1) attaches to issue #1898's diagnosis prose, not to the shipped
change, and the brief explicitly assigns the runtime proof to a later lane.
