use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`. You are the
Codex · GPT-5.6 Sol · high implementation thread for the **corrected** S6 (#1718 / PR #1743)
reconstruction onto exactly-shipped main. Worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s6-v2`, branch
`chore/aspire-13-5-s6-listener-transplant-v2` @ `2a1248d33d55` (= shipped main). No runtime, no
AppHost, no containers, no evaluators, no CI dispatch. Explicit-refspec push.

## Audit correction (supersedes an earlier, rejected attempt — do not repeat its mistakes)

A prior attempt tried a narrow "extract only the listener gate, exclude the runtime module split"
transplant and got stuck mid-cherry-pick. That approach is **wrong** and is abandoned (its 3
commits are preserved only as rejected audit history, tag
`aspire-13-5-s6-transplant-rejected-audit`, not part of your work). The corrected architecture:

1. **Manually carry only the semantic health-check hunks** from S6's original commits
   `5d2bd8756`, `31a2fac87`, `01f27d4d4` (fetch `origin/feat/aspire-13-5-s6-health-checks` if not
   present locally), written in **current main's no-semicolon style** — do **not** carry
   `31a2fac87`'s (`b30bcb094` in the rejected attempt) large formatting-only churn (+484/-299) as
   a mechanical diff; re-express the same semantics cleanly. **Never select
   `packages/cli/src/kernel/assets/embedded.generated.ts` verbatim from either side of any
   conflict — always regenerate it** (`deno task gen:assets-barrel` after every dependent change).
   **Preserve current main's two-line `CommunityToolkit` 13.5 / first-party 13.6 compatibility
   comment** wherever it appears in the touched files — do not delete or paraphrase it.

   Required semantics for the health-check helper contract:
   - listener/RESP helper functions typed with `Record<string, string>` (not a bespoke object type)
   - DB/RESP resource registration uses `await getEndpoint('tcp')`, then inside the endpoint
     callback `await endpoint.host()` / `await endpoint.port()` (never a synchronous/cached
     shortcut), and calls `.withHealthCheck(...)` on the resource builder
   - no `DenoKv`, no SQLite, no "external"/"local" resource emission anywhere in this path
   - focused tests are real 13.5.3-shaped stubs (not fabricated/hand-typed shapes) — reuse the
     project's existing 13.5.3 fixture conventions.

2. **Carry `b4ca8a1d3`'s entire runtime-module split whole** — this is required, not excluded,
   because a later gate (`scaffold-runtime-a8-f16-1333`) depends on the module boundary existing.
   Exact scope:
   - modify in place: `database-gates.ts`, `otel-gates.ts`, `runtime-gates.ts`
   - add: `runtime/behavior-gates.ts`, `runtime/behavior-scripts.ts`,
     `runtime/listener-readiness-gates.ts`, `runtime/listener-unreachable-fixture.ts`,
     `runtime/runtime-scripts.ts`, `runtime/verify-listener-readiness.ts`
   - move into `runtime/`: `capture-db-endpoint-allocation.ts`, `generated-app-name.ts`,
     `prepare-readiness-fixture.ts`, `probe-app-reference.ts`, `probe-plugin-resource.ts`
   - update: `scaffold-capability-gates.ts`, `ui-ai-gates.ts`, `domain/cli-surface.ts`,
     `quickstart-walk-suite.ts`, `capability-suites.ts`, `runtime-gates_test.ts`
   - add: `listener-readiness-gates_test.ts`
   - update: `probe-app-reference_test.ts`, `suite-registry_test.ts`
   (All paths are under `packages/cli/e2e/src/application/gates/scaffold/` and
   `packages/cli/e2e/tests/application/...` unless noted — use the original commit's actual
   layout as the template, but reconcile against current main's content per point 3 below.)

3. **Exactly two current-main conflict hunks exist between this module split and S1/S5's shipped
   work — resolve both explicitly, nothing else should conflict if the split is applied correctly
   on top of main's actual (not the old pre-shipment) files:**
   - the "behavior gate" title string must read **exactly**
     `Users service uses the live second-start Postgres allocation with correlated telemetry`
     (this is S1's 13.5-adjudicated wording — keep it verbatim, do not revert to the old
     "second allocation differs" wording)
   - retain its exact assertion in `runtime-gates_test.ts` unchanged
   - **preserve every S5 dynamic-endpoint/probe semantic** (the port-literal removal, opt-in host
     ports, endpoint discovery via `aspire describe`) and **leave `verify-live-db-endpoint.ts`
     completely untouched** — it is not in scope for this reconstruction.

   **Invariant:** the reconstructed E2E tree must equal what `b4ca8a1d3` produces, **plus** those
   two S1-derived hunks layered on top — no lost gate IDs, commands, permissions, or dynamic
   discovery logic from either side. After reconstruction, **remeasure** (do not trust old
   figures): `runtime-gates.ts` should be roughly 305 lines, and the `runtime/` directory should
   have 11 children — record the actual measured numbers in the worklog and correct any stale
   line-count claims from the rejected attempt's notes if you find them still present anywhere in
   the run dir.

## Preserve S6 harness history

Copy forward (don't discard) the original S6 run dir `.llm/runs/feat-aspire-13-5-s6-health-checks--impl/`
content from the original commits, and add a "Reconstruction (v2, corrected architecture)" worklog
section explaining what was reconstructed and citing this corrected brief plus the coordinator's
architecture ruling (D-91 audit overrules the narrow-exclusion D-92 attempt).

## Gates (static only — no runtime)

- Focused helper/generator tests, listener/runtime/suite/probe tests
- Scoped `run-deno-check.ts` over every touched/added/moved path
- Configured lint/fmt **and** raw `deno lint`/`deno fmt --check` on the same paths
- `deno task generate:assets` / `check:assets` equivalents and `gen:publish-assets` if applicable
- `deno task check:aspire-host-ports`
- `deno task quality:scan`
- `deno task arch:check`
- Real generated-project 13.5.3 consumer type-check (the standard S6/S8 receipt style — generate a
  scratch consumer of the emitted registers and type-check it; static only, no `aspire start`)

## Commit, push, report

Commit by logical slice (semantic carry / module split / conflict resolution / gates / docs).
Push explicitly to `refs/heads/feat/aspire-13-5-s6-health-checks` (the existing PR #1743 branch);
the supervisor will handle the pinned force-push against the branch's current remote head. PR
#1743 comment `## [PHASE: IMPL] S6 — corrected reconstruction (v2) onto shipped main` with the
measured `runtime-gates.ts` line count, `runtime/` child count, and full gate results. Final line:
the new head SHA. If you hit a genuine ambiguity the brief doesn't resolve, stop and report the
exact question rather than guessing — do not leave a half-applied cherry-pick or merge in
progress.
