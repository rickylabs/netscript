# PLAN-EVAL — fix-602-agentic-host-agnostic--host-agnostic

- Plan evaluator session: Claude · Opus 4.8 (opposite-family local PLAN-EVAL) / 2026-07-11
- Run: fix-602-agentic-host-agnostic--host-agnostic
- Surface / archetype: N/A — internal `.llm/tools/agentic/**` repository CLI helpers (not framework-layer)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | FAIL              | `research.md` exists and re-baselines against `origin/main` @ `720fcb7e` (verified current). But a load-bearing finding is wrong: Finding #2 asserts "Launcher, status, and resume already route WSL execution through the shared helpers." Spot-check contradicts it — `launch-codex-slice.ts:416` spawns `new Deno.Command('wsl.exe', …)` directly (streaming launch path), not via `wsl()`/`wslCd()`. Finding #3 ("the only remaining raw call is the `runCapture` gh-token probe") is true only for `runCapture` narrowly and hides `gh-token.ts:160` (`runWithStdin('wsl.exe', …)`) and the launcher spawn. |
| Decisions locked                        | PASS (narrow)     | D1–D4 stated with rationale. Caveat: D1 models the plan only for `runBin`/`runCapture` consumers and does not address a streaming `.spawn()` consumer (see Open-decision sweep). |
| Open-decision sweep                     | FAIL              | The sweep lists only WSL-detection and cross-user deferrals. It omits the decision that forces rework: how the remaining raw execution sites — `launch-codex-slice.ts:416` (streaming spawn) and `gh-token.ts:160` (`runWithStdin`) — become host-aware, and whether the pure `{bin,args,cwd}` plan must support a streaming consumer, not just await-full-output. Deferring this is not safe. |
| Commit slices (< 30, gate + files each) | FAIL              | Single slice, gate + files named. But the files list (`lib/agentic-lib.ts`, adjacent test, `README.md`) omits `codex/launch-codex-slice.ts` and `github/gh-token.ts`, so the slice cannot satisfy its own Validation step 4 ("Only the shared Windows plan literal remains") — raw `wsl.exe` literals persist at those two sites after implementation. |
| Risk register                           | PASS              | Risks + mitigations present (`plan.md` Risk Register). Note: the "A raw WSL call remains" risk is realized by the plan's own scope; mitigation ("repository-wide search") would surface the gap it under-scopes. |
| Gate set selected                       | PASS              | Archetype N/A → archetype-gate-matrix N/A. Validation gates (test / scoped check / scoped fmt / audit / dry-run E2E / lock hygiene) are appropriate for internal tooling. Step 4's expected result is currently unsatisfiable given scope — a scope defect, not a gate-selection defect. |
| Deferred scope explicit                 | FAIL              | Deferred Scope names distro selection + cross-user only. The launcher streaming spawn and the `gh-token.ts` login path are silently omitted — neither in scope nor explicitly deferred, and with no stated Linux-host behavior. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | Internal `.llm/tools/` tooling, not a published `packages/`/`plugins/` surface. `research.md` + `plan.md` both record N/A with reason. |

## Open-decision sweep (evaluator-run)

One decision that forces rework if deferred:

- **Host-aware conversion of the remaining raw execution sites.** The goal is "all agentic-suite
  WSL command dispatch works from Windows and from inside Linux/WSL," but two genuine execution
  primitives remain out of scope and hardcode `wsl.exe`:
  - `.llm/tools/agentic/codex/launch-codex-slice.ts:416` — `new Deno.Command('wsl.exe', …).spawn()`
    (the real launch; dry-run stops at line 371 and never reaches it, which is why the plan's
    dry-run validation would falsely pass). This consumer needs streaming stdout, so the pure
    `{bin,args,cwd}` plan (D1) must be usable by a `.spawn()` path, not only `runBin`/`runCapture`.
  - `.llm/tools/agentic/github/gh-token.ts:160` — `runWithStdin('wsl.exe', …)` for `gh auth login`.
  On a Linux host both throw (no `wsl.exe`), so the goal is not met, and both keep raw `wsl.exe`
  literals that make Validation step 4 unsatisfiable. This must be resolved (bring into scope) or
  explicitly deferred with a stated Linux-host behavior and a reworded goal/audit — deciding it
  after slicing means reworking D1 and the slice.

Display-only strings (not execution, but will misrepresent the command on a Linux host):
`launch-codex-slice.ts:343` and `:366`, and `codex-resume.ts:150` (real exec there routes through
`wsl()` at line 156). Not blocking on their own, but should be acknowledged where the above is resolved.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **Correct the research findings.** Re-state Finding #2/#3 to enumerate *every* raw `wsl.exe`
   execution primitive: `agentic-lib.ts:84,100,936`, `gh-token.ts:160` (`runWithStdin`),
   `launch-codex-slice.ts:416` (streaming `Deno.Command`); and note the display-only literals at
   `launch-codex-slice.ts:343,366` and `codex-resume.ts:150`. Finding #2's "launcher already routes
   through shared helpers" is false for the actual launch spawn.
2. **Resolve the streaming-spawn open decision.** Either (a) bring `launch-codex-slice.ts:416` and
   `gh-token.ts:160` into scope with a host-aware plan that a `.spawn()` streaming consumer can use
   (extend D1 beyond `runBin`/`runCapture`), or (b) explicitly defer them with rationale, a stated
   Linux-host behavior (e.g. "launcher unsupported from a Linux host until follow-up #NNN"), and a
   reworded Goal so "all dispatch" is no longer claimed.
3. **Make the slice and audit gate self-consistent.** Update the slice's files list and Validation
   step 4 so that "Only the shared Windows plan literal remains" is actually achievable under the
   chosen scope — as written it is contradicted by the two out-of-scope raw sites.
4. **Make deferred scope explicit** for any site intentionally left raw, including its Linux-host
   behavior, rather than omitting it silently.

## Notes

- Baseline verified: `origin/main` = `720fcb7e3b762c1e9ee5bf51a1371bfeeb6be22f`; branch HEAD
  `56b12136` (plan-lock commit); tree clean.
- The in-scope trio (`wsl()`, `wslCd()`, gh-token `runCapture` probe) and decisions D1–D4 are sound
  for what they cover; the failure is scope completeness and research accuracy, not the modelling of
  the pure plan itself. Fixing the four items above should be a plan edit, not a redesign.
- Loop status: first `FAIL_PLAN` cycle; one remaining before user escalation.
