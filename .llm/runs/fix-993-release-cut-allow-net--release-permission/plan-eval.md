# PLAN-EVAL — fix-993-release-cut-allow-net--release-permission

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

- Run: `fix-993-release-cut-allow-net--release-permission`
- Branch: `fix/993-release-cut-allow-net`, baseline `origin/main` @ `3ab64720f`
- Surface: repository release/agentic tooling (`.llm/tools`, `deno.json`) — no `packages/`/`plugins/`

> This file replaces a `plan-eval.md` the implementing slice wrote about its own plan. Generator and
> evaluator must not be the same session; that self-evaluation is void and its `PASS` carries no weight.

## Checklist results

| Plan-Gate item | Result | Evidence |
| --- | --- | --- |
| Research present and current | PASS | `research.md` findings 1-8 re-derived at `3ab64720f`. Independently spot-checked: `deno.json:97` has no net flag; `endpoints.ts:26` = `https://api.github.com`; `agentic-lib.ts:976` bare `catch { return null }`; `:1078` maps null → `(401)`. All confirmed. |
| Root cause verified, not assumed | PASS | Findings 3/4 reproduce the probe independently and land on the same `Deno.errors.NotCapable` shape I measured before writing the brief. The issue's stated cause holds — unusually for this cycle. |
| Decisions locked | PASS | D1-D4 fix error strategy, return contract, test strategy, permission scope. |
| Open-decision sweep | PASS | Sweep resolves the classification strategy; absent task snapshot correctly marked N/A (I confirmed no `release:cut` snapshot exists). |
| Commit slices (< 30, gate + files each) | PASS | Two ordered slices in `worklog.md` §Design, each with proving gate and files. |
| Risk register | PARTIAL | Four risks with mitigations, but "live invalid-token test depends on GitHub availability" is *accepted* rather than mitigated. That acceptance is not the plan's to make — see Finding A. |
| Gate set selected | **FAIL** | Validation Plan order 3 cannot execute the test D3 specifies. See Finding A. |
| Deferred scope explicit | PASS | §Non-Scope excludes packages/plugins, bare `--allow-net`, unrelated `--allow-run`, destructive cut, scaffold E2E. Matches the issue. |
| jsr-audit surface scan (pkg/plugin) | N/A | No publishable export surface touched; verified. |

## Findings

### A. (blocking) The planned test cannot run under the plan's own gate, and imports a live-network dependency into a hermetic suite

D3 commits to "a subprocess lacking net permission, plus an invalid-token **live request**".

1. **Self-inconsistent.** Validation Plan order 3 is
   `deno test --allow-read --allow-env --allow-net=api.github.com .llm/tools/agentic/lib/agentic-lib_test.ts`
   — no `--allow-run`. The subprocess test D3 requires cannot spawn under the very gate nominated to
   prove it. The gate would report success while the new test fails to do its job.
2. **Test-hygiene regression.** `agentic-lib_test.ts` currently holds 63 tests with **zero** `fetch(`,
   zero `api.github.com`, zero `Deno.Command` (verified by grep). D3 would make it the first file in
   that suite to require outbound internet. Because `deno task test` is `deno test --allow-all`, that
   dependency propagates to the repo-wide test gate: CI without egress to api.github.com would begin
   failing — on a change whose entire subject is a permission flag.
3. D3 dismisses the pure-helper route as "speculative". It is the opposite. Extracting the
   classification predicate and the message builder makes exactly what both acceptance boxes assert
   — "names the flag", "contains neither `401` nor `gh auth login`" — deterministically testable with
   no network and no subprocess.

**This one is mine.** I wrote both the gate command and the "if not directly testable, extract a pure
helper" fallback, and wrote them loosely enough that the plan could decline the fallback while
nominating a gate that contradicts its replacement. The plan here is only as good as my framing was,
which is precisely why this is worth catching before implementation rather than after.

**Required fix:** make permission-failure and genuine-401 classification provable by a hermetic unit
test — extract the predicate and message builder as pure exported functions and test those. Keep the
live-token probe as supervisor-run acceptance evidence recorded in `worklog.md`, not as a committed
test. If any subprocess test is retained, the gate command must carry `--allow-run` and the test must
skip cleanly when net is unavailable.

### B. (non-blocking, carry into implementation) Assert the user-facing string, not only the thrown one

Acceptance box 2 is about what the operator reads. The throw propagates
`validateGithubToken` → `accept()` → `resolveGithubToken` → the `cut.ts:121` catch, which prints
`release:cut could not create the release PR: <message>`. Confirm the *rendered* line names the flag,
and that **no `(401)` entry is emitted at all** in the permission case — four bogus `(401)`s were the
bug, so their absence is part of the fix, not a side effect.

### C. (non-blocking) D1's blast radius is slightly wider than "the fetch"

`instanceof Deno.errors.NotCapable` around the `githubRequest` call will also catch a future
non-net capability failure and advise `--allow-net`. Acceptable at this size — but narrow it by
confirming the error concerns net access rather than assuming, and keep the original error text in
the message as D1 already requires.

## Verdict

`FAIL`

The cause is correctly identified and the two-part remedy (host-scoped flag + truthful
classification) is right. Blocked solely on Finding A: the nominated test cannot run under the
nominated gate, and would make a 63-test hermetic suite depend on the live GitHub API. Resolve A,
fold in B and C, and this passes — the change itself remains a small, correct, well-scoped diff.
