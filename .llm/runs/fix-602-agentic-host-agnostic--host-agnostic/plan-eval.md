# PLAN-EVAL — fix-602-agentic-host-agnostic--host-agnostic

- Plan evaluator session: Claude · Opus 4.8 (opposite-family local PLAN-EVAL) / 2026-07-11
- Run: fix-602-agentic-host-agnostic--host-agnostic
- Surface / archetype: N/A — internal `.llm/tools/agentic/**` repository CLI helpers (not framework-layer)
- Scope overlays: none
- Cycle: 2 (cycle 1 = `FAIL_PLAN`; generator revised in `39da7421`)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselines against `origin/main` @ `720fcb7e` (verified equal to current `origin/main`). Load-bearing findings verified against the tree: Finding #2 now correctly states the launcher's real streaming spawn directly constructs `Deno.Command('wsl.exe', …)` (`launch-codex-slice.ts:416`), no longer claiming the launcher already routes through shared helpers. Finding #3 enumerates every execution constructor — `agentic-lib.ts:84,100,936`, `gh-token.ts:160` (`runWithStdin`), `launch-codex-slice.ts:416` — plus the display-only strings in launcher/resume diagnostics. All line numbers confirmed present. |
| Decisions locked                        | PASS   | D1–D5 stated with rationale. D1 now models the pure `{bin,args,cwd?}` plan for buffered, captured, streaming `.spawn()`, and stdin consumers. D5 (new) puts the launcher's streaming spawn and its dry-run render on the same plan. D4 keeps token capture + stdin login on the shared plan with PAT stdin-only. |
| Open-decision sweep                     | PASS   | The prior rework-forcing gap (streaming/stdin local execution) is now "resolved now" via D1/D5. Remaining deferrals (WSL detection beyond Linux; cross-user) are correctly marked safe-to-defer. My independent sweep (below) finds no still-open decision that forces rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS   | Single slice, gate + files named, well under 30. Files list now includes `codex/launch-codex-slice.ts` and `github/gh-token.ts`, so every raw **execution** constructor is in scope and Validation step 4 ("only the shared Windows plan construction remains") is satisfiable. One non-blocking gap noted below (`codex-resume.ts` display string). |
| Risk register                           | PASS   | Risks + mitigations present (Windows argv drift, username resolution, residual raw call via repo-wide search, safety regression via full suite + dry-run git-safety). |
| Gate set selected                       | PASS   | Archetype N/A → archetype-gate-matrix N/A. Validation gates (unit test / scoped check / scoped fmt / execution-constructor audit / native-WSL dry-run E2E / lock hygiene) are appropriate for internal tooling. Step 4 audit is scoped to execution constructors — all now in the slice's files. |
| Deferred scope explicit                 | PASS   | Deferred Scope names distro selection + Linux cross-user, and explicitly states "no raw execution call site is deferred; launcher streaming and both token paths are in scope." (Non-blocking display-string note below.) |
| jsr-audit surface scan (pkg/plugin)     | N/A    | Internal `.llm/tools/` tooling, not a published `packages/`/`plugins/` surface. `research.md` + `plan.md` record N/A with reason. |

## Open-decision sweep (evaluator-run)

No decision remains that would force rework if deferred. The cycle-1 blocker — whether the pure
`{bin,args,cwd?}` plan must serve a streaming `.spawn()` consumer and the stdin login, not only
`runBin`/`runCapture` — is now resolved in D1/D5 and reflected in the slice's files and audit gate.
Current-user resolution and Linux `--cd`→`cwd` mapping are implementation details expressible through
the shared builder (Hidden Scope + Risk Register), not architecture decisions.

## Non-blocking note (does not gate implementation)

- `codex-resume.ts:150` builds a dry-run **display** string `wsl.exe -u … -- bash -lc …`. It is named
  in research Finding #3 and covered by Scope bullet 4 ("dry-run/display diagnostics render the
  selected host plan instead of claiming `wsl.exe` on Linux"), yet `codex/codex-resume.ts` is **not**
  in the slice's files list. This is cosmetic: resume's real dispatch (`:156`) routes through the
  now-host-aware `wsl()` and works on a Linux host regardless; the field only mis-renders the command
  in dry-run JSON. The fix routes through the same builder D5 already exposes (no redesign). A sibling
  help-text string at `agentic-lib.ts:955` is in an in-scope file and can be handled in-slice.
  During implementation, either route these display strings through the host plan or record them in
  `drift.md` as an accepted cosmetic deferral with stated Linux-host behavior. Not a Plan-Gate failure.

## Verdict

`PASS`

Implementation may begin. Carry the non-blocking display-string note into the slice or into
`drift.md`; IMPL-EVAL should confirm no raw `wsl.exe` **execution** constructor remains outside the
shared Windows plan literal.

## Notes

- Baseline verified: `origin/main` = `720fcb7e3b762c1e9ee5bf51a1371bfeeb6be22f`; branch HEAD
  `39da7421` (cycle-1 revision commit); tree clean. Full `wsl.exe` literal search under
  `.llm/tools/agentic/**/*.ts` reconciled line-by-line with research findings.
- **Cycle-1 history (concise):** `FAIL_PLAN`. Four required fixes: (1) research Findings #2/#3 falsely
  claimed the launcher already routed through shared helpers and hid the `runWithStdin` stdin login and
  `Deno.Command('wsl.exe')` streaming spawn; (2) the streaming-spawn/stdin open decision was unresolved,
  forcing D1 rework if deferred; (3) the slice files list + audit step 4 were mutually contradictory
  (raw sites omitted); (4) deferred scope silently omitted the launcher/login sites. All four are
  resolved in `39da7421` (revised `research.md`, `plan.md` D1/D4/D5 + scope/slice, `worklog.md` Design,
  `context-pack.md`, `drift.md`).
- The pure-plan modelling (D1) and the in-scope trio remain sound; cycle-2 only needed scope
  completeness + research accuracy, both now met.
- Loop status: cycle 2, `PASS` — no escalation required.
