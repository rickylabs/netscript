# IMPL-EVAL cycle 3: PR #1427 — #1333 default-app reference quality

**Verdict: PASS**

Evaluator session: separate from the generator; read-only against `/home/codex/repos/ns005-w3b1`.
All mutating verification ran in a disposable clone at `/tmp/eval-1427-c3` with scaffolds at
`/tmp/eval-scaffold-c3` (published-source probe) and `<clone>/.llm/tmp/eval-scaffold-local`
(local-source probe); all were removed after evaluation. The writer worktree was never modified.
Every command below was executed by this session unless marked otherwise. `deno task e2e:cli` was
not executed in any form; serialized-runtime evidence is relied on from ledger rows 74/75 per the
brief.

## Head and delta verification

- `gh pr view 1427 --json headRefOid` = `da7cf70a40f0854659e53cb1cfc1bf9273dd6880` at start and at
  end of evaluation; `git rev-parse HEAD` in the review worktree = same; tree clean. No divergence.
- **Head-vs-evidence, executed rather than carried forward:** `git diff --stat 08e56bfad..da7cf70a4`
  = exactly four files, all under `.llm/runs/release-0.0.5--orchestration/slices/scaffold-1333/`
  (context-pack.md, drift.md, leak-report.md, worklog.md), zero product source. The row-74/75
  receipt earned at authorized head `08e56bfad` covers the reviewed head.
- Cycle-3 product delta (`c0b25a2e1..08e56bfad`, excluding run artifacts): both island templates
  (1 line each), `embedded.generated.ts` (2 specifier lines), and the new guard in
  `public-command-tree_test.ts` (+42 lines). Nothing else — no room for a repair-introduced defect
  outside what was verified below.

## C2-F1 repair — verified in the emitted tree, not just the template tree

- Templates: `ServiceShowcaseLab.tsx.template:26` and `ServiceShowcaseLab.memory.tsx.template:26`
  both read `from '../(_lib)/optimistic-list-mutation.ts'`.
- Barrel: entries at `embedded.generated.ts:79` and `:81` both embed the corrected specifier; the
  only remaining `service/(_lib)/…` string is the asset key at line 224, not an import.
  `deno task check:assets-barrel` executed at the clean head: **exit 0**, tree clean afterwards.
- **Executed scaffold, published source** (`netscript.ts init eval-probe --db none --service
  --service-name users --ci --yes --no-git --force`): exit 0; emitted island at
  `routes/examples/users/(_islands)/ServiceShowcaseLab.tsx:22` imports
  `'../(_lib)/optimistic-list-mutation.ts'`; factory exists at
  `routes/examples/users/(_lib)/optimistic-list-mutation.ts`. The generated `deno task check` shows
  **no TS2307 and no TS7006** — the C2-F1 signature is gone.
- **Executed scaffold, local source** (`netscript-dev.ts` contributor binary, which maps
  `@netscript/fresh`/`fresh-ui`/`sdk` to workspace paths — the lane cycle 2's probe missed): the
  Deno workspace type-check batch, including every example route, the island, and the factory,
  passed with **zero diagnostics** (`exitCode: 0` in the quality-runner JSON). This is the exact
  check class C2-F1 failed.

## Cycle-2 deferred observations — independently adjudicated, agreement

Under the published-source probe the same three diagnostics reappeared byte-for-byte (`TS2345`
QueryClientPort at `(_shared)/service-showcase.ts:91`, `TS2345` withForm and `TS18046` at
`examples/users/index.tsx:52/57`). Under the local-source probe **none reproduced** — executed by
this session, not taken from the ledger. The published-vs-workspace drift attribution stands; they
are not defects of this PR. The only other red in both probes is the Aspire helper `tsc` load
failing because `aspire restore` was never run in the probe — the documented AppHost prerequisite,
which the runtime suite satisfies before its check.

## Recurrence guard — proven falsifiable, with one scoped coverage note

- Clean head: `deno test -A --unstable-kv …/public-command-tree_test.ts` → 3 passed / 0 failed.
- Mutation A (memory variant): broke `ServiceShowcaseLab.memory.tsx.template:26` back to
  `'../service/(_lib)/…'`, regenerated the barrel → **red** with the exact diagnostic
  `Unresolved emitted relative import: routes/examples/users/(_islands)/ServiceShowcaseLab.tsx
  imports ../service/(_lib)/optimistic-list-mutation.ts but … does not exist`
  (2 passed / 1 failed). The guard can fail.
- Mutation B (DB-backed variant): the same broken specifier in `ServiceShowcaseLab.tsx.template`
  plus barrel regeneration → the suite **stays green** (3 passed). Cause: the test fixture
  scaffolds `--db none` (`public-command-tree_test.ts:166-167`), which emits only the memory island.
  **Non-blocking observation, not a finding against this head:** both barrel entries are correct at
  `da7cf70a4`, and row 75's `generated.deno-check` ran against a DB-backed scaffold, so the DB
  variant is proven at this head; but a future regression confined to the DB island evades the fast
  guard and surfaces only at the next serialized `scaffold.runtime`. Answering the standing
  question: the edit that breaks the guard is deleting the
  `assertExampleRelativeImportsResolve(serviceApp)` call at line 124 or the broken-import mutation
  above (memory variant); the edit that evades it is a broken import confined to the DB-backed
  island or to a non-relative specifier (the regex checks only `./`/`../` forms).
- Two-layer caveat unchanged from cycle 2: a template edit alone is invisible until barrel
  regeneration; that layer is held closed by CI's `check:assets-barrel`, re-executed here at head
  (exit 0).

## C2-F2 — receipt citation repaired

- PR body Validation now cites "Serialized `scaffold.runtime` ledger row 74 at `08e56bfad` — raw
  exit 0; passed=80 failed=0 skipped=2 total=82"; DoD row-9 evidence links receipt comment
  `5233795184`. The superseded row-72/73 citation is gone.
- Receipt comment `5233795184` fetched: `[SLICE: SERIALIZED-RUNTIME-74] [VERDICT: PASS]`, grant at
  orchestrator `aaed43a53` before execution, authorized head `08e56bfad`, one execution, leak
  bracket clean pre/post, `generated.deno-check` PASS 4.231s, `behavior.app-reference` PASS 59.983s
  desktop+mobile, both skips the #1398 deferrals. Matches the ledger.
- Ledger verified directly (`expensive-gate-log.md` rows 74/75 on the orchestrator branch): row 74
  **granted** before execution, row 75 **released — pass** at `08e56bfad` with
  `RAW_EXIT_CODE=0`, total=82 (not a fail-fast truncation; row 70's red stopped at 19), and its own
  re-executed head-vs-evidence check to `da7cf70a4`. The PR's "row 74" naming refers to the grant
  row; the result is ledger row 75 — the numbering is consistent between worklog, receipt, and
  ledger.
- `Closes #1333` restored in the body; `closingIssueReferences` = [1333] via body keyword.
- Close-gate: `check-close-gate.ts --repo rickylabs/netscript --pr 1427` executed →
  `prFindings: []` (the fenced `acceptance-evidence` block parses and maps **9/9** against #1333's
  checkbox first lines); the remaining findings are exactly the nine issue checkboxes the mirror
  ticks at `status:ready-merge`, matching the documented draft-first sequence
  (PR is draft at `status:impl`, exactly one `status:` label, milestone 0.0.5).

## Byte ceilings — recomputed independently

- App template sources: 178,347 / 197,796 (`find assets/app -type f | xargs cat | wc -c`).
- Embedded barrel: 296,350 / 330,000 (`wc -c embedded.generated.ts`).
- Both are exactly 16 bytes below the PR body's figures (178,363 / 296,366) — the repair deleted
  `service/` (8 bytes × 2 templates, mirrored in the barrel), so the body's numbers are
  pre-repair-stale by 16 bytes. Under budget either way; trivial, no action required.
- MCP docs corpus: `git diff 35358886a..HEAD -- packages/mcp` is empty, so the measured
  253,535 / 262,144 stands; the 262,144 cap is enforced in
  `.llm/tools/generate-publish-assets.ts:31` (`MCP_EMBEDDED_DOCS_MAX_BYTES`, throws over budget).
  The 197,796/330,000 figures are plan slice budgets (plan.md § 9), not repo gates — consistent
  with how they were granted. Nothing was dropped to fit: the cycle-3 delta deletes no files and
  only removes 16 bytes of specifier text.

## Process evidence

- `agentic:review-threads` PR 1427: PASS, threads=0 unanswered=0 (executed).
- Labels: `type:fix`, `area:cli`, `area:fresh`, `area:fresh-ui`, `priority:p0`, exactly one
  `status:` = `impl`; milestone 0.0.5.

## Intent — re-answered

Cycle 2's answer was "violated at first contact." At this head it is not: an executed scaffold
emits a resolvable tree whose workspace type-check passes with zero diagnostics under
matching-version (local-source) packages; the row-75 receipt shows the same project boots through
Aspire and renders all canonical reference states at desktop and mobile. The three published-source
diagnostics in my probe are version skew against the not-yet-published 0.0.4 packages, inherent to
evaluating pre-publish, and reproduce in no matching-version environment. A developer scaffolding
from this head gets a reference app they would keep.

## Explicitly not verified

- `scaffold.runtime` itself was not re-run (no token); rows 74/75 and receipt `5233795184` are
  relied on as ledger evidence per the brief, cross-checked against the PR body and worklog.
- `behavior.app-reference` browser rendering was not independently reproduced; relied on row 75.
- The Aspire AppHost batch was not restored/compiled in the probes (documented prerequisite).
- Cycle-1/-2 findings not re-verified where no commit since `c0b25a2e1` touches them (F1-F8
  remediations, S1-S4 content, doctrine/debt numbers): the cycle-3 product delta is confined to the
  two template lines, two barrel lines, and the guard test, so their cycle-2 verification stands.

## Verdict rationale

Both cycle-2 blocking findings are remediated with executed, reproducible evidence: the emitted
import resolves and type-checks clean in a real scaffold (the exact check C2-F1 failed), and the
runtime evidence now cited was earned at the repaired head under a recorded grant, with the
head-to-reviewed-head delta re-verified as artifacts-only by this session. The new guard is proven
falsifiable by executed mutation. The repair introduced no new defect — its entire product surface
is two one-line template fixes, the regenerated barrel, and the guard, each verified directly. The
one residual weakness (the fast guard does not exercise the DB-backed island variant) does not
affect the correctness of this head, is covered by the serialized gate that just ran green at this
head, and is recorded above as a non-blocking observation for the writer or a follow-up. No
genuinely blocking, newly discovered defect exists. **PASS.**
