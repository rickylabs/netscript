# Evaluation: quality-scan-allowance-rail (PR #1653) — IMPL-EVAL cycle 2

Formal IMPL-EVAL **cycle 2**. Fresh session, separate from the implementer (Codex GPT-5.6 Sol ·
high), from the Tier-A topic supervisor, and from the cycle-1 evaluator. Cycle 1's `evaluate.md` is
preserved unmodified as history; this file is cycle 2.

Cycle 1 returned `FAIL_FIX` on a single editorial blocker. This pass re-verifies that fix by
execution and spot-verifies cycle 1's PASS rows for integrity. Every result below was produced in
this session; receipts were read only to compare against independently produced output, never as the
verdict source.

## Metadata

| Field              | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| Run ID             | `release-0.0.7-internals--orchestration/slices/quality-scan-allowance-rail` |
| Target             | PR #1653, branch `chore/quality-scan-allowance-rail`                        |
| Evaluated SHA      | `84bbcf9a185a1bc29072f1feecc1b7d08f3f18b2`                                  |
| Binding impl head  | `71c26445838eb5bca654607947ad247cbea78273`                                  |
| Immutable base     | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                  |
| Live `origin/main` | `0b3ed5d5a6aea451318f120988c25dfa3993a2ab`                                  |
| Archetype          | 6 — repo tooling (scanner), with CLI/plugin publish-surface peers           |
| Scope overlays     | docs (docs/site format + accuracy), frontend (fresh-browser)                |
| Cycle              | 2 (cycle 1 = `FAIL_FIX` at `2d5e4f5ae`)                                     |
| Evaluator          | Claude Opus 5 · effort `high` · Remote Control · 2026-08-15                 |

### Evaluator identity

| Field             | Value                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Session ID        | `31c4cfa9-6610-4813-a4d2-482080fc562e`                                                                                                                       |
| `bridgeSessionId` | `cse_01A8dNQhZgaysPzhnEDm2MrA`                                                                                                                               |
| PID               | `27373`                                                                                                                                                      |
| cwd               | `/home/codex/repos/netscript-007-quality-rail`                                                                                                               |
| Requested route   | native Claude Opus 5, effort `high`, Remote Control enabled                                                                                                  |
| Observed route    | `respawnFlags` = `--effort high --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1653 IMPL-EVAL cycle 2" --model claude-opus-5` |
| Route source      | `~/.claude/jobs/31c4cfa9/state.json` (a spare-claimed background session's own argv omits `--model`/`--effort`)                                              |
| Opposite family   | Yes — implementer was Codex GPT-5.6 Sol · high                                                                                                               |
| Independence      | Not the implementer, not the topic supervisor, not the cycle-1 evaluator (`430d5f91-…`)                                                                      |

### Immutable-target reconciliation

Re-resolved independently at start and again at the end; identical both times.

| Source                                            | Value                                      |
| ------------------------------------------------- | ------------------------------------------ |
| `git rev-parse HEAD`                              | `84bbcf9a185a1bc29072f1feecc1b7d08f3f18b2` |
| `git ls-remote origin refs/heads/chore/quality-…` | `84bbcf9a185a1bc29072f1feecc1b7d08f3f18b2` |
| `gh pr view 1653 --json headRefOid`               | `84bbcf9a185a1bc29072f1feecc1b7d08f3f18b2` |
| Briefed leaf head                                 | `84bbcf9a185a1bc29072f1feecc1b7d08f3f18b2` |
| Worktree                                          | clean (`git status --porcelain` empty)     |

All four equal — evaluation proceeded. Both mandated SHAs verified: `71c264458` is the binding
implementation head that the final receipts attest, and `84bbcf9a1` is the leaf head carrying cycle
1's `evaluate.md`. `git diff --stat 2d5e4f5ae..84bbcf9a1` = **one file, `evaluate.md`, +321** — the
cycle-1 evaluator artifact only, no product change. No self-referencing receipt was demanded.

---

## Primary scope — the editorial close-gate fix

### Method

Cycle 1's blocker was that superseded baseline `acceptance-evidence` blocks in the PR body coexisted
with the Slice 4 final blocks; because the mirror concatenates body + comments,
`validateEvidenceMapping` threw 9 errors for #1378 and 5 for #1545.

I did **not** accept `mirror-acceptance-evidence.ts --dry-run` as evidence. I called the repo's own
`acceptanceCheckboxes` + `parseAcceptanceEvidence` + `validateEvidenceMapping` directly against the
**live** PR body, **live** PR comments, and **live** issue bodies, composing sources in the exact
order `mirror-acceptance-evidence.ts:117` uses
(`[pr.body ?? '', ...comments.map(c => c.body ?? '')]`), with closing issues derived from
`extractClosingIssues(pr.body)`.

### Result — executed

| Check                                            | Result | Evidence                                                                                    |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| `extractClosingIssues(pr.body)`                  | `PASS` | `[1378, 1545]`; both classified `issue`, neither a pull request                             |
| Live comment count consumed                      | `PASS` | 19 comments + body composed in mirror order                                                 |
| Parse warnings across the whole corpus           | `PASS` | **0** — no legacy-list warning, no other warning                                            |
| `validateEvidenceMapping(1378, …)`               | `PASS` | did **not** throw; `mappingSize = 9`                                                        |
| `validateEvidenceMapping(1545, …)`               | `PASS` | did **not** throw; `mappingSize = 5`                                                        |
| Exact coverage #1378                             | `PASS` | 9 checkboxes, 9 actionable, 9 unchecked, 0 post-merge → `mappingSize(9) === unchecked(9)`   |
| Exact coverage #1545                             | `PASS` | 5 checkboxes, 5 actionable, 5 unchecked, 0 post-merge → `mappingSize(5) === unchecked(5)`   |
| Exactly one entry per box                        | `PASS` | `validateEvidenceMapping` throws on a second entry for any box index; it did not throw      |
| Total entries parsed                             | `PASS` | **14** (= 9 + 5); previously 28, which is what produced the duplicate errors                |
| Sole evidence source                             | `PASS` | all 14 come from comment index 15, `issuecomment-5299728017`; the **PR body contributes 0** |
| No `PENDING`/not-yet-done anywhere in the corpus | `PASS` | applied the tool's own `NOT_YET_DONE_EVIDENCE` regex to all 14 entries → **0 matches**      |

Zero errors, zero warnings, exact coverage on both issues.

### The evidence carrier is the right comment

Comment 15 is `**[PHASE: IMPL] Slice 4 — final acceptance and consumer portability**` (2026-08-15
01:09:21Z). Scanning all 19 comments for `` ```acceptance-evidence ``, it is the **only** comment
carrying evidence blocks — so the body's new pointer names the correct and unique source.

### The edit was bounded — verified against GitHub's own revision history

Retrieved the PR body revisions via `userContentEdits` (3 revisions). The pre-fix revision
(2026-08-13T20:39:50Z, 4917 chars) versus the current revision (2026-08-15T04:12:14Z, 3365 chars),
diffed:

````
63,101c63
<   [the ```acceptance-evidence block for issue 1378 — 9 entries]
<   [the ```acceptance-evidence block for issue 1545 — 5 entries]
<   Do not merge, publish, flip ready, apply `status:ready-merge`, widen milestone scope, or treat
<   these baseline entries as final acceptance evidence.
---
>   Do not merge, publish, flip ready, apply `status:ready-merge`, widen milestone scope. Final
>   acceptance evidence for #1378 and #1545 lives in the Slice 4 `[PHASE: IMPL]` comment; exactly
>   one entry maps to each box.
````

| Check                                  | Result | Evidence                                                                                               |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Only the two superseded blocks removed | `PASS` | the diff is a single contiguous hunk at the tail; nothing above line 63 changed                        |
| Unrelated body content preserved       | `PASS` | Summary, Scope (`Closes #1378`/`Closes #1545`), Slices, Validation, Harness, Drift/Debt byte-identical |
| Full Definition of Done preserved      | `PASS` | all **12** DoD items byte-identical, none added, none removed, none ticked                             |
| Exactly one line added                 | `PASS` | the replacement trailing instruction; every other change is a pure deletion                            |
| Current revision == live body          | `PASS` | `diff` of revision 0 against `gh pr view --json body` differs only by a trailing newline               |

### Judging the replacement line

Both halves check out:

- **The operative rule survived intact.**
  `Do not merge, publish, flip ready, apply`status:ready-merge`, widen milestone scope` is
  byte-identical to the original prefix. Nothing was weakened, and no permission was added.
- **The removed clause had to go.** `or treat these baseline entries as final acceptance evidence`
  referred to blocks that no longer exist; retaining it would have been a dangling reference.
- **The replacement is factually accurate**, and I verified each claim rather than reading it:
  "Final acceptance evidence for #1378 and #1545 lives in the Slice 4 `[PHASE: IMPL]` comment" —
  confirmed, that comment is the unique carrier of all 14 entries; "exactly one entry maps to each
  box" — confirmed, `mappingSize` equals the unchecked-box count for both issues and duplicates
  would have thrown.

### The close-gate will actually pass — simulated, not assumed

The unchecked acceptance boxes are the **expected** pre-`ready-merge` state: the mirror ticks them
itself from the validated mapping. I simulated the mirror's mutation path offline
(`validateEvidenceMapping` → `checkAcceptanceBoxes(body, new Set(mapping.keys()))`), performing no
write:

| Issue | Boxes before | Boxes after simulated mirror | Actionable still unchecked | `gate:` box after |
| ----- | ------------ | ---------------------------- | -------------------------- | ----------------- |
| #1378 | 0 / 9        | **9 / 9**                    | **0**                      | `[x]` ticked      |
| #1545 | 0 / 5        | **5 / 5**                    | **0**                      | none present      |

So the protocol rule-12 close-gate condition — including #1378's `gate:` box for
`quality:scan:repo` + `arch:check` — is satisfiable and will be satisfied automatically when
`status:ready-merge` is applied. No manual box ticking is needed, which is precisely why none was
performed. The "day-one red gate" cycle 1 identified is resolved.

### Secondary cross-check, declared as such

I ran `mirror-acceptance-evidence.ts --repo rickylabs/netscript --pr 1653 --dry-run --pretty`
**only** as a cross-check. It exited 0 with
`Mirror skipped because live PR labels do not include status:ready-merge`, confirming cycle 1's
lesson: the label guard returns before `validateEvidenceMapping` is ever called, so its green result
proves nothing about the mapping. It is reported here as corroboration of head (`head=84bbcf9a1…`)
and issue snapshots only, never as mapping evidence.

### Nothing else moved

| Check                | Result | Evidence                                                                                          |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| PR head              | `PASS` | `84bbcf9a1…` — local, remote, and PR all agree                                                    |
| Draft state          | `PASS` | `isDraft: true`, `state: OPEN`                                                                    |
| Labels               | `PASS` | `status:impl`, `area:docs`, `area:tooling`, `type:chore`, `area:packages` — exactly one `status:` |
| Milestone            | `PASS` | `0.0.7`                                                                                           |
| Product files        | `PASS` | `2d5e4f5ae..84bbcf9a1` touches only `evaluate.md`                                                 |
| Leaf receipts        | `PASS` | 52 receipts, unchanged; no receipt added or edited by the fix                                     |
| #1378 body           | `PASS` | `lastEditedAt: 2026-08-08T15:55:22Z` — predates the run's impl phase entirely; 0/9 boxes ticked   |
| #1545 body           | `PASS` | `lastEditedAt: 2026-08-13T20:51:23Z` — plan phase, predates impl (2026-08-14 23:27); 0/5 ticked   |
| Publication          | `PASS` | none — no publish, no canary, no release                                                          |
| Expensive-gate lease | `N/A`  | not acquired: no `e2e:cli`, no `scaffold.runtime`, no runtime smoke — **not** claimed as a pass   |

---

## Secondary scope — cycle-1 verdict integrity

Spot-verified by re-execution. Every row below was independently reproduced.

### Allowance population and the rail post-merge

| Check                                         | Result | Evidence                                                                                          |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `deno task quality:scan`                      | `PASS` | exit 0, `ok:true`, `allowCount:7`, `findings:[]`, `allowanceFailures:[]`                          |
| `deno task quality:scan:repo`                 | `PASS` | exit 0, `ok:true`, `allowCount:7`, `findings:[]`, `allowanceFailures:[]`                          |
| Seven records are the measured population     | `PASS` | `public-command-dependencies.ts:363`; `public-api.ts:135,136,158,275,276`; `producer.ts:52`       |
| All owned by #1276                            | `PASS` | all 7 parse to `issue: 1276`; live #1276 is `OPEN`, milestone `Backlog / Triage`                  |
| `check-allowance-budget-diff 01e096049..HEAD` | `PASS` | exit 0, `{"ok":true,"increases":[],"issueLinked":true}`                                           |
| Merge with live `origin/main` is clean        | `PASS` | `git merge-tree --write-tree origin/main 84bbcf9a1` exit 0, tree `9c3e576fd`                      |
| Main adds no allowances                       | `PASS` | 0 `quality-allow` additions in `01e096049..origin/main` across `packages`, `plugins`, `docs/site` |
| **Post-merge `quality:scan`**                 | `PASS` | real merge materialized in a scratch worktree → exit 0, `ok:true`, `allowCount:7`, 0 findings     |
| **Post-merge `quality:scan:repo`**            | `PASS` | same merged tree → exit 0, `ok:true`, `allowCount:7`, 0 findings                                  |
| **Post-merge allowance budget**               | `PASS` | `01e096049..merged` → exit 0, no increases, `issueLinked:true`                                    |

Main does touch `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts` inside the
scan root, so I materialized the merge (`git commit-tree` + detached worktree) and re-ran the rail
against it rather than inferring from file overlap. The rail does not go red on main. The scratch
worktree was removed and `git worktree prune` run; the target worktree is clean.

`deno.json` correctly wires `--max-allow 7` for **both** tasks (repo-wide was tightened 8 → 7), with
`--allow-net=api.github.com --allow-env=GITHUB_TOKEN,GH_TOKEN` added for the resolver.

### Consumer bundle portability — re-derived from scratch

I deliberately re-derived this rather than inheriting either the topic supervisor's incorrect
Slice-2 sign-off or Slice 4's correction.

| Check                                      | Result | Evidence                                                                                                   |
| ------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------- |
| Scanner source keeps the inline specifier  | `PASS` | `.llm/tools/quality/scan-code-quality.ts:1` → `from 'jsr:@std/path@^1'`                                    |
| Generated asset carries the same specifier | `PASS` | 2 × `jsr:@std/path@^1`, **0** × `from '@std/path'` in `agent-tools.generated.ts`                           |
| Shipped bundle extracts as installed       | `PASS` | 12 files from `EMBEDDED_AGENT_TOOL_FILES`, matching `EMBEDDED_AGENT_TOOL_PATHS` (12)                       |
| Foreign CWD has no import map at all       | `PASS` | walked every ancestor of the scratch dir — no `deno.json`, `deno.jsonc`, `package.json`, `import_map.json` |
| **Runs from a foreign CWD**                | `PASS` | clean target → exit 0, `ok:true`; dirty target → exit 1 with the correct `explicit-any` finding            |
| **Negative control: bare specifier fails** | `PASS` | same bundle, specifier rewritten to `@std/path` → `error: Import "@std/path" not a dependency`, exit 1     |

The specifier across slice heads, traced with `git show`:

| Head        | Slice       | Specifier                            |
| ----------- | ----------- | ------------------------------------ |
| `01e096049` | base        | `jsr:@std/path@^1`                   |
| `586b55135` | S1          | `jsr:@std/path@^1`                   |
| `f869a5bfe` | **S2**      | **`@std/path`** ← regression         |
| `2977c8333` | S3          | `@std/path`                          |
| `83f7a1847` | S3 sign-off | `@std/path`                          |
| `71c264458` | **S4**      | **`jsr:@std/path@^1`** ← D-12 repair |
| `84bbcf9a1` | head        | `jsr:@std/path@^1`                   |

The binding `test` gate caught it: `receipts/slice-4/test.json` at `83f7a1847` is **exit 1, outcome
FAIL**, and its retained stdout names the failing test literally —
`installed consumer tools resolve from the project when process CWD differs`
(`init-agent_test.ts:581`). `receipts/slice-4/test-binding.json` at `71c264458` is exit 0 with
`4109 passed / 0 failed / 19 ignored / 4128 total`.

**My own judgement, independently reached:** the bare form is not a style preference — it is
unresolvable from a consumer CWD. The topic supervisor's Slice-2 sign-off of that change as "a real
fix" was **wrong**; restoring `jsr:@std/path@^1` was the correct minimum repair, and recording it as
drift `D-12` is accurate. Cycle 1's row is sound.

### Workers baseline honesty

Re-executed `deno task doc:lint --root plugins/workers --pretty`:

| Check                          | Result          | Evidence                                                                                                                                              |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact 20 `private-type-ref`    | `PASS`          | `combinedPrivateTypeRef: 20`, `combinedTotal: 20`                                                                                                     |
| Zero other diagnostic classes  | `PASS`          | `combinedMissingJSDoc: 0`, `combinedOther: 0`                                                                                                         |
| All 13 export targets audited  | `PASS`          | `entrypointExitCodes` lists exactly 13 targets (7 at exit 1, 6 at exit 0)                                                                             |
| Reported red, never green      | `PASS`          | `combinedExitCode: 1`; the Slice 3 PR comment states it is not green                                                                                  |
| Nothing hidden or reclassified | `PASS`          | no diagnostic-class suppression in the diff                                                                                                           |
| #1655 debt entry complete      | `DEBT_ACCEPTED` | `workers-private-type-ref-1655`: Reason, Owner (#1655, 0.0.8), Target, Linked plan, Created, Status, Gate, Evidence — all present, strict no-increase |
| #1655 live state               | `PASS`          | `OPEN`, milestone `0.0.8`, `type:chore`/`area:workers`                                                                                                |

### Receipt provenance

I extracted every 9–40 char hex token from all 52 receipts and tested each resolvable commit for
reachability from `84bbcf9a1`.

| Check                                             | Result | Evidence                                                                                                                                                                                                            |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every receipt's `gitHead == actualGitHead`        | `PASS` | all 52 receipts; zero mismatches, zero parse failures                                                                                                                                                               |
| Every attested head reachable from the branch     | `PASS` | `01e096049`, `c694cfb31`, `586b55135`, `3c3985289`, `f9acdb426`, `83f7a1847`, `71c264458` — all ancestors                                                                                                           |
| No **binding** receipt names a non-history object | `PASS` | the single out-of-history object `3136358e4` is a **stash** commit appearing only in the `argv` of the superseded `slice-1/allowance-budget.json`, whose own `gitHead`/`actualGitHead` are `c694cfb31` (in history) |
| Superseding receipt is history-bound              | `PASS` | `slice-1/allowance-budget-landed-head.json` compares `01e096049..586b55135`, exit 0, `gitHead == actualGitHead == 586b55135`, and carries stdout sha256 `2122337d…` — **identical** to the superseded probe         |
| Red receipts retained honestly                    | `PASS` | `slice-4/test.json` exit 1 / FAIL retained beside binding `slice-4/test-binding.json` exit 0                                                                                                                        |

Cycle 1's D-11 characterization is exact.

### Scope and lock integrity

| Check                                   | Result | Evidence                                                                                                                                       |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Exactly nine non-run-artifact paths     | `PASS` | enumerated `01e096049..84bbcf9a1` excluding the leaf run dir → count **9**, matching the authorized surface list; no tenth surface             |
| `deno.lock` churn                       | `PASS` | `git diff --stat 01e096049..84bbcf9a1 -- deno.lock` empty; working tree also clean                                                             |
| No `@ts-ignore` / `@ts-nocheck` added   | `PASS` | 0 additions across the diff                                                                                                                    |
| No suppression added to green a wrapper | `PASS` | see the precision note below — every `deno-lint-ignore` token pre-exists at the base                                                           |
| Cast count unchanged                    | `PASS` | `public-api.ts` 5→5, `public-command-dependencies.ts` 1→1, `producer.ts` 1→1 (total 7 = the allowance population)                              |
| Product diff is comment-only            | `PASS` | all three product files change only the `quality-allow:` comment text, gaining the `#1276 —` owner prefix; no code line altered                |
| Generated asset is byte-fresh           | `PASS` | ran `deno task gen:assets-barrel` in an isolated detached worktree at `84bbcf9a1` → `git status --porcelain` **empty**, no diff, no lock churn |

### Supervisor sign-off ordering — no lane self-certified

| Slice | Sign-off commit | Successor   | `git merge-base --is-ancestor` |
| ----- | --------------- | ----------- | ------------------------------ |
| S1    | `3c3985289`     | `f869a5bfe` | true                           |
| S2    | `f9acdb426`     | `2977c8333` | true                           |
| S3    | `83f7a1847`     | `71c264458` | true                           |
| S4    | `2d5e4f5ae`     | `84bbcf9a1` | true                           |

All four exist with the expected subjects and strictly precede their successors. The IMPL-EVAL lane
is this separate opposite-family session; cycle 1 was a different session again.

### Carried question — `explicit-any` vs `public-any` attribution

**Answer: a publicly reachable `any` is double-counted.** Determined by probe, not by reading, and
with a real export graph (a scratch package with `deno.json` `exports`, which the earlier
foreign-CWD scan lacked).

Probe A — `export type PublicThing = { value: any }` plus a local-only `function localOnly(x: any)`,
no allowance marker → **3 findings for 2 defects**:

```
explicit-any  src/mod.ts line 1
public-any    src/mod.ts line 1   exportPath=src/mod.ts -> PublicThing
explicit-any  src/mod.ts line 2
```

The two rules are computed independently — `scanPublicAny()` walks the export graph while the line
loop calls `ruleFor()` — and both results are concatenated at `scan-code-quality.ts:960-964`. The
trailing filter removes a `public-any` only when its location is in `suppressedPublicLocations`,
i.e. only when the line carries a `quality-allow` marker; it never deduplicates against a location
already reported by `explicit-any`.

Materiality, also probed:

- **The public rule discriminates correctly.** The local-only `any` on line 2 fired `explicit-any`
  and **not** `public-any` — plan acceptance criterion 3 holds.
- **It does not inflate the allowance budget.** Probe B, one `quality-allow` marker on the public
  line → `allowCount: 1`, `allowanceFailures: []`, and **both** rules suppressed for that line (the
  marker branch `continue`s before `explicit-any` is pushed, and the marker adds the location to
  `suppressedPublicLocations`, which drops the `public-any`).
- **It does not change any gate verdict.** `ok` is `findings.length === 0`, identical either way.

The effect is confined to reporting volume: one defect consumes two rows, so a future remediation
count read off `findings.length` would overstate the work by the number of publicly reachable `any`
tokens. This is the locked plan behaviour PLAN-EVAL cycle 2 approved ("keep the existing
line-oriented local rules separate"), so it is an observation with a recommended follow-up, not a
blocking defect. Cycle 1's row is confirmed correct.

---

## Gates re-executed in this session

| Gate                           | Command                                                                         | Exit | Result          | Evidence                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- | ---- | --------------- | ---------------------------------------------------------------------------- |
| `quality-scan`                 | `deno task quality:scan`                                                        | 0    | `PASS`          | `ok:true`, `allowCount:7`, 0 findings, 0 allowance failures                  |
| `quality-scan-repo`            | `deno task quality:scan:repo`                                                   | 0    | `PASS`          | `ok:true`, `allowCount:7`, 0 findings, 0 allowance failures                  |
| `allowance-budget`             | `check-allowance-budget-diff.ts 01e096049 84bbcf9a1 --pretty`                   | 0    | `PASS`          | `ok:true`, `increases:[]`, `issueLinked:true`                                |
| post-merge rail                | both scans + budget on the materialized `84bbcf9a1 + origin/main` tree          | 0    | `PASS`          | `allowCount:7`, 0 findings                                                   |
| `arch-check`                   | `deno task arch:check`                                                          | 0    | `PASS`          | `FAIL=0` on every root; warnings only, none new                              |
| focused scanner suite          | `run-deno-test.ts -- --allow-all .llm/tools/quality/scan-code-quality_test.ts`  | 0    | `PASS`          | 25 passed / 0 failed / 0 ignored                                             |
| consumer integration           | `run-deno-test.ts -- --allow-all packages/cli/.../init-agent_test.ts`           | 0    | `PASS`          | 19 passed / 0 failed — includes the CWD-portability test                     |
| `doc:lint` (workers)           | `deno task doc:lint --root plugins/workers --pretty`                            | 1    | `DEBT_ACCEPTED` | exactly 20 `private-type-ref`, 0 `missing-jsdoc`, 0 other, 13 targets        |
| `generated-asset`              | `deno task gen:assets-barrel` in an isolated worktree, then `git status`        | 0    | `PASS`          | no tracked diff — asset byte-fresh                                           |
| consumer portability           | extracted bundle from a foreign CWD, plus bare-specifier negative control       | 0/1  | `PASS`          | positive exit 0; control `Import "@std/path" not a dependency` exit 1        |
| acceptance mapping             | `acceptanceCheckboxes`+`parseAcceptanceEvidence`+`validateEvidenceMapping` live | —    | `PASS`          | 0 errors, 0 warnings, 9/9 and 5/5 exact coverage                             |
| mirror (cross-check)           | `mirror-acceptance-evidence.ts --dry-run --pretty`                              | 0    | `N/A`           | label-guard skip — recorded as corroboration only, never as mapping evidence |
| `scaffold.runtime` / `e2e:cli` | shared expensive-gate lease                                                     | —    | `N/A`           | not acquired by design; **not** claimed as a pass                            |

Gates cycle 1 executed that I did not re-run in full — `deno task test` (4109/0), the 2919-file
`check`, `ci:quality`, publish dry-runs, `fresh-browser`, `docs-source-format`, `docs-accuracy`,
scoped lint/fmt — were left to cycle 1's independently produced evidence, as the brief directs.
Where those rows had a cheap decisive probe I took it: the `test` row is corroborated by the
retained red/green receipt pair plus the two focused suites I did run.

## Process Verification

| Check                                  | Result | Evidence                                                                                                               |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS` | `plan-eval.md` cycle 2 formal `PASS`, committed `c694cfb31`, before the first impl commit `586b55135`                  |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design`                                                                                               |
| Commit slices match design plan        | `PASS` | 4 slices in plan order: S1 `586b55135`+`e39970fd3`, S2 `f869a5bfe`, S3 `2977c8333`, S4 `71c264458`+`e3a5a2d28`         |
| Supervisor sign-off precedes successor | `PASS` | all four ancestor checks true (table above)                                                                            |
| No lane self-certified                 | `PASS` | implementer Codex GPT-5.6 Sol; Tier-A supervisor separate; cycle-1 evaluator `430d5f91-…`; this session `31c4cfa9-…`   |
| Each slice has a passing gate          | `PASS` | 52 receipts, every `gitHead == actualGitHead`, every attested head reachable                                           |
| Agent brief carries `## SKILL`         | `PASS` | `implement.md` contains a `## SKILL` chapter (protocol rule 13); the PR body is template-governed and correctly exempt |
| No speculative seams                   | `PASS` | 9 changed non-run-artifact paths, all reachable and exercised                                                          |
| Constants for finite vocabularies      | `PASS` | `ALLOWANCE_RECORD`, `ISSUE_REFERENCE`, `ALLOWANCE_OWNER_REPOSITORY`, `DEFAULT_ROOTS`, `GENERATED_OR_VENDOR_DIRS`       |
| Close-gate honored (rule 12)           | `PASS` | mapping valid with exact coverage; simulated mirror ticks 9/9 and 5/5 including #1378's `gate:` box, 0 left unchecked  |
| Release-gate class (rule 14)           | `N/A`  | not a cut or release-gating run                                                                                        |

## Anti-Pattern Check

| AP     | Status          | Evidence                                                                                                          |
| ------ | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| AP-1   | `CLEAR`         | No new abstraction layer; the scanner was extended in place per the plan's "do not create a third quality engine" |
| AP-4   | `CLEAR`         | Issue resolution sits behind the injected `AllowanceIssueResolver` port; fixtures live in tests                   |
| AP-7   | `CLEAR`         | No plugin-identity branching added; the `plugin-name-check` rule and its taint tracking are preserved             |
| AP-12  | `CLEAR`         | No suppression introduced — every `deno-lint-ignore` token in the diff pre-exists at `01e096049`                  |
| AP-19  | `DEBT_ACCEPTED` | Workers `private-type-ref` baseline under `workers-private-type-ref-1655`                                         |
| Others | `N/A`           | Outside the touched surface                                                                                       |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                             |
| --------------------- | ----- | -------------------------------------------------------------------- |
| New entries           | 1     | `workers-private-type-ref-1655` — complete, strict no-increase       |
| Resolved entries      | 0     | —                                                                    |
| Deepened violations   | 0     | cast count unchanged (7 → 7); allowance population unchanged (7 → 7) |
| Unrecorded violations | 0     | —                                                                    |

Unchanged from cycle 1; the editorial fix touched no debt registry.

## Findings

| Severity | Finding                                                                                                                                                                                                                  | Evidence                                                                                                                                                                                                                                                                                   | Required action                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| —        | **No blocking finding.** Cycle 1's sole blocker is fixed and independently re-verified by execution.                                                                                                                     | 0 errors, 0 warnings, exact 9/9 and 5/5 coverage against live state; simulated mirror leaves 0 actionable boxes unchecked.                                                                                                                                                                 | none                                                                                               |
| low      | A publicly reachable `any` is reported twice (`explicit-any` + `public-any` at the same `file:line`).                                                                                                                    | Probe with a real export graph: 3 findings for 2 defects. Does not affect `ok`, budget, or allowance count — one marker suppresses both rules and yields `allowCount: 1`.                                                                                                                  | none for this leaf — locked plan behaviour; consider single-attribution as a #1276/#1378 follow-up |
| low      | The scanner CLI silently ignores unknown flags; a typo'd `--max-allow` leaves `maxAllow` `undefined`, disabling the ceiling.                                                                                             | Re-verified: 2-allowance fixture with `--max-allow 1` → exit 1; same fixture with `--max-allow-typo 1` → exit 0. The same `flatMap` idiom exists at the base (`01e096049` lines 248-254), so **pre-existing, not a regression**. Committed `deno.json` tasks spell the flag correctly.     | none for this leaf — optional hardening follow-up                                                  |
| note     | Precision correction to a cycle-1 row, **not** a defect: cycle 1 recorded "No new `// deno-lint-ignore` — zero additions across the diff". There is in fact **one** `+` line containing that token.                      | The line is the regenerated single-line embedded blob in `agent-tools.generated.ts`, which carries the scanner's pre-existing **detection regex** (`scan-code-quality.ts:74`, present at base as line 65). Base and head both contain exactly 1 occurrence. Net suppressions added: **0**. | none — the row's substance (no suppression added to green a wrapper) is correct                    |
| note     | Precision correction to a cycle-1 row, **not** a defect: cycle 1 recorded the 7 allowances as having "distinct specific reasons". Five of the seven share an identical reason string (the `public-api.ts` facade sites). | Live scan output. The contract in `ALLOWANCE_RECORD` and #1545 box 1 requires a **specific** reason, not a **distinct** one, and the five identical reasons describe the same defect at five sites in the same facade.                                                                     | none — acceptance criterion is satisfied as written                                                |

No finding was softened to reach `PASS`, and no praise is recorded.

## Lessons for Promotion

| Lesson                                                                                 | Pattern                                                                                                                                                                           | Applies to         | Confidence |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- |
| Verify an evidence-bookkeeping fix by simulating the mutation, not just the validation | Passing `validateEvidenceMapping` proves the mirror will not throw; running `checkAcceptanceBoxes` on the mapping proves it will actually tick every box, including `gate:` boxes | all harness leaves | high       |
| GitHub `userContentEdits` makes a PR-body edit auditable                               | An "editorial fix" claim is checkable against the revision history rather than the author's description, so boundedness becomes evidence instead of assertion                     | all harness leaves | high       |
| A public-surface rule needs a package with real `exports` to probe                     | Probing `public-any` from a bare directory silently produces only `explicit-any`, which reads as "no double-count" and would have confirmed the wrong answer                      | archetype 6 tools  | high       |

## Verdict

| Field         | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict       | `PASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Evaluated SHA | `84bbcf9a185a1bc29072f1feecc1b7d08f3f18b2`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Rationale     | Cycle 1's sole blocker is resolved and re-verified by direct execution against live state, not via the label-guarded mirror dry-run: `validateEvidenceMapping` now returns cleanly for both closing issues with zero errors, zero parse warnings, and exact coverage — 9/9 for #1378 and 5/5 for #1545 — with all 14 entries sourced from the single Slice 4 `[PHASE: IMPL]` comment and no `PENDING` evidence anywhere in the consumed corpus. The edit is bounded against GitHub's own revision history: exactly the two superseded blocks removed, one line added, the operative do-not-merge rule byte-identical, and every other body section including the full 12-item Definition of Done preserved. Simulating the mirror's mutation shows it will tick 9/9 and 5/5, including #1378's `gate:` box, so the close-gate is provably satisfiable rather than merely non-throwing. No product file, receipt, gate, label, readiness state, issue body, or publication changed — head still `84bbcf9a1`, still draft, still `status:impl`, milestone `0.0.7`. Cycle 1's PASS rows survive spot-verification: `allowCount: 7` on both scans and green after a materialized merge with live `origin/main`; consumer portability re-derived from scratch with a foreign-CWD run and a failing bare-specifier control, confirming the Slice-2 sign-off was wrong and the D-12 repair correct; the Workers baseline is the honest exact-20 `private-type-ref` red under a complete #1655 debt entry; no binding receipt names an out-of-history object; nine authorized surfaces, no lock churn, no suppression, byte-fresh generated asset; all four Tier-A sign-offs precede their successors. Two low observations and two precision corrections to cycle-1 wording are recorded; none blocks. Approved scope is complete. Merge, ready-flip, and label transitions remain the coordinator's call. |
