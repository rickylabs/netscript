use harness

# PR-B — #1403: make `quality:gate` informative, in all three of the ways it currently is not

You are the **implementation agent** for the p0 of the 0.0.6 internals quality rail. The plan passed a
formal PLAN-EVAL (cycle 5, `PASS`); your job is to implement it, not to redesign it.

Your orchestrator is a Claude Opus 5 high session in `/home/codex/repos/netscript-006-internals`. It holds
merge authority and owns the draft → ready flip.

## SKILL

- `netscript-harness` — run artifacts, slice discipline, commit trail.
- `netscript-doctrine` — `arch:check`'s role, archetypes, fitness gates. **Read before touching
  `check-doctrine.ts`.**
- `netscript-tools` — scoped wrappers; what is a verdict and what is not.
- `netscript-pr` — branch/PR/label mechanics, closing keywords, the fenced `acceptance-evidence` block.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-qualitygate` |
| Branch | `fix/1403-quality-gate-coverage` |
| Base | `3c9dc1f39` (= `origin/main`) |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-b-1403/` |
| Closes | #1403 |
| Route | Codex · gpt-5.6-sol · **low** |
| Plan | `plan-quality-rail.md` revision 4 (`PASS`), slices **B1–B3** in `worklog.md` § Design |

Measured at your base: `deno task arch:check` exit **0**, `deno task quality:scan:repo` exit **0**.
Both green, so any red you produce is yours.

## What is actually wrong — three independent defects, one gate

#1403 was filed about **root lists**. Cross-lane work then found two more, and all three are now acceptance
boxes. A fix for one alone leaves a gate that looks covered and is not — which is the class this issue exists
to close, so do not stop at the first.

### Defect 1 — the curated root list omits a package

`deno.json`'s `arch:check` is `deps:check` plus **16** hand-listed `check-doctrine.ts --root` invocations in
one shell string. `packages/plugin-streams-core` is the only `plugin-*-core` package absent — an omission,
not a decision.

### Defect 2 — the PR gate never scans `.llm/tools/**`, and skips entirely when nothing else changed

`.github/workflows/code-quality.yml:36-42`:

```bash
mapfile -t files < <(git diff --name-only --diff-filter=ACMR "$BASE" "$SHA" -- packages plugins)
args=(); for file in "${files[@]}"; do args+=(--changed-file "$file"); done
if ((${#args[@]})); then deno task quality:scan --pretty "${args[@]}"; fi
```

The pathspec is `-- packages plugins`, so a `.llm/tools/**` change can never enter the set; and
`if ((${#args[@]}))` means an empty set runs **no command** and reports success. Every PR in this rail —
including this one — is `.llm/tools`-only, so that step has been reporting success having executed nothing.

### Defect 3 — the range is two-dot, so a stale base scans other lanes' merged work

Same line: the two SHAs are passed as separate arguments, which is two-dot semantics — a literal tree
comparison. On PR #1539 that enumerated **nine** already-merged files belonging to other PRs and **zero**
lines of the PR under review. Audited across `main`, this is the **only** affected site:

```text
surface-diff.yml:54   "$BASE_SHA...$HEAD_SHA"   three-dot — safe
ci.yml:142            "$BASE_SHA...$HEAD_SHA"   three-dot — safe
e2e-cli.yml:140       "$BASE_SHA...$HEAD_SHA"   three-dot — safe
code-quality.yml:39   "$BASE" "$SHA"            TWO-DOT — fix this one
```

`A...B` diffs from the **merge-base**, so a stale base self-heals — it is always a former `main` commit and
therefore an ancestor. Demonstrated on identical inputs: `cd24e1679 2a4102600` → 9 files;
`cd24e1679...2a4102600` → 0 files.

**#1564** owns this root cause across consumers. **You fix only `code-quality.yml:39`.** Do not touch the
three safe sites; do not widen into #1564.

## Contract

### C1 — one transition to discovered roots, not two (rail `R-6`)

Introduce `discoverDoctrineRoots()` in `.llm/tools/fitness/check-doctrine.ts` returning the **final** root
set, and repoint `arch:check` at it **in one step**. No interim list, no checked-in root data file. Two
earlier PLAN-EVAL cycles rejected a two-step version; do not reintroduce it.

### C2 — the selector is the 36 top-level units, not every workspace member (rail `R-4`)

Expanded top-level `packages/*` + `plugins/*` — **30 + 6 = 36**. Root `deno.json`'s workspace list also
includes `packages/cli/e2e`, `examples/*` and `apps/*`; those are **not** doctrine roots.
`packages/cli/e2e` is **excluded**, and that exclusion must be **stated in the doctrine document**, not left
implicit in code.

### C3 — the coverage test must not ask the implementation what to expect

Derive the expected set **independently** — enumerate publishable units from the filesystem or the workspace
list — then assert `discoverDoctrineRoots()` equals it. A test that computes its expectation *by calling the
function under test* cannot fail; PLAN-EVAL cycle 3 caught exactly that and it is a blocking defect here.

### C4 — the PR gate must execute on a `.llm/tools`-only diff

Widen the changed-file computation so `.llm/tools/**` is in scope, and make the **empty set** fail closed or
report "not scanned" explicitly — never silently green. Prove both red-first.

### C5 — the range becomes three-dot

One character at `code-quality.yml:39`, plus a fixture proving a stale recorded base no longer admits foreign
already-merged files.

### C6 — surfaced findings are triaged, never fixed here (rail `R-8`)

Running the repaired gate over newly covered surfaces will surface real findings. **Do not fix any of them.**
Write them into a triage list in your slice dir with file, line, rule, and a one-line assessment, and say
plainly how many there are. #1403 box 5 requires exactly this; a diff that "helpfully" cleans them up fails
the slice. If a finding is severe enough that you think it must be fixed now, say so and stop — the
orchestrator decides.

## Acceptance mapping

#1403 has **8** boxes (5 original + 3 added today; read them from the live issue). Provide a fenced
`acceptance-evidence` block using **`box-index: 1..8`** — **not** exact box text. `acceptanceCheckboxes`
keeps only each checkbox's **first raw line, backticks preserved**, so any box that wraps is unmatchable by
exact text and you cannot see the wrapping. This cost PR #1560 a full failed IMPL-EVAL cycle earlier today.

## Gates — deliverables, not a checklist. Paste real output with exit codes.

| # | Gate | Command |
| --- | --- | --- |
| 1 | fitness + quality tests | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/fitness/ .llm/tools/quality/` |
| 2 | doctrine (curated) | `deno task arch:check` — must stay **exit 0** |
| 3 | quality gate | `deno task quality:gate` — exit 0 |
| 4 | repo quality scan | `deno task quality:scan:repo` — must stay **exit 0** (it is green at your base; PR-E fixed it) |
| 5 | scoped check / lint / fmt | `.llm/tools/run-deno-{check,lint,fmt}.ts --root .llm/tools --ext ts` |
| 6 | **asset-barrel freshness** | `deno task gen:assets-barrel`, then `git status --porcelain` **must be empty** |
| 7 | new-workflow sanity | confirm `code-quality.yml` still parses |

Gate 6 is mandatory and non-obvious: tool sources are embedded as strings in
`packages/cli/src/kernel/assets/*.generated.ts`, so editing a bundled tool makes them stale and reds
`ci.yml`'s `quality` job. This cost PR-E a CI cycle. The empty `git status` on a **second** run is also your
idempotence proof.

Run **all** gates before you report done, so the head is final when the orchestrator flips to ready — that
flip triggers the formal IMPL-EVAL, and a commit landing after it invalidates the verdict.

## PR mechanics

1. First commit is the slice-dir bootstrap; open the **draft PR** in that same session, comment per slice.
2. Slice artifacts (`worklog.md`, `context-pack.md`, `drift.md`) updated in the **same commit** as the code
   they describe.
3. `## Scope` carries `Closes #1403` on its own line. Reference `#1564` **without** a closing keyword — it
   owns the shared root cause and stays open.
4. Labels: `type:fix`, `area:tooling`, `area:packages`, `priority:p0`, `status:impl`, milestone `0.0.6`.
   Exactly one `status:`.
5. **Leave the PR draft.** The flip is the orchestrator's action.
6. **State gate claims as evidence, not buckets.** If a scaffold tier reports SUCCESS, say which step number
   ran and whether step 2 was "Skipped by policy" — `scaffold-runtime: SUCCESS` is not a provable claim.
   Likewise do **not** cite `quality:gate` as coverage of your own diff; on a `.llm/tools` change it is
   precisely the defect you are fixing.
7. Resolve commit hashes in a separate shell step and paste literal values.

## Boundaries

- Touch only `.llm/tools/fitness/**`, `.llm/tools/quality/**`, `deno.json` tasks,
  `.github/workflows/code-quality.yml`, `docs/architecture/doctrine/` for the C2 exclusion statement, and
  your slice dir.
- Do **not** change `arch:check:repo`'s behaviour, the A14 rule, or the doctrine verdict table — that is
  PR-C (#1380), which consumes your `discoverDoctrineRoots()` unchanged.
- Do **not** add export-awareness, allowance issue-links, `--max-allow` wiring, or docs-fence scanning —
  that is PR-D (#1549).
- Do **not** touch `surface-diff.yml`, `ci.yml` or `e2e-cli.yml`; all three are already three-dot.
- Do **not** fix findings the repaired gate surfaces (C6).
- Do **not** add `deno-lint-ignore`, `@ts-ignore`, `as any`, `as unknown as`, or `quality-allow:`.
- Do **not** merge, flip to ready, or apply `status:ready-merge` / `status:impl-eval` / `impl-eval:skip`.

## Escalate instead of going idle

If a gate is red and you cannot green it, or a contract here is wrong, write it in your slice `drift.md`,
post it as a PR comment, and continue with what is not blocked. On this lane escalation has three times found
the orchestrator's brief wrong rather than the code — missing `--allow-write`, then `--allow-run`, then the
asset-barrel gate. Raising it is the expected behaviour, not a failure.
