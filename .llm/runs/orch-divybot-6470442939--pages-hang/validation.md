# Initial validation

Code evaluated and validated at `125ac4b1dd834c27056e50a901a74a203f82eba6`.
The final evidence commit changes run records only.

| Gate | Result |
| --- | --- |
| `deno task docs:snippets:test` | PASS, exit 0; 18 tests, 13.515 seconds |
| Structured test wrapper, same five test files | PASS, exit 0; 18 tests, 14.787 seconds |
| `deno task docs:snippets` | PASS, exit 0; 41.508 seconds, 27 checked / 14 exempt Tier-1 fences |
| `deno task docs:exports-drift` | PASS, exit 0; 4.324 seconds |
| `deno task --cwd docs/site verify` | PASS, exit 0; 10.126 seconds |
| Three preceding build checks in sequence | PASS; total 55.958 seconds |
| Structured check wrapper, docs tools excluding fixtures | PASS; 52 files, zero diagnostics |
| Structured format wrapper, same scope | PASS; 52 processed, zero findings |
| Structured lint wrapper, nine changed TS files, docs/site config | PASS; nine processed, zero findings |
| Deadline-disabled nontermination test | RED; external five-second guard, exit 124, 5.007 seconds |
| Deadline restored | GREEN; fixture fails as expected with source path and line in < 0.5 second |
| Full `e2e:cli run scaffold.runtime --cleanup --format pretty` | UNPROVEN, exit 1; Aspire doctor / Docker preflight unavailable |
| Read-only resource inspection | Exit 0; foreign/unknown resources untouched; Docker inspection unavailable |
| Review-thread gate | PASS; zero threads, zero unanswered |
| Independent Claude IMPL-EVAL | PASS; blockers only, read-only |
| Root lock and whitespace checks | `deno.lock` unchanged; `git diff --check` clean |

Actual CI evidence: [Pages run 40700388436](https://github.com/rickylabs/netscript/actions/runs/40700388436),
[build job](https://github.com/rickylabs/netscript/actions/runs/40700388436/job/122859650001),
same reviewed head. Build ran 13:54:32–13:56:18Z (106 seconds), snippets ran
13:54:59–13:55:59Z (60 seconds), exports drift 18 seconds and Lume build 16 seconds. All executed
build checks passed. This proves a cold CI build fits the 10-minute job and 5-minute step limits.
Other draft workflows, including CLI E2E, were skipped by existing policy; skipped is not PASS.

Check command:
`deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/docs --ext ts --exclude '/fixtures/'`

Format command: same selection with `.llm/tools/run-deno-fmt.ts`.
Lint command: `.llm/tools/run-deno-lint.ts` with explicit `--file` selections for the nine changed
TypeScript files and `--config docs/site/deno.json`. Root lint excludes `.llm`; unscoped docs lint
findings were in three untouched files and were not altered or suppressed.
Test evidence comes from `.llm/tools/run-deno-test.ts` with the exact test arguments in
`docs:snippets:test`. The exports-drift gate also has a native run-gate PASS receipt retained
outside Git. No snippet gate exists in that allowlist; no handcrafted receipt claims one.

## Review-repair validation

Final source head: `d77b4b6ab0cf4cb4699a0ec9bf138438b3768733`; later closeout changes only evidence.

| Gate | Result |
| --- | --- |
| New external-SIGTERM and later-fence regressions before repair | RED, each exits 1 |
| Combined process/compiler/README-policy/workflow structured tests | PASS, 23 tests, 18.158s |
| `deno task docs:snippets:test` | PASS, 20 tests, 20.107s |
| `deno task docs:snippets` | PASS, 41.689s |
| Native `readme-fences` gate at a6e91af | PASS, 143.067s, 99 checked, five errors, four failing READMEs |
| Native `readme-fences` gate at final d77b4b6 | PASS, 149.623s, identical census, no unattributed failure |
| Original-main compiler/README baseline on same content | PASS, 10.047s, identical census |
| Final structured check | PASS, 53 files, zero findings |
| Final structured lint | PASS, nine changed TypeScript files, zero findings |
| Final structured format | PASS, 53 files, zero findings |
| Exact test-5 failing auth fixture, unchanged | PASS locally, 46.314s |
| Same-session final independent IMPL-EVAL | PASS, no blocking findings |
| Review-thread gate | PASS, all three findings answered |
| Lock hygiene | Root deno.lock unchanged |

The type-error ceiling remains five, failing-README ceiling four; coverage floors are unchanged.
The per-entrypoint cost is explicit: the complete README gate now takes about 150 seconds locally,
versus about ten seconds for its old combined graph. Every compiler retains a separate deadline.

[Pages build on the repaired source](https://github.com/rickylabs/netscript/actions/runs/40706224523/job/122879437081)
passed: 112 seconds total, snippets 65 seconds, exports drift 20 seconds, Lume 15 seconds.
Core CI was restarted by the source pushes; its prior quality failure was the missing README
environment permission. Prior test-5 had a single auth fixture fetch failure among 1,455 passes;
the exact test passes unchanged locally. Do not classify future/pending checks as PASS.

The runtime scaffold gate remains unavailable and unproven as recorded above. No gate was removed,
skipped by this change, or weakened, and no ratchet bound was increased.

## CI color-repair validation

At f8f3b28, actual CI quality and all shards except test-4 passed. Test-4's only failing assertion
was original source-line mapping with ANSI colors. Forced color reproduced the same failure
locally (exit 1, 2.428s); SGR normalization before mapping fixes it with the assertion unchanged.

- Focused structured suite: PASS, 23 tests, 18.323s, including always-colored diagnostics.
- Structured check: PASS, 53 files; lint: PASS, both edited TS files; format: PASS, 53 files.
- Same-session independent pre-commit review: PASS, 36.893s; source fingerprints in evaluate.md.
- Prior Utility browser failure: an unchanged rerun passes all 48 tests; workflow/tests untouched.
- Exact-head native README and final core CI results are published on PR #2458 after this commit.

No further push is needed merely to copy later CI results into this file. The PR head and native
receipts/comments carry that final evidence; the existing runtime/history caveats remain unchanged.
