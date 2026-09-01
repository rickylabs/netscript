# IMPL-EVAL: #1737 / PR #1830 — canonical tree references in shipped skills

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-skills-canonical-tree-refs--1737` |
| Target         | Shipped CLI agent skill bundle (`skills/` + generated barrel) |
| Archetype      | `6 - CLI / Tooling` |
| Scope overlays | none |
| Evaluator      | Separate opposite-family session (Claude family / GLM 5.3 Flash via Claude Code), 2026-08-31 |
| Evaluated head | `84ef7bf740ce5f837fbdd8c7e2f3bae6dca2271b` |
| Base           | `main` at `26e1b486f95aec121d71f2f4cd0411dc6069af04` (merge-base with head = `eaea940be`, the recorded re-baselined baseline) |
| Generator      | GPT-5.6 Sol (Codex WSL, `supervisor.md`) — session separation honored; this session authored no source |

Evidence standard: every exit below was captured as `out=$(cmd 2>&1); rc=$?` in this session. No
piped `rc` and no inherited author count is used as proof.

## Independent verification (re-derived, not inherited)

### 1. RED is genuine — verified against the commit, not the live tree

Throwaway detached worktree at `d338145da` (`git worktree add --detach /tmp/eval1737-red`,
rc=0; removed again after the experiments, rc=0):

- `git status --short` **before** running anything → output empty, rc=0 (clean; the #1827
  false-RED trap — testing a fixed working tree — was not possible here).
- `deno test --allow-read skills/canonical-tree-references_test.ts` → **rc=1**,
  `0 passed | 1 failed`, assertion diff names exactly
  `"netscript/SKILL.md"` and `"netscript-operate/SKILL.md"`. Matches the worklog claim verbatim.

### 2. GREEN is attributable to the source fix, not a loosened test

- Blob ids: `git rev-parse d338145da:skills/canonical-tree-references_test.ts` →
  `c3ec7949d89d44764b857dbf3d3d2df0cf8416d3` (rc=0); same at `84ef7bf74` →
  `ae1ead7226ee997d9e538c9b1065411cda041afc` (rc=0). The test **did** change between RED and GREEN.
- Full blob diff reviewed: quote style only (`"` → `'`, incl. the import), i.e. `deno fmt`
  conformance. The discovery loop, the `/SKILL.md` filter, the `.claude/skills/` substring, the
  `assertEquals(mirrorReferences, [])`, and the failure message are **byte-identical in meaning**.
  No assertion was weakened. Non-blocking.
- Source fixes are minimal: `git diff 26e1b486...84ef7bf74 -- skills/netscript/SKILL.md
  skills/netscript-operate/SKILL.md` shows exactly one changed line per file
  (`.claude/skills/help.md` → `.agents/skills/help.md`; netscript line 43, netscript-operate
  line 50).
- Focused test at head → **rc=0**, `1 passed | 0 failed`; `git status --short` after the run →
  empty.

### 3. The test is not vacuous — mutation-proven in the throwaway worktree at head

| Experiment | Mutation | Captured result | Reading |
| --- | --- | --- | --- |
| Teeth-A (new offender) | Appended `.claude/skills/` probe to `skills/netscript-build/SKILL.md` (not one of the two known offenders) | **rc=1**, offender list contains `netscript-build/SKILL.md` | Guard generalizes beyond the two written cases — not a two-case detector. |
| Missing file | Deleted `skills/deno/SKILL.md` (manifest-listed) | **rc=1**, `NotFound` readfile error | A manifest entry pointing nowhere fails loudly; no silent "no offenders". |
| Gap-B (shipped non-SKILL.md) | Appended `.claude/skills/` probe to `skills/help.md` (manifest-listed, not a `*/SKILL.md`) | **rc=0** — test passes despite a live offender | Real forward-looking coverage gap → Finding F-2. `help.md` is clean at base and head (grep rc=1, 0 matches), so nothing ships dirty today. |
| Vacuity | `manifest.files` set to `[]` | **rc=0** — vacuous pass | Requires gutting a tracked file; mitigated by tracked manifest + bundle hash + `check:assets-barrel`. → Finding F-3. |

All mutations were reverted (`git checkout -- .` → status empty before worktree removal).

### 4. Shipped surface is clean — independently counted

`grep -c '\.claude/skills/' packages/cli/src/kernel/assets/skills.generated.ts` → **0** (grep
rc=1, no match). Repo-tree sweep of `skills/` at head: the only two occurrences of the literal are
inside the regression test itself (detection string + assertion message); every shipped body is
clean. `help.md` (shipped) is clean at base and head.

### 5. Regenerated barrel is honest

- `git diff 26e1b486...84ef7bf74 -- packages/cli/src/kernel/assets/skills.generated.ts` → exactly
  3 changed lines: the two embedded body strings (`netscript/SKILL.md`, `netscript-operate/SKILL.md`)
  each flipping `.claude/skills/help.md` → `.agents/skills/help.md`, plus
  `EMBEDDED_SKILL_BUNDLE_HASH` `264a88bd…` → `5e5b2bf8…`. No other skill body, no unrelated churn,
  no other lane's drift landed in the carrier.
- `deno task check:assets-barrel` at head → **rc=0**; `git status --short` empty before and after
  the run → output is true generator output, not hand editing.
- Generator input confirmed: `.llm/tools/generate-cli-assets-barrel.ts:40` reads
  `../../skills/manifest.json` and `:225-226` reads `../../skills/${path}` — root `skills/` only.

### 6. Scope discipline

`git diff --name-status 26e1b486...84ef7bf74` → exactly:
7 × `A .llm/runs/fix-skills-canonical-tree-refs--1737/*`, `A skills/canonical-tree-references_test.ts`,
`M packages/cli/src/kernel/assets/skills.generated.ts`, `M skills/netscript/SKILL.md`,
`M skills/netscript-operate/SKILL.md`. Nothing else under `packages/` or elsewhere.
`git diff 26e1b486...84ef7bf74 -- deno.lock` → zero-length diff, rc=0; worktree
`git diff --exit-code -- deno.lock` → **rc=0**. Lock hygiene holds.

### 7. Mirror hygiene

- Leaf diff contains **zero** `.claude/skills/**` paths (see §6 file list) — no mirrored file was
  hand-edited.
- `deno task agentic:sync-claude` at head → **rc=0**, "SYNCED: 18 skill(s), 22 mirrored file(s)",
  and `git status --short` **after the mutating sync is empty** → the mirror was already
  byte-current, proving no hand edits and no drift.
- `deno task agentic:sync-claude:check` → **rc=0**, "OK: 18 skill(s), 22 mirrored file(s)".
- `validate-claude-surface.ts` trigger not met: no Claude config, `.claude/skills/`, hook, or
  orchestration-doc file changed → N/A.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate / PLAN-EVAL before implementation | PASS | `PLAN-EVAL: N/A` recorded in `plan.md` + `worklog.md`, committed with S1 (`d338145da`) before the GREEN commit; justified per plan template (issue-defined two-line mechanical fix). |
| Design section in worklog | PASS | `worklog.md` `## Design` (surface, vocabulary, constants, slice table). |
| Commit slices match design plan | PASS | S1 RED `d338145da` (test + run artifacts), S2 GREEN `84ef7bf74` (2 sources + barrel + artifacts) — exactly the planned two slices. |
| Each slice has a passing gate | PASS | S1 gate = RED rc=1 (expected-fail gate); S2 gates re-captured green in §1–§7 above. |
| No speculative seams | PASS | No new runtime code; one test file, no dead helpers. |
| Constants for finite vocabularies | PASS | No new string-literal vocabularies; canonical-vs-mirror vocabulary documented in worklog. |

## Gates (evaluator-captured)

| Gate | Command | Result |
| --- | --- | --- |
| Focused regression (RED, commit-level) | `deno test --allow-read skills/canonical-tree-references_test.ts` @ `d338145da` | rc=1 (expected), 2 offenders named |
| Focused regression (GREEN) | same @ head | rc=0 |
| Asset-barrel currency | `deno task check:assets-barrel` | rc=0, tree unchanged |
| Mirror sync (mutating no-op proof) | `deno task agentic:sync-claude` | rc=0, zero tracked diff after |
| Mirror byte-current check | `deno task agentic:sync-claude:check` | rc=0 |
| Lock hygiene | `git diff --exit-code -- deno.lock` | rc=0 |
| Scope | `git diff --name-status 26e1b486...head` | exactly the declared file set |
| Runtime / consumer E2E | n/a per plan | no runtime, command, scaffold, or exported-surface change |

## Shared-carrier declaration check (per brief — not scored against this leaf)

**The declaration is inaccurate.** `drift.md` ("Shared generated carrier with PR #1759") and the
PR #1830 body section `## Shared carrier` both state that PR #1759 also generates
`packages/cli/src/kernel/assets/skills.generated.ts` and owns root `skills/aspire/SKILL.md` +
`skills/help.md`. Verified against the actual PR:

- `gh pr view 1759 --json files` (head `042ff3ca5`, identical to local branch tip) →
  `barrel:false`, `generated_barrels:[]`, `root_skills_files:[]`. #1759 touches
  `.agents/skills/aspire/SKILL.md`, `.claude/skills/aspire/SKILL.md`,
  `.agents/generated/consumer-skills/**`, and `sync-claude-skills.ts` — **none of which feed
  `skills.generated.ts`** (generator input is root `skills/` only, §5).
- Consequence: the predicted textual merge conflict cannot occur; the coordinator's merge-ordering
  constraint is unnecessary (dropping it is safe). The error is in the conservative direction and
  has zero code impact, so it does not block this leaf — but the drift entry and PR comment should
  be corrected so the coordinator does not serialize against a phantom collision.

## Repo-wide `deno task test` (disclosed as not run)

Not launched by this evaluator, per brief. Judgment: **not required** for an honest verdict on this
slice — no runtime TypeScript behavior changed; the new test, focused run, scoped check/lint/fmt,
barrel currency check, and mirror byte-current check cover every touched artifact. Standing
recommendation only: the leaf's scoped check targeted `--root skills`, so the generated barrel's TS
was not type-checked by the leaf itself; CI's root `deno task check` covers it, and the barrel
change is shape-identical string content (risk ≈ 0). If the coordinator wants belt-and-braces
before merge, root `deno task check` is the cheap filler — not a full test run.

## Findings

| Severity | Finding | Evidence | Disposition |
| --- | --- | --- | --- |
| Medium | Shared-carrier declaration inaccurate: PR #1759 does not modify `skills.generated.ts` nor root `skills/` files; the declared collision is phantom | §Shared-carrier check above; generator input `generate-cli-assets-barrel.ts:40,225-226` | Fix drift log + PR comment in a follow-up; **non-blocking** (conservative-direction doc error; explicitly not scored against this leaf per brief). Merge-ordering constraint on #1759 can be dropped. |
| Low | Regression test scans only manifest-listed `*/SKILL.md`; shipped non-SKILL.md bundle files (`help.md`) are unguarded — proven miss | Gap-B experiment: injected offender in `skills/help.md` → rc=0 | Follow-up test hardening (scan all manifest-listed files except `manifest.json` itself). Non-blocking: matches plan L1's locked scope, and `help.md` is clean today. |
| Low | Vacuous-pass vector: empty `manifest.files` yields rc=0 | Vacuity experiment: emptied manifest → rc=0 | Fold into the same follow-up (assert the scanned set is non-empty). Mitigated today by tracked manifest + bundle hash + `check:assets-barrel`. |
| Info | Test blob changed between RED and GREEN commits | §2: quote-style-only diff | No action — `deno fmt` conformance; assertions unweakened. |

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-5 public-surface ambiguity | CLEAR | Canonical (`.agents/skills/`) vs derived (`.claude/skills/`) ownership now explicit in prose, guarded by a manifest-driven regression test, and mirrored byte-current. |
| All others | N/A | Docs + generated-asset slice; no package/plugin source, layering, or publish-surface change. |

## Arch-Debt Delta

| Metric | Count |
| --- | --- |
| New entries | 0 |
| Resolved entries | 0 |
| Deepened violations | 0 |
| Unrecorded violations | 0 (the F-2/F-3 test-hardening items are follow-ups, not doctrine violations) |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Verify shared-carrier/collision declarations against the actual PR file list before recording them in drift | Drift entries sourced from supervisor claims can encode stale plans (here: #1759's plan diverged from its landed diff) | All multi-leaf runs | High |
| Manifest-driven guards should assert a non-empty scan set so corpus shrinkage cannot go green | Empty-corpus vacuity (proven rc=0) | Archetype 6 asset guards | Medium |

## Verdict

The defect is fixed at both sources, the fix provably propagates to the consumer barrel, the
regression test is genuine RED→GREEN with the test itself unweakened and mutation-proven to catch
new offenders, scope and lock hygiene are exact, and the mirror is byte-current without hand edits.
Remaining findings are documentation-accuracy and forward-looking test-hardening items, none
blocking.

VERDICT: PASS
