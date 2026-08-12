use harness

# PR-C — #1380: make the doctrine verdict table a measurement again, and `arch:check:repo` a verdict

You are the **implementation agent** for the last large slice of the 0.0.6 internals quality rail. The plan
passed PLAN-EVAL (`PASS`, cycle 5). Most of the gate work you might expect is **already done by PR-B** —
read the baseline below before planning anything.

Your orchestrator is a Claude Opus 5 high session in `/home/codex/repos/netscript-006-internals`. It holds
merge authority and owns the draft → ready flip.

## SKILL

- `netscript-doctrine` — **read first.** You are editing the doctrine's own verdict table and its fitness
  gate. This skill is the navigator for what those documents mean.
- `netscript-harness` — run artifacts, slice discipline, commit trail.
- `netscript-tools` — scoped wrappers; verdict vs non-verdict.
- `netscript-pr` — branch/PR/label mechanics, closing keywords, the fenced `acceptance-evidence` block.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-doctrine` |
| Branch | `fix/1380-doctrine-verdict-and-repo-gate` |
| Base | `fa5d0d411` (= `origin/main`) |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-c-1380/` |
| Closes | #1380 |
| Route | Codex · gpt-5.6-sol · **medium** (per-row provenance judgement and the RFC resolution are real decisions) |

## Baseline, measured at your base — this is much better than #1380 describes

```text
deno task arch:check       → exit 0
deno task arch:check:repo  → exit 1,  FAIL=2,  WARN=307
                             1 × A1 : mod.ts missing — required canonical entrypoint
                             1 × A14: unresolved Jest/Vitest global 'it'
                                      (.llm/tools/fitness/check-doctrine_test.ts:41)
```

#1380 records `FAIL=53`. **PR-B (`e391f3aec`) already took it to 2**, by landing `discoverDoctrineRoots()`
and A14 origin-awareness. So:

- **#1380 box 5** — "the A14 rule does not fire on a test importing `describe`/`it` from `@std/testing/bdd`"
  — is **already implemented**. Tick it citing `e391f3aec`; do **not** reimplement it.
- What remains on the gate is **two findings**, and both have a precise cause. Read on.

### The residual A1 is the root-as-package defect

`deno.json`'s `arch:check:repo` runs `check-doctrine.ts` with **no `--root`**, so the checker evaluates the
repository root as a single package and walks trees that are not packages (`.llm/tmp/`, `docs/site/`,
`.llm/tools/`). Fix: have `arch:check:repo` iterate **`discoverDoctrineRoots()`** — the function PR-B already
landed. That kills the A1 and satisfies boxes 4 and 6 in one change. Do not write a second selector.

### The residual A14 is self-referential, and the fix already exists elsewhere in the repo

```text
.llm/tools/fitness/check-doctrine_test.ts:51
  source: "describe('bare global', () => {});\n",
```

That is **PR-B's own negative-control fixture** — the synthetic bare global that must stay red — sitting in
the test file as a **string literal**. A14 is scanning its own test data and reporting it as production code.
The rule is working; its input is wrong.

`scan-code-quality.ts:47` already solves this exact problem for the other scanner: it skips any line
beginning with a quote or backtick, because *template and fixture source strings are data, not syntax in the
scanned module*. Apply the same guard to `check-doctrine.ts`. Keep it narrow — a leading-quote/backtick line
only — and add a test proving a bare global in **real** source still fails, so the guard cannot swallow the
signal it exists to preserve.

## Contract

### C1 — the verdict table becomes a measurement of this tree (boxes 1, 2, 3, 11, 12)

Re-walk to the **36** live units (30 `packages/*` + 6 `plugins/*`) and nothing else. Sync
`06-archetypes.md`'s archetype assignment table to match. Add two tests: one failing if a verdict row names a
directory that does not exist, one failing if a live `packages/*`/`plugins/*` unit has no row.

### C2 — per-row provenance, with the reconciliation already done for you (box 2, amended)

Box 2 was **amended with owner authorization** to require per-row git evidence and to admit "never present in
this repository under that name" (issue comments `5264580324`, corrected by `5264832009`). Do not re-derive
this; it was got wrong twice already. The correct record per removed row:

| Row | What to write |
| --- | --- |
| `@netscript/triggers` | not present anywhere in this repository's history (begins `317e4b509`, 2026-07-06); **superseded** by `packages/plugin-triggers-core` per **`arch-debt.md:385`**, an event predating this history |
| `@netscript/workers` | same, per **`arch-debt.md:561`** → `packages/plugin-workers-core` |
| `@netscript/sagas` | not present in this history; **a checked-in supersession record exists** — `arch-debt.md:583-584` reads "the top-level `packages/sagas` directory named in this heading no longer exists — the code and this resolved debt live entirely in `packages/plugin-sagas-core`" |
| `@netscript/streams` | not present in this history; successor `packages/plugin-streams-core` exists; **no** supersession record found — state that absence **after** running the same `arch-debt.md` probe that found the sagas one |
| `@netscript/shared` | **added at `0ef13de35`, deleted at `fd8259b76`** (`feat(contracts): consolidate shared foundation package`, which deletes `packages/shared/deno.json` and 25 further paths) — both on **non-ancestor** history; cite the commits **and** the ancestry qualifier |
| `plugins/hello-world` | not present in this history; no successor and no supersession record |

**Why the qualifier matters:** this repository's history begins at `317e4b509` (a beta.5 cut) with a truncated
past, and `git ls-tree 317e4b509:packages/` already contains the full `plugin-*-core` tier. So "never
present" is a statement about **this repo's history**, not about the packages. Both records are true; write
both.

### C3 — `arch:check:repo` becomes a verdict (boxes 4, 6, 13)

Iterate `discoverDoctrineRoots()`; stop walking `.llm/tmp/`, `docs/`, `.llm/tools/`. Then `arch:check:repo`
must **exit 0**, or its residue must be enumerated in `arch-debt.md` as named debt with owners. With A1 and
the self-referential A14 both addressed, exit 0 should be reachable — measure it and report the real number
either way. `arch:check` must **stay exit 0**.

### C4 — the accepted-red debt entry closes or gets a dated plan (box 7)

`arch-debt.md`'s entry ("repo doctrine task — full historical scan remains red", created **2026-06-21**,
`DEBT_ACCEPTED`, closing gate "reduce unrelated root failures **or** replace the legacy root scan with
debt-aware package selection"). The second branch is what this PR does. Close it, citing the change, or leave
a dated closure plan naming both mechanical causes.

### C5 — state which units are gated, and why one is not (box 8)

`10-…md` gains a section naming which of the 36 units `arch:check` gates and why **`packages/cli/e2e`** is
excluded (it is a nested e2e harness, not one of the 36 top-level units). PR-B already stated this exclusion
in `09-anti-patterns-and-fitness-functions.md` — cross-reference rather than duplicate. Add a test that fails
if the documented gated set and `discoverDoctrineRoots()` disagree.

### C6 — the engineering-reference gap gets a dated plan, not silence (box 9)

`10-…md:79-181` specifies ten required contents; §6 is partial and §1–§5/§8–§10 do not exist. The box asks
for **a dated plan**, not the reference. Write one, authored *from* the refactors as a byproduct. Add a test
asserting the section exists and carries a date.

### C7 — the RFC divergence is resolved by recording what the repo already chose (box 10)

#1380 says "Zero numbered RFCs have ever landed". **False now.** `rfcs/` contains `0001-*.md` through
`0005-*.md`, all `status: Accepted`, and `rfcs/0005-devtools-contribution.md:10-18` names `rfcs/README.md`
canonical. So: record `rfcs/NNNN-*.md` as the canonical location, classify `.llm/runs/*/design/canonical/`
bundles as provenance/draft artifacts, and map the five `DECISION_PENDING` entries
(`CRON-SUBSYSTEM-DUP`, `RUN-ARTIFACT-ARCHIVAL-POLICY`, `PAGEBUILDER-LEGACY-COMPAT-TREE`,
`FORMPAGEPROPS-PLAYGROUND-MIGRATION`, `REDIS-LEGACY-VALUE-FALLBACK`) onto it. **Do not file those five
RFCs** — #1380's Boundaries forbid it. Add a test asserting all five ids appear.

### C8 — the `labeled`-trigger documentation fix (rail `R-11`)

Three statements are true and the current documents assert something weaker:

1. `openhands-phase-eval.yml` **does** listen to `labeled`.
2. `ci.yml:41` **does not** — and `ci.yml` is what runs `close-gate` and the acceptance mirror.
3. To make the close-gate and mirror observe a new label, **re-run the existing run** (`gh run rerun`), which
   re-reads live labels — *not* push, because a push moves the head and invalidates an existing IMPL-EVAL
   verdict.

`netscript-pr` `SKILL.md:169-170` currently says "applying `status:ready-merge` itself triggers a fresh run
(the workflow listens to `labeled`)", which is now **half true** and therefore worse than false: an operator
applies the label, sees a run appear, and concludes the close-gate was re-evaluated. It was not. Correct that
sentence and `check-close-gate.ts`'s repair hint, then regenerate the `.claude/skills/` mirror
(`deno task agentic:sync-claude`) and validate with `deno task agentic:check-claude`. **Change no workflow
trigger.**

## Acceptance mapping

#1380 has **13** boxes. Read them live. Provide a fenced `acceptance-evidence` block using
**`box-index: 1..13`** — **not** exact box text; several boxes wrap, and wrapped boxes are unmatchable by
exact text. Box 5 is evidenced by PR-B's commit `e391f3aec`, not by work in this PR — say so in the evidence.

## Gates — paste real output with exit codes

| # | Gate | Command |
| --- | --- | --- |
| 1 | fitness tests | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/fitness/` |
| 2 | doctrine curated | `deno task arch:check` — must stay **exit 0** |
| 3 | doctrine repo | `deno task arch:check:repo` — **exit 0**, or residue enumerated in `arch-debt.md` |
| 4 | quality gate | `deno task quality:gate` — exit 0 |
| 5 | scoped check/lint/fmt | the wrappers with `--root .llm/tools/fitness --root .llm/tools/validation --ext ts` (owned roots **only** — do not sweep all of `.llm/tools`, it contains pre-existing residue you do not own) |
| 6 | **asset-barrel freshness** | `deno task gen:assets-barrel`, then `git status --porcelain` **empty** |
| 7 | Claude surface | `deno task agentic:check-claude` after `agentic:sync-claude` |
| 8 | doc tests | the new existence/coverage/date/RFC-mapping tests |

Run **all** gates before reporting done, so the head is final when the orchestrator flips to ready — that
flip triggers IMPL-EVAL and a commit after it invalidates the verdict.

## PR mechanics

1. First commit is the slice-dir bootstrap; open the **draft PR** in that same session; comment per slice.
2. `## Scope` carries `Closes #1380` on its own line. Reference `#1403`/`e391f3aec` for box 5 **without** a
   closing keyword.
3. Labels: `type:docs`, `area:docs`, `area:tooling`, `area:packages`, `priority:p2`, `status:impl`, milestone
   `0.0.6`. Exactly one `status:`. **This is not a docs-lane PR** despite `type:docs` — its acceptance
   requires tooling code, so do **not** apply `ci:skip-e2e`/`ci:skip-scaffold` on the basis of the labels.
4. **Leave the PR draft.** The orchestrator owns the flip and will re-sync against main immediately before it.
5. Resolve commit hashes in a separate step; paste literal values.

## Boundaries

- Do **not** perform the six open verdict-Refactor/Restructure package refactors (`packages/database`,
  `packages/kv`, `packages/service`, `packages/workers`, `plugins/triggers`, `plugins/workers`). This issue
  re-establishes the denominator; the refactors are separate slices.
- Do **not** file the five `DECISION_PENDING` RFCs. Do **not** duplicate #1093, #1280, #1320, #232, #301.
- Do **not** reimplement A14 origin-awareness or `discoverDoctrineRoots()`; both are on main.
- Do **not** widen the A14 string-literal guard beyond a leading quote/backtick line, and prove a real bare
  global still fails.
- Do **not** touch `.llm/tools/quality/**` (PR-D's surface) or any workflow trigger.
- Do **not** add `deno-lint-ignore`, `@ts-ignore`, `as any`, `as unknown as`, or `quality-allow:`.
- Do **not** merge or flip to ready.

## Escalate instead of going idle

If a gate is red and you cannot green it, or a contract here is wrong, write it in your slice `drift.md`, post
it as a PR comment, and continue with what is not blocked. On this lane escalation has four times found the
orchestrator's brief wrong rather than the code — including one incoherent sequencing decision that would
have shipped a red gate. Raising it is the expected behaviour.
