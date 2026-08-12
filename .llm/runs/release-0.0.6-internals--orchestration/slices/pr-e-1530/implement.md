use harness

# PR-E — #1530: negative type fixtures are scanned as production source, and `main` has been red for it

You are the **implementation agent** for the first slice of the 0.0.6 internals quality rail. Narrow,
fully specified, and it clears a **currently red blocking gate on `main`**.

Your orchestrator is a Claude Opus 5 high session in `/home/codex/repos/netscript-006-internals` on
`chore/release-0.0.6-internals-orchestration`. It holds merge authority. You implement, gate, and
report; you do not merge.

## SKILL

- `netscript-harness` — run artifacts, commit trail, slice discipline.
- `netscript-tools` — validation wrappers; what is a verdict and what is a non-verdict.
- `netscript-pr` — branch/PR/label mechanics, closing keywords, the fenced `acceptance-evidence` block,
  the `[post-merge]` marker.
- `netscript-deno-toolchain` — deterministic `deno test` behaviour.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-typefixtures` |
| Branch | `fix/1530-type-fixture-scan-scope` |
| Base | **`84dd44ae7`** = `origin/main` at dispatch. Contains PR #1527 (`63cd1cd58`, the gate-trust fix). Verified at this base: `deno task quality:scan:repo` still exits **1**, so the defect is live here. |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-e-1530/` |
| Draft PR | **#1560** — already open, already labelled, body already written. Comment on it; do not open another, and do not flip it out of draft. |
| Closes | #1530 |
| Route | Codex · gpt-5.6-sol · **low** |
| Plan | `plan-quality-rail.md` (incl. § Revision 2) · slices **E1–E4** in `worklog.md` § Design |

Work only in that worktree. No rebase, no force-push. Push with an explicit refspec:
`git push origin HEAD:refs/heads/fix/1530-type-fixture-scan-scope`.

## The defect, measured

`deno task quality:scan:repo` exits **1** at `main` with five findings, all in one file:

```text
packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts:349,365,445,465,502
  rule=ts-error-suppression  // @ts-expect-error <reason>
```

Every one of those directives **is the fixture's assertion** — remove it and the negative type fixture
proves nothing. The blocking `code-quality-repo` job (`code-quality.yml:50-59`, on push-to-main and a
Monday cron) has therefore failed on **7 consecutive pushes to `main`**; last green was `0fbe3dadd`.

Root cause, `scan-code-quality.ts:86-89`:

```ts
return /\.[cm]?[jt]sx?$/.test(file) && !/(?:_test|\.test|\.spec)\.[cm]?[jt]sx?$/.test(file) &&
  !file.endsWith('.generated.ts');
```

`*_type.ts` is not exempt, so type fixtures are scanned as production source.

**Why the PR gate never caught it:** `code-quality.yml:28` skips draft PRs and `:36-42` scans only the
files a PR changed. The repo-wide job is the only path that ever scanned this file, and it runs *after*
merge.

## Contract

### C1 — the exemption is a rule, keyed on directory **and** suffix

Exempt files matching **`tests/type-fixtures/` in the path AND a `_type.ts` suffix**. Not a filename
allowlist (it rots on the next fixture). Not a widened `_test`-style regex (that would exempt production
code). This is the shape #1378 § Target contract already mandates for the six `*-soundness_test.ts`
files: "Exempt by explicit rule, asserted by test."

Measured surface: **12** `*_type.ts` files, all under a `tests/type-fixtures/` directory, in
`packages/sdk`, `packages/fresh`, `packages/plugin-streams-core`; **3** contain `@ts-expect-error`.

### C2 — the exemption must not leak, and you must prove both directions

Mandatory fixtures:

| Case | Expected |
| --- | --- |
| `@ts-expect-error` in a `*_type.ts` **under** `tests/type-fixtures/` | **not reported** (this is the fix) |
| the same directive in ordinary source, e.g. a `packages/**/src/**.ts` fixture path | **still reported** |
| the same directive in a `*_type.ts` **outside** any `tests/type-fixtures/` directory | **still reported** |
| the same directive in a `tests/type-fixtures/` file **without** the `_type.ts` suffix | **still reported** |

The last two are the leakage controls. A rule that exempts on directory alone, or suffix alone, passes
the fix case and fails the lane's purpose.

### C3 — remove the two allowances the rule makes redundant

```text
packages/fresh/tests/type-fixtures/desktop-consumer_type.ts:42  // quality-allow: negative compile fixture proves contract input remains enforced without bindings.d.ts
packages/sdk/tests/type-fixtures/sdk-assignability_type.ts:62   // quality-allow: negative compile fixture requires TypeScript's expect-error directive to prove string input remains rejected
```

Both reasons say, in prose, "this file is a negative compile fixture" — a rule stated twice in comments
and zero times in code. The rule now states it once, so delete both comment lines (only the
`// quality-allow:` comments — **do not** touch the `@ts-expect-error` lines or any fixture logic).

Repo-wide `allowCount` must fall **10 → 8**, and you must show it from the scan's own JSON output before
and after. This matters beyond tidiness: #1378 wires `--max-allow` as a budget that can only fall.

### C4 — do not touch the findings themselves

Do **not** edit, delete, or suppress any `@ts-expect-error` line in
`sdk-client-contributions-rfc_type.ts` or any other fixture. This PR fixes the **scanner's scope**, not
the code the scanner mis-flagged. Verify with a diff audit that no `*_type.ts` fixture line other than
the two `// quality-allow:` comments changed.

## Acceptance mapping

#1530 has **7** boxes. Read them from the live issue, not this paraphrase. Six need a fenced
`acceptance-evidence` entry in the PR body, mapped by exact trimmed box text (see `netscript-pr`).

**Box 7 is different and must be left alone:** it reads
`` `gate:` the `code-quality-repo` job is green on `main` after merge. `[post-merge]` ``. The
`[post-merge]` marker is the sanctioned mechanism for a fact that cannot exist before merge — the gate
visibly excludes it with a notice, and it is verified by a comment afterwards. **Do not** give it an
evidence entry, do not tick it, and do not drop the PR's closing keyword to escape it. The orchestrator
verifies it after merge.

Box 3 says **proven RED**. That means a test that fails before your change and passes after, with the
pre-change output pasted. Commit the failing test as its own commit (slice E1) so the record shows RED
rather than asserting it.

## Gates you must turn green — deliverables, not a checklist

Paste real command output with exit codes into your per-slice PR comment.

| # | Gate | Command |
| --- | --- | --- |
| 1 | quality tool tests | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/quality/` |
| 2 | repo-wide scan — **the headline** | `deno task quality:scan:repo` → must be **exit 0**, and its JSON must show `allowCount: 8` |
| 3 | default scan | `deno task quality:scan` → exit 0, `allowCount: 7` unchanged |
| 4 | quality gate | `deno task quality:gate` → exit 0 |
| 5 | scoped check / lint / fmt | `.llm/tools/run-deno-{check,lint,fmt}.ts --root .llm/tools/quality --ext ts` |
| 6 | before/after allowance count | run gate 2 at your base commit and at your head; paste both `allowCount` values |

The `--allow-write --allow-run` on gate 1 is not optional: nine tests under `.llm/tools` call
`Deno.makeTempDir()` and one spawns a subprocess. This was established the hard way on PR #1527 — the
orchestrator's brief was wrong twice about it (`drift.md` D-8). Do not "fix" those tests.

`deno task e2e:cli` is out of scope — no scaffold, DB, Aspire, or plugin copy-mode surface is touched.
Apply `ci:skip-e2e` and `ci:skip-scaffold`, and state that choice and its reason in your opening phase
comment so the cheap lane is visibly intentional. Never edit a workflow file to dodge a filter.

## PR mechanics

1. First commit is the slice-dir bootstrap; open the **draft PR in that same session**. Comment per slice.
2. Slice artifacts in `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-e-1530/`:
   `worklog.md`, `context-pack.md`, `drift.md`, updated **in the same commit** as the code they describe.
3. `## Scope` carries `Closes #1530` on its own line. Nothing else gets a closing keyword.
4. Labels: `type:fix`, `area:tooling`, `priority:p1`, `ci:skip-e2e`, `ci:skip-scaffold`, and exactly one
   `status:` — `status:impl`. Milestone `0.0.6`. Do **not** apply `status:ready-merge`; the orchestrator
   does that after its pre-merge gate.
5. Slices, per the plan's Design table: **E1** RED fixture (committed red) · **E2** the `isTypeFixture`
   exemption · **E3** leakage controls both directions · **E4** drop the two redundant allowances and
   record the 10 → 8 count.
6. **Leave the PR in draft.** The draft → ready flip now **automatically triggers the formal IMPL-EVAL**
   (owner policy, `drift.md` D-14), so it is the orchestrator's action once your slice checklist is
   complete — not a way to get CI moving. Do **not** flip it yourself, do **not** apply `impl-eval:skip`,
   and do **not** apply `status:impl-eval` or `status:plan-eval`.
6. Post one `**[PHASE: IMPL]**` summary when the slices are in, listing every gate with real output.

## Two mechanical rules that cost this lane time already

- **Resolve commit hashes in a separate step and paste the literal value.** A previous slice posted
  `` `(git rev-parse --short=10 HEAD)` `` unexpanded into two PR comments, leaving the commit trail
  without the hashes of its central fixes.
- **`status:ready-merge` is not a workflow trigger.** Neither `ci.yml:41` nor `e2e-cli.yml` lists
  `labeled` in `pull_request.types`, so the label alone creates no run. Not your problem on this PR —
  the orchestrator handles labelling — but do not be surprised by a stale `close-gate` result, and do
  not chase it.

## Boundaries

- Touch only `.llm/tools/quality/**`, the two `// quality-allow:` comment lines named in C3, and your
  slice dir.
- Do **not** change `arch:check`'s root list or `check-doctrine.ts` — that is PR-B and PR-C.
- Do **not** add export-awareness, allowance issue-links, `--max-allow` wiring, or docs-fence scanning —
  all of that is #1378 / PR-D. This PR only corrects scanner **scope**.
- Do **not** add `deno-lint-ignore`, `@ts-ignore`, `as any`, `as unknown as`, or a new
  `// quality-allow:`.
- Do **not** modify `deno.lock` unless a real dependency change requires it.
- Do **not** merge and do **not** set `status:ready-merge`.

## Escalate instead of going idle

If a gate is red and you cannot green it, or a contract here proves wrong, write it in your slice
`drift.md`, post it as a PR comment, and continue with what is not blocked. Idling at a red gate is the
most expensive failure mode in this repo's orchestration record — and on PR #1527 the escalation path
worked: the agent found the orchestrator's gate command wrong and said so instead of stalling. Do that.
