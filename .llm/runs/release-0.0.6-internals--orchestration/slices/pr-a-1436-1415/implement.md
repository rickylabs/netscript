use harness

# PR-A — gate trust: close-gate keyword parser (#1436) + acceptance-evidence assertion (#1415)

You are the **implementation agent** for the first slice of the 0.0.6 chores/internals lane. Two
single-predicate repairs in `.llm/tools/validation/`, one PR, closing two issues.

Your orchestrator is a Claude Opus 5 high session in
`/home/codex/repos/netscript-006-internals` on branch
`chore/release-0.0.6-internals-orchestration`. It holds merge authority. You implement, gate, and
report; you do not merge.

## SKILL

- `netscript-harness` — run artifacts, commit trail, slice discipline.
- `netscript-tools` — the scoped validation wrappers; what counts as a verdict vs a non-verdict.
- `netscript-pr` — branch/PR/label mechanics, closing keywords, the fenced `acceptance-evidence`
  block, the close-gate operator playbook.
- `netscript-deno-toolchain` — deterministic `deno test` behaviour and task semantics.
- `rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-gatetrust` |
| Branch | `fix/1436-1415-close-gate-trust` |
| Base | `01aa12b67` (= `origin/main` at 2026-08-12) |
| Run dir | `.llm/runs/release-0.0.6-internals--orchestration/` |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-a-1436-1415/` |
| Draft PR | **#1527** — already open, already labelled, body already written. Comment on it; do not open another. |
| Closes | #1436, #1415 |

Work **only** in that worktree. Do not touch any other worktree, and do not rebase or force-push.

## Why this slice exists

Both issues are the same defect in two places: a gate that reports faithfully while checking the
wrong property. #1436 makes the close-gate **invent** a requirement it can never satisfy; #1415 lets
the acceptance mirror **absolve** one. Every later PR in this lane merges through both, so this PR
lands first.

---

## Part 1 — #1436: the closing-keyword parser

### Read this before you write any code

**The fix prescribed in the issue body is a no-op. Do not implement it as written.**

#1436 says the parser matches closing keywords "without a word boundary" and prescribes
`\b(clos(e|es|ed)|fix(es|ed)?|resolv(e|es|ed))\b\s+#\d+`. The orchestrator executed the parser at
`01aa12b67` and the word boundary is **already there** —
`.llm/tools/validation/acceptance-evidence.ts:43` already reads
`/\b(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+…/gi`, and the fenced-block
stripping the issue does not mention is already there too (`:47`, landed by #1303).

`\b` is the **cause**, not the cure: `-` is a non-word character, so `\bfix\b` matches the `fix`
inside `pre-fix`. Executed baseline (`../../evidence/probe-1436-baseline.ts`, run from the repo root):

```text
"Exact pre-fix #1431 head"      -> [1431]   # the reported defect
"un-fixed #555"                 -> [555]    # a second instance, NOT mentioned in the issue
"hotfix #999 landed"            -> []       # the issue predicts this breaks; it does not
"prefixes #888 there"           -> []       # ditto
"This is a bugfix #777"         -> []       # ditto
"Closes #1234 and fixes #4321"  -> [1234,4321]
"Refs #111" / "Part of #222"    -> []
"resolves https://github.com/rickylabs/netscript/issues/333" -> [333]
```

Adding another `\b` changes nothing while looking like a fix. This repo has shipped exactly that
before — `.llm/harness/workflow/milestone-run.md` § Gate integrity records two guards whose predicate
could never fire, which "did nothing and looked correct". **A patch that leaves
`pre-fix #1431 -> [1431]` unchanged is a failed slice, not a green one.**

### Contract 1a — keyword boundary

`extractClosingIssues` must not treat a keyword as closing when it is preceded by a word character
**or a hyphen**. The predicate shape is a negative lookbehind excluding both — `(?<![\w-])` — not
another `\b`. Trailing boundary behaviour is already correct; keep it.

Must return `[]`:

| Input | Reason |
| --- | --- |
| `Exact pre-fix #1431 head` | the reported defect |
| `un-fixed #555` | second hyphen instance |
| `re-resolved #444` | third form, verb stem |
| `hotfix #999 landed` | already passing — must stay passing |
| `prefixes #888 there` | already passing — must stay passing |
| `This is a bugfix #777` | already passing — must stay passing |
| `Refs #111`, `Part of #222`, `See #333` | non-keyword references |

Must still return the number:

| Input | Expected |
| --- | --- |
| `Closes #1234 and fixes #4321` | `[1234, 4321]` |
| `FIXES #12` / `Resolved #13` | case-insensitive |
| `resolves https://github.com/rickylabs/netscript/issues/333` | `[333]` |
| `Fixes #1434` at line start, and after `(`, `,`, `:` or a newline | still matches |

A keyword preceded by `(` or `"` or `*` must still match — the lookbehind excludes word characters
and hyphens, nothing else. Add that as an explicit case so a future tightening cannot silently
break `(fixes #1)`.

### Contract 1b — a reference that resolves to a pull request is not a closing issue

#1436's second half: "if the parser believes a PR will be auto-closed, that belief is wrong on
GitHub's semantics and should not gate a merge." The observed run demanded acceptance evidence for
**#1431, a pull request**, which has no acceptance checklist for the mirror to tick — an
unsatisfiable requirement.

Where this goes: `resolveClosingIssueReferences` in `.llm/tools/validation/check-close-gate.ts`
already unions three sources — GitHub's own authoritative set from `getClosingContext`, plus
body-regex and commit-message matches. The authoritative set is issues by construction; the
**regex-derived** additions are the ones that can be PR numbers. Filter those.

Requirements, all three of them:

1. Keep `resolveClosingIssueReferences` **pure and synchronously testable**. Do not put a network
   call inside it. Pass in the resolution result, or filter at the call site in `main()` where the
   `GitHubClient` already exists, or take an injected async resolver — your choice, but the pure
   unit-testable core must survive.
2. **Fail loud, never silently drop.** If the PR-vs-issue lookup fails (network, rate limit, 404),
   the reference must be *retained* and the uncertainty reported in the gate output. A lookup error
   that silently removes a closing issue turns #1436 into its mirror image — a gate that misses a
   requirement. Say which numbers were classified and how.
3. Report the classification in the gate's output so a reviewer can see *why* a number was excluded.
   A number vanishing with no explanation is the silent failure #1436 complains about.

`mirror-acceptance-evidence.ts:54` also calls `extractClosingIssues` directly and then
`client.getIssue(...)` on every result — so a PR number there causes a confusing failure too. Make
the mirror consistent with the gate: it must not attempt to mirror acceptance evidence into a pull
request.

### Contract 1c — the workaround is retired, not preserved

#1436 records that the incident was worked around by rewording PR #1435's body from `pre-fix` to
`pre-repair`. Do not add any comment or doc that tells authors to reword prose to appease the parser.
The parser is the thing being fixed.

---

## Part 2 — #1415: the acceptance mirror validates presence, not assertion

### Current behaviour

`validateEvidenceMapping` (`.llm/tools/validation/acceptance-evidence.ts:114-159`) rejects evidence
only when it is empty (`:142` — `if (!entry.evidence.trim())`). Any non-empty string ticks a box. The
observed instance ticked *"Independent separate-session IMPL-EVAL passes at the final head."* against
the evidence *"— Pending milestone-orchestrator separate-session IMPL-EVAL after this draft
handoff."*

### Contract 2a — reject not-yet-done evidence, narrowly

Put the predicate in **`validateEvidenceMapping`**, not only at the mirror step. Both
`mirror-acceptance-evidence.ts` and the close-gate path share that function, so one predicate covers
both; and the mirror's pre-mutation validation loop already runs it for every closing issue before
the first PATCH, so a rejection cannot leave an earlier issue partially mirrored.

**Apply it only to a box that is about to be newly ticked** — i.e. an entry whose resolved box is
currently `checked: false`. Evidence attached to an already-checked box must not start failing:
historical PR bodies exist, and re-running the mirror on one of them must stay idempotent. This is
also exactly what #1415 asks for ("for any row being newly ticked").

**Keep the match narrow.** Match the evidence as a whole string or a leading token — not a substring
anywhere. Leading-token means: after stripping leading whitespace, dashes/em dashes, and bullet
punctuation, the evidence *begins* with a not-yet-done marker. Markers, case-insensitive:
`pending`, `todo`, `tbd`, `will run`, `after merge`, `not yet`.

Must **fail**, each naming the box text and the offending evidence in the error:

- `Pending milestone-orchestrator separate-session IMPL-EVAL after this draft handoff.`
- `— Pending IMPL-EVAL`
- `TODO: run the gate`
- `TBD`
- `will run after merge`
- `Not yet executed`
- whole-string `pending`

Must **pass** (false-positive corpus — #1415 acceptance box 3 requires this case in the fixtures):

- `supersedes the earlier pending note` — the word appears in a non-asserting position
- `IMPL-EVAL PASS at e730b8bfa; supersedes the pending row` — factual, with a commit hash
- `Gate run URL … ; the pending-migration note no longer applies`
- normal evidence: `pr-checks_test.ts fixture; report.ok gate`

### Contract 2b — the error message is the deliverable

The failure must name (a) the issue number, (b) the exact box text, and (c) the offending evidence
string, and say what to do: supply real evidence or leave the box unchecked. `validateEvidenceMapping`
already collects into `errors[]` and throws them joined — follow that shape exactly so a single run
reports every offending row, not just the first.

---

## Definition of done for this slice

`#1436` has **no acceptance checkboxes at all** (verified live — it is a prose defect report), so
there is nothing for the close-gate to validate on that issue and **the PR body's own
Definition-of-Done is the only record for it**. Write it carefully; the orchestrator's pre-merge gate
checks the PR body against what actually shipped.

`#1415` has **4** acceptance boxes. Every one needs a fenced `acceptance-evidence` entry in the PR
body (see `netscript-pr`), mapped by exact trimmed box text:

1. An acceptance-evidence entry whose evidence asserts not-yet-done fails the mirror/close-gate
   rather than ticking the box.
2. Proven RED: a fixture PR body with `— Pending …` evidence fails, naming the box and evidence.
3. Proven GREEN: normal evidence still ticks, and a factual sentence containing the word in a
   non-asserting position is not falsely rejected — with that case in the test fixtures.
4. Existing `mirror-acceptance-evidence_test.ts` cases still pass.

Box 2 says **proven RED**, and box 3 **proven GREEN**. "Proven" means an executed test that fails
before the change and passes after, with the output in the PR comment — not an assertion that it
would. State the pre-change result explicitly for each.

## Gates you must turn green — these are deliverables, not a checklist

Run each and paste real output (commands + exit codes) into the per-slice PR comment:

| # | Gate | Command |
| --- | --- | --- |
| 1 | validation tool tests | `deno test --allow-read --allow-env .llm/tools/validation/` |
| 2 | scoped type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/validation --ext ts` |
| 3 | scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/validation --ext ts` |
| 4 | scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/validation --ext ts` |
| 5 | baseline probe, re-run against your patched parser | `deno run --allow-read .llm/runs/release-0.0.6-internals--orchestration/evidence/probe-1436-baseline.ts` |
| 6 | mirror dry-run against a real PR | `GH_TOKEN=$(gh auth token) deno run --allow-env --allow-net --allow-read .llm/tools/validation/mirror-acceptance-evidence.ts --repo rickylabs/netscript --pr <your PR> --dry-run --pretty` |

Gate 5 must show `pre-fix`, `un-fixed`, `hotfix`, `prefixes`, `bugfix` all `-> []` while
`Closes #1234 and fixes #4321 -> [1234,4321]` and the issue-URL case still resolve. Paste the whole
output; the orchestrator re-runs it independently before merge.

Gate 6 is the live-path check: the mirror must run cleanly on your own PR (which has no
not-yet-done evidence) and must not attempt to fetch a pull-request number as an issue.

`deno task e2e:cli` is **out of scope** — nothing here touches scaffold, DB, Aspire, or plugin copy
mode. Apply `ci:skip-e2e` and `ci:skip-scaffold` to the PR and **state that choice and its reason in
the opening phase comment** so the cheap lane is visibly intentional rather than an accident. Do not
edit any workflow file to dodge a filter.

## PR mechanics

1. **First commit is the slice-dir bootstrap**, and the draft PR opens in the same session as that
   commit (`netscript-pr` § Draft-PR-on-start). The draft PR's commit list plus your per-slice
   comments are the commit trail; there is no `commits.md`.
2. Slice artifacts go in `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-a-1436-1415/`:
   `worklog.md`, `context-pack.md`, `drift.md`. Keep them current **in the same commit** as the code
   slice they describe — a slice whose commit does not touch the run dir is incomplete.
3. PR body follows the `netscript-pr` template. `## Scope` carries, each on its own line:
   `Closes #1436` and `Closes #1415`. Both are fully resolved by this PR, so both get a real closing
   keyword — bare `#N` and `Refs #N` do not auto-close.
4. Labels: `type:fix`, `area:tooling`, `priority:p1`, `ci:skip-e2e`, `ci:skip-scaffold`, and exactly
   one `status:` — `status:impl` while you work. Milestone `0.0.6`. Do **not** apply
   `status:ready-merge` yourself; the orchestrator sets it after its pre-merge gate.
5. Suggested commit slices (adjust if you find a better cut, and say why in `drift.md`):
   - S1 — slice dir + failing tests for both defects (RED, committed as RED so the record shows it)
   - S2 — keyword boundary fix (`(?<![\w-])`) turning the #1436 cases green
   - S3 — PR-vs-issue classification in the close gate + mirror consistency
   - S4 — not-yet-done evidence rejection in `validateEvidenceMapping` + false-positive corpus
   - S5 — acceptance-evidence block, gate evidence, artifacts final
6. Post one `**[PHASE: IMPL]**` summary comment when the slices are in, listing every gate with its
   real output.

## Boundaries — do not cross these

- Touch **only** `.llm/tools/validation/**` and your slice dir. No `packages/**`, no `plugins/**`, no
  other `.llm/tools/` subtree, no workflow files.
- Do **not** fix, refactor, or tidy anything else you notice in these files. File an issue-worthy
  observation in your `drift.md` and tell the orchestrator; it decides.
- Do **not** widen the not-yet-done predicate into prose policing. #1415 is explicit: "reject
  *unearned ticks*, not police prose."
- Do **not** add a `// quality-allow:`, `deno-lint-ignore`, `@ts-ignore`, `as any`, or
  `as unknown as` anywhere. The pre-merge gate scans the diff for exactly these and a new one is a
  merge blocker, not a style note.
- Do **not** modify `deno.lock` unless a real dependency change requires it; if it changes, say why.
- Do **not** merge, and do not set `status:ready-merge`.

## Escalate instead of going idle

If a gate is red and you cannot turn it green, or a contract above turns out to be wrong, **do not
stop and wait**. Write the finding in your slice `drift.md`, post it as a PR comment, and continue
with the parts that are not blocked. Supervisors going idle at a red gate is the single most
expensive failure mode recorded in this repo's orchestration history — the orchestrator reads your
`worklog.md` and PR comments, and it will steer this same thread.
