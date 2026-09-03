# PLAN-EVAL — docs-rfc-plugin-cli-contribution--1502 (cycle 2)

Cycle 1 is preserved verbatim at `plan-eval-cycle-1.md`. This file is the canonical verdict.

## Evaluator identity

| Field              | Value                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Route requested    | native Claude · Opus 5 (`claude-opus-5`) · effort `medium` · Remote Control required                                 |
| Route observed     | native Claude · Opus 5 (`claude-opus-5`) · effort `medium` · Remote Control active                                   |
| Route source       | `briefs/reset-gates/dispatch.json` entry `order: 3` (`rfc-plugin-cli-contribution`)                                  |
| Session ID         | `28cc8106-967b-4fb7-90f3-dd95054ae953`                                                                               |
| Bridge session ID  | `cse_01D7t8efMh88nwR2PazUPkC1` (non-empty; `bridgeOutboundOnly: false`)                                              |
| Session PID        | `2463708` (pty host `2463625`, daemon `2429416`)                                                                     |
| cwd                | `/home/codex/repos/netscript-007-features-1502`                                                                      |
| Session name       | `NetScript 0.0.7 #1651 PLAN-EVAL cycle 2`                                                                            |
| Route evidence     | `~/.claude/jobs/28cc8106/state.json` → `respawnFlags` `--model claude-opus-5`, `--effort medium`, `--remote-control` |
| Family separation  | Author is OpenAI Codex GPT-5.6 Sol; evaluator is native Claude — opposite family                                     |
| Session separation | Distinct from cycle-1 evaluator session `669d043a-a1e3-4e75-9366-a1ee94f965ba`                                       |
| Substitution       | None. Fable 5 was not used and remains unassigned per `routePolicy.fablePolicy`.                                     |

## Evaluated subject

| Field               | Value                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Cycle               | PLAN-EVAL cycle 2 of the 2 allowed before escalation                                                                                  |
| Evaluated head      | `12276e6d86403ed1340ef79a963e87d401d643e9`                                                                                            |
| Superseded head     | `a02f9690154b7384ca8e6503ea91d644b397368a` (failed at cycle 1)                                                                        |
| Branch              | `docs/rfc-plugin-cli-contribution`                                                                                                    |
| PR                  | #1651, draft, base `main`, sole lifecycle label `status:plan-eval`                                                                    |
| Immutable base      | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                                                                            |
| Surface / archetype | `rfcs/0000-plugin-cli-contribution.md`; Archetype 4 public DSL/builder                                                                |
| Scope overlays      | `SCOPE-docs`                                                                                                                          |
| Binding contract    | `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`, key `rfc-plugin-cli-contribution` |

### Head resolution (independently performed)

- `git fetch origin`; `git rev-parse HEAD` = `12276e6d86403ed1340ef79a963e87d401d643e9`.
- `gh pr view 1651 --json headRefOid` = `12276e6d86403ed1340ef79a963e87d401d643e9`.
- `git rev-parse origin/docs/rfc-plugin-cli-contribution` = same SHA.
- Local worktree clean at evaluation start.
- Contract `baselineMainSha` = live `origin/main` = `git merge-base HEAD origin/main` =
  `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- No mismatch found; evaluation proceeded against the repaired head, not the cycle-1 head.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                         |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` § Re-baseline; the three-way SHA identity above holds at evaluation time. Load-bearing findings re-verified at the new head (below).                                                                                                          |
| Decisions locked                        | PASS   | `plan.md` § Locked Decisions D0–D23, each with rationale; `worklog.md` § Design fixes public surface, vocabulary, ports, and constants before any RFC prose exists.                                                                                         |
| Open-decision sweep                     | PASS   | `plan.md` § Open-Decision Sweep — 7 items, each classified with the decision that fixes its semantics. The cycle-1 rework-forcing item (leaf-versus-contract scope) is now closed by D22/D23. My own sweep below found no new rework-forcing item.          |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` § Reviewable Commit Slices — 6 ordered slices S0, S0R, S1–S4, each naming files and a proving gate; mirrored in `worklog.md` § Commit Slices.                                                                                                     |
| Risk register                           | PASS   | `plan.md` § Risk Register — 13 risks with mitigations, including the new contract-surface risk; § Anti-Patterns adds 16 AP dispositions.                                                                                                                    |
| Gate set selected                       | PASS   | All six contract `provingGates` are named, run, and receipted. See § Contracted gate reconciliation.                                                                                                                                                        |
| Deferred scope explicit                 | PASS   | `plan.md` § Non-Scope + § Contract Resolution + D22; `worklog.md` § Deferred Scope; `drift.md` entry "Coordinator contract shape conflicts with the RFC-only dispatch" at severity `significant` with contract citation.                                    |
| jsr-audit (package/plugin waves)        | PASS   | `research.md` § JSR audit of contracted publish surfaces — both contracted packages measured across exports, exact internal pins, isolated-declaration posture, publish dry-run, publish assets, and `import.meta`; six risks carried into the RFC roadmap. |

## Contracted gate reconciliation (cycle-1 `FP-1`)

Contract `provingGates` = `check`, `test`, `publish-dry-run`, `arch-check`, `docs-source-format`,
`docs-accuracy`. Every row now has a durable receipt; I opened each JSON rather than reading the
plan's summary of it.

| Contract gate        | Receipt                                                      | `outcome` | Independently read result                                                                                |
| -------------------- | ------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------- |
| `check`              | `receipts/check-cli-plugin-cycle1.json`                      | `PASS`    | `deno task check --include '^packages/(cli\|plugin)/'`; 1,033 files, 9 batches, 0 failed, 0 occurrences. |
| `test`               | `receipts/test-cli-plugin-cycle1.json`                       | `PASS`    | 16 focused CLI/plugin files; 88 passed, 0 failed, 0 ignored.                                             |
| `publish-dry-run`    | `receipts/publish-dry-run-cli-cycle1.json`, `…-plugin-…json` | `PASS`    | Canonical `deno task publish:dry-run --root . --member <pkg>`, both exit 0.                              |
| `arch-check`         | `receipts/arch-check-cycle1.json`                            | `PASS`    | `deno task arch:check` exit 0; pre-existing F-5/F-6 `export default` warnings retained as baseline.      |
| `docs-source-format` | `receipts/docs-source-format-cycle1.json`                    | `PASS`    | `check:source-format` from `docs/site`, exit 0; plus `source-format-cycle1.json` — 8 files, 0 findings.  |
| `docs-accuracy`      | `receipts/docs-accuracy-cycle1.json`                         | `PASS`    | `deno task docs:accuracy` exit 0.                                                                        |

All six are `run-gate` lifecycle receipts with `schemaVersion: 1`, `requestHash`, `lifecycleId`, and
`gitHead == actualGitHead == d71b78c3116db4ec3aaaa0447dd527fcd4867f6f`. The plan commits to
rerunning every row at the final author head in S4 (`plan.md` § Validation Plan, right-hand column),
so the one-commit gap between receipt head and evaluated head is disclosed and bounded rather than
claimed as final evidence.

`quality:gate` N/A is correct: `git diff --name-only origin/main...HEAD` returns 25 files, all under
the run directory, and `git diff origin/main...HEAD -- deno.lock` is empty — no `packages/**` or
`plugins/**` path is touched. `scaffold.runtime` is absent from the contract's `provingGates`, so
D21 remains consistent.

## JSR reconciliation (cycle-1 `FP-2`)

Contract `jsrAudit.applicable: true` with two named risks. Both are now discharged with evidence,
and each of the specifically-unaddressed items from cycle 1 is closed:

- **Public exports.** `receipts/jsr-audit-cli-cycle1.json` (3 export-map entries) and
  `…-plugin-cycle1.json` (13 entries) enumerate the surfaces. Full export-map doc lint: CLI 0
  diagnostics; plugin 15, all `private-type-ref`, `totalMissingJSDoc: 0`.
- **Exact `@netscript` dependency pins** — cycle 1's "appears nowhere". Now
  `receipts/netscript-jsr-specifiers-cycle1.json`, `outcome: PASS`:
  `scanned=2360 allowances=1
  ranges=0 failures=0`, with the single allowance an exact release
  target.
- **Isolated-declaration publish dry-run.** Both per-member dry-runs pass. The research does not
  overclaim: it records that `packages/cli/deno.json` sets `isolatedDeclarations: false` while the
  workspace root sets `true`, and therefore classifies CLI as `PASS_BASELINE_WITH_RISK`. I verified
  both settings directly (`deno.json:174`, `packages/cli/deno.json:50`). This is the correct reading
  and is the kind of caveat a weaker audit would have suppressed.
- **`import.meta` reads** — cycle 1's "unnamed". Now
  `receipts/jsr-runtime-asset-preflight-cycle1.json` (`textImports: 0`, `importAttributes: 0`,
  `fileUrlImportMeta: 0`, `selfImports: 0`), named as roadmap risk 3, and carried into the `plan.md`
  risk register row "Published code reads assets through `import.meta` / file URLs".
- **Baseline honesty.** The four missing `@module` tags are verifiable in the audit JSON's
  `docs.moduleTagOnEntries` — `./abstracts`, `./config`, `./cli`, `./testing` are `false`. Measured
  baseline failures are separated from introduced failures throughout, and the leaf introduces none.

## Contract resolution (cycle-1 `FP-3`)

Cycle 1 required: record the mismatch in `drift.md` at severity `significant`, escalate, and
re-slice against whichever scope the coordinator ratifies. All three are satisfied.

- `drift.md` carries the entry at severity `significant`, citing the contract file, key, and the
  specific fields (`executionKind`, `fileSurfaces`, `provingGates`, `jsrAudit`).
- `plan.md` § Contract Resolution states the contract fields verbatim, states the resolution, and
  states that no source-scope expansion is inferred from `executionKind` or `fileSurfaces`.
- D22 locks the RFC-only mutation boundary with package/plugin inspection, all six proving gates
  retained, and `jsrAudit.applicable: true` retained. Expansion requires a coordinator amendment, a
  new plan, and a new PLAN-EVAL.
- The narrowing does not waive coordinator evidence: the contracted gates and JSR audit were run
  against the contracted inspection surfaces rather than dropped.

**Confirmation that the docs-only amendment is coordinator-authorized, explicit, and sufficient.**
The `leaf-contracts.json` entry itself was never edited — I checked its git history; the last commit
touching the file is `33626b1f4` and the `rfc-plugin-cli-contribution` key retains its original
shape. The amendment is therefore a dispatch-level narrowing, not a contract-file edit. It is
nevertheless coordinator-authorized and durable, because a checked-in coordinator artifact that
predates the leaf says so directly:
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/briefs/topic-features/implement.md:24`
(commit `8775be7b3`) — "Wave 0 contains … one implementation leaf, `rfc-plugin-cli-contribution`
(#1502). … That leaf is an RFC document plus its own PLAN-EVAL and proposes a later implementation
epic; it does not implement the CLI seam now." The cycle-2 dispatch
(`briefs/reset-gates/rfc-plugin-cli-contribution.md`) reaffirms it. The authorization is explicit
and sufficient; see N-1 for the citation defect that remains.

**Closing-keyword disposition.** Explicit and sufficient. D23 locks that PR #1651 retains
`Closes #1502` because this RFC leaf is the dispatched completion of #1502, and that the later
implementation epic is separate, is not #1502, and is neither filed nor milestone-assigned here. The
same statement appears in the live PR body ("#1502 is completed by this RFC leaf; the proposed later
implementation epic is separate, unfiled, and not closed by this PR") and in `worklog.md` § Deferred
Scope. This satisfies the `netscript-pr` closing-keyword obligation without stranding the epic
anchor, and resolves cycle-1 note N-2.

## Open-decision sweep (evaluator-run)

I ran the sweep independently rather than auditing the plan's table. Candidates considered, and why
none forces rework if deferred:

- **`PluginCliResult` collides with a live published export.** Real, and the plan's classification
  ("exact spelling is editorial") understates it — see N-3. It is still safe to defer, because D2
  locks an explicit compatibility/deprecation child, D16 locks that meaning changes require a new
  major, and epic child 8 owns the migration. The slice table does not change either way.
- **CLI `isolatedDeclarations: false`.** Named as a risk with the implementation-child bar;
  deferring the probe to the child that writes the DSL is correct sequencing, not deferred rework.
- **Manifest `.passthrough()` prerequisite versus #1474.** Listed as "must be audited before child
  filing, not before RFC"; D15 fixes the semantic outcome so the audit chooses a board owner, not an
  architecture.
- **Which host mounts are extensible in v1.** D3 fixes the mount model; the concrete mount list is
  RFC-authoring content, not a plan-gate decision.
- **Epic issue identity.** Closed by D23.

No unlisted rework-forcing decision found. The plan's seven listed items are correctly classified.

## Archetype-4 fitness gates

`ARCHETYPE-4-dsl-builder.md:14-15` defines the required set as F-1 … F-12 plus F-14, F-15, F-16,
F-17, F-18, F-19 — 18 gates; there is no F-13. `plan.md` § Fitness Gates now enumerates all 18 with
per-gate RFC-now / implementation-later evidence, and § Later Implementation Epic Shape repeats the
full list as a binding acceptance manifest with the rule that a child may mark a gate inapplicable
only with a path-based reason in its own locked plan and may not omit it. Cycle-1 note N-4 is
resolved.

## Docs terminology

Resolved. `plan.md` § Validation Plan names the live glossary `docs/site/glossary.md` (which I
confirmed exists) and states that the `SCOPE-docs` overlay's `.claude/09-glossary.md` path is not
used; `drift.md` records the retired path at severity `minor` without editing the shared overlay
from this leaf. Cycle-1 note N-3 is resolved.

## Verified evidence (spot-checks at the evaluated head)

Every load-bearing research claim I sampled holds at `12276e6d8`:

- R2 — `packages/plugin/deno.json:11` exports `"./cli": "./src/cli/mod.ts"`.
- R3 — `packages/plugin/src/cli/types.ts:22` `PluginCliCommand` carries only
  `name`/`description`/`run`; no route tree, completion, capability, or error vocabulary.
- R4 — `packages/plugin/src/cli/composition/mount-plugin-cli.ts:9` flattens with
  `` `${cli.name}:${command.name}` ``.
- R6 — `packages/plugin/src/config/domain/plugin-contributions.ts:14-17` `cli` is
  `{ doctorChecks?: readonly 'auth-backend'[] }`.
- R9 — `packages/plugin/src/protocol/manifest.ts` uses `.strict()` (line 172 among others).
- Workspace `isolatedDeclarations: true` (`deno.json:174`) versus `packages/cli` `false`
  (`packages/cli/deno.json:50`).
- `docs/site/glossary.md` exists; `.claude/09-glossary.md` does not.
- Archetype-4 gate set is 18 gates with no F-13 (`ARCHETYPE-4-dsl-builder.md:14-15`).
- Scope truth: 25 changed files, all under the run directory; `deno.lock` untouched.
- Issue #1502 is open, milestone `0.0.7`, zero comments; all five acceptance boxes retain a planned
  evidence path in `plan.md`.

## Verdict

`PASS`

The Plan-Gate is satisfied. Cycle-1 `FP-1`, `FP-2`, and `FP-3` are each closed with evidence I read
directly rather than accepting the plan's account of it, and all four cycle-1 notes are resolved.
Implementation of slice S1 (RFC authoring) may begin.

## Notes — non-blocking, carry into S1

- **N-1 (citation durability).** `plan.md` § Contract Resolution, `research.md` § Coordinator
  contract reconciliation, and the `drift.md` entry all attribute the docs-only narrowing to "the
  user's original dispatch and authoritative cycle-1 scope resolution" — a chat message that is not
  in the repository. The authorization is real and independently verifiable, but the citation is
  not. Cite the durable artifact instead or in addition:
  `.llm/runs/release-0.0.7--orchestration/briefs/topic-features/implement.md:24` (commit
  `8775be7b3`). Also state plainly that `leaf-contracts.json` key `rfc-plugin-cli-contribution` was
  not edited, so a future reader diffing the contract does not conclude the narrowing was silent.
- **N-2 (stale evaluator route).** `plan.md` § Dependencies still requires "a fresh native
  Claude/Fable 5 medium session", and `supervisor.md` § Routes in force lists Fable 5 for both
  `formal_plan_evaluation` and `formal_impl_evaluation`. The reset dispatch de-assigns Fable
  (`briefs/reset-gates/dispatch.json` → `routePolicy.fablePolicy`: "not pre-dispatched; coordinator
  amendment must record genuine architectural or exceptional implementation-review necessity") and
  routes this gate to native Claude Opus 5 medium. Correct both files in S1 and record the observed
  cycle-2 identity from the table above.
- **N-3 (published symbol collision).** `plan.md` § Proposed Public Vocabulary lists
  `PluginCliResult`, which is already a published export of `@netscript/plugin/cli`
  (`packages/plugin/src/cli/types.ts:12`, re-exported at `src/cli/mod.ts:1`) with a different shape.
  The sweep classifies exact spelling as editorial; a redefinition of a live JSR-published symbol is
  a compatibility decision, not spelling. D2, D16, and epic child 8 already cover it, so this does
  not block — but the RFC should name the collision and its major-version/migration disposition
  explicitly rather than letting it arrive as a surprise in the compatibility child.
- **N-4 (receipt head).** The six contracted receipts attest
  `d71b78c3116db4ec3aaaa0447dd527fcd4867f6f`, one commit before the evaluated head. Correctly
  disclosed in `worklog.md`. The S4 final-head rerun is what binds for IMPL-EVAL; do not let it
  slip.

## Scope of this session

This evaluator renamed `plan-eval.md` to `plan-eval-cycle-1.md`, wrote this file, committed both,
and pushed with an explicit refspec after confirming the remote head still equalled the evaluated
head. No RFC content was authored, no package or plugin source was touched, no label was changed, no
central orchestration state was mutated, no merge or publication occurred, and no expensive gate was
started.
