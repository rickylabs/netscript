# IMPL-EVAL cycle 2: complete the streams-core declarations (#1543 / PR #1876)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-declare-streams-core-dependency--1543` |
| Target | `packages/sdk/deno.json`, `packages/plugin-sagas-core/deno.json`, `packages/plugin-auth-core/deno.json`, `packages/cli/e2e/deno.json`, `deno.lock` (delta over cycle 1) |
| Head evaluated | `166c242be` |
| Base | `main` @ `38f2ce735` |
| Archetype | `3 - Runtime/Behavior`; `5 - Plugin Package` |
| Scope overlays | none |
| Evaluator | separate opposite-family IMPL-EVAL session — Claude Code host, `z-ai/glm-5.3-flash` (approved evaluator-lane model), 2026-09-01; generator lane was OpenAI GPT-5.6 Sol per `supervisor.md`, so no self-certification |
| Method | read-only over source; all exits captured as `out=$(cmd 2>&1); rc=$?` (never a pipeline); one scratch probe under `.llm/tmp/subpath-probe/` (gitignored, not committed) |
| Scope | completeness delta only. Cycle 1 already validated specifier style, lock-delta minimality, scope cleanliness, and the central publish question; not re-litigated except where the delta touches them. Cycle 1's `impl-eval.md` and every run artifact preserved untouched. |

## Cycle-1 finding — restated

Cycle 1 (`4f194dbb1`, `FAIL_IMPL`) confirmed the two-line change was correct but falsified the
slice's design contract: `packages/sdk`, `packages/plugin-sagas-core`, `packages/plugin-auth-core`
(publishable) and `packages/cli/e2e` (non-publishable) imported `@netscript/plugin-streams-core`
undeclared. S2 (`166c242be`) adds the established specifier to those four manifests and refreshes
the lock. This cycle verifies the completeness delta only.

## Verification 1 — is the set complete NOW: PASS

Derived the full set myself: repo-wide `grep -rn "plugin-streams-core"` (scope-prefixed and bare,
so sub-path specifiers cannot be missed; whole repo excluding `.git`/`node_modules`/`.llm`, 200 raw
hits; `apps/` and `examples/` do not exist in this tree — the workspace globs `examples/*`,
`apps/*` have no members). Every hit classified into: **module edge** (static
`import ... from` / `import type ... from` / `export ... from` in real `.ts`), **string reference**
(plugin metadata, codegen maps, diagnostic fields, generated corpus), or **prose/doc example**
(README, `docs/`, JSDoc `@example` fences). Ambiguous classes were read by hand before counting:
`packages/mcp/src/publish-assets.generated.ts:31` sits inside the generated llms-corpus string
(not an edge); all five `packages/plugin-streams-core` import-shaped hits are JSDoc examples plus
two diagnostic `package:` string fields (self-references); `packages/fresh-ui`'s hits are all in
its **nested `deno.lock`** (resolution artifact — no edges, correctly no declaration); the
`packages/cli` hits are codegen/map strings (`workspace-mutator.ts:199` et al.).

| Workspace member | Module-edge lines (files) | Import shape | Declares? | Origin |
| --- | --- | --- | --- | --- |
| `packages/plugin-streams-core` | self-fixture only (`tests/type-fixtures/producer-consumer_type.ts:6-7`) | bare + `/testing` | n/a — not a dependency of itself | — |
| `packages/plugin-workers-core` | 3 (2) | bare | **yes** | S1 `10aa2a944` |
| `plugins/triggers` | 3 (3) | bare | **yes** | S1 `10aa2a944` |
| `packages/fresh` | 7 (6) | bare + `/sse` | yes (pre-existing, bare + `/sse` keys) | — |
| `plugins/auth` | 6 (4) | bare | yes (pre-existing) | — |
| `plugins/sagas` | 5 (3) | bare | yes (pre-existing) | — |
| `plugins/streams` | 14 (11) | bare | yes (pre-existing) | — |
| `plugins/workers` | 1 (1) | bare | yes (pre-existing) | — |
| `packages/sdk` | 2 (1) (`src/streams.ts:36-37`, incl. `export type *`) | bare | **yes** | S2 |
| `packages/plugin-sagas-core` | 1 (1) (`src/streams/schema.ts:12`) | bare | **yes** | S2 |
| `packages/plugin-auth-core` | 2 (1) (`src/streams/mod.ts:11,15`) | bare | **yes** | S2 |
| `packages/cli/e2e` | 6 (5) — all five gate files from cycle 1 | **all six lines are sub-path** (`/sse` ×3, `/telemetry` ×3) | **yes** | S2 |
| `packages/cli` | 0 — 6 string refs (codegen/maps/generated) | — | correctly none | — |
| `packages/mcp` | 0 — generated corpus string only | — | correctly none | — |
| `packages/fresh-ui` | 0 — nested lock only | — | correctly none | — |

Every workspace member with a module edge declares; no undeclared edge remains. Cross-check: the
root `deno.lock` `workspace.members[*].dependencies` lists
`jsr:@netscript/plugin-streams-core@0.0.6` under exactly those 11 declaring members (JSON walk,
37 members total) — the lock and the manifests agree 1:1.

## Verification 2 — specifier style: PASS

All 12 declaring lines across the 11 manifests are byte-identical to the established pattern:
`"@netscript/plugin-streams-core": "jsr:@netscript/plugin-streams-core@0.0.6",`. The four S2
manifests each add exactly this one line in the existing `imports` map, adjacent to the other
`@netscript/*` entries, with no other key reordered. `plugins/workers/deno.json` (the pattern
reference) is untouched by the diff. `packages/fresh` additionally carries a pre-existing
`/sse` sub-path key — unchanged, and not part of the required pattern.

## Verification 3 — unnecessary declarations: NONE

- Every one of the 11 declaring manifests has at least one real module edge (table above) — there
  is no declare-without-import member.
- Members with no edge (`packages/cli`, `packages/mcp`, `packages/fresh-ui`) correctly do not
  declare.
- Sub-path coverage of the `packages/cli/e2e` declaration was tested rather than assumed: a
  scratch workspace whose `imports` map contained **only** the bare key
  `"@netscript/plugin-streams-core": "jsr:@netscript/plugin-streams-core@0.0.6"` type-checks a
  file importing `@netscript/plugin-streams-core/telemetry` →
  `SUBPATH_PROBE_REAL_EXIT=0` (parent workspace ignored, so the bare key alone did the resolution).
  Deno extends bare jsr keys over sub-paths, so `cli/e2e`'s single bare declaration covers all six
  of its `/sse` and `/telemetry` import lines. An apparent inconsistency dissolved under test and
  is recorded here as positive evidence, not a finding.

## Verification 4 — lock delta: PASS (justified, minimal, no drift)

`git diff 38f2ce735..166c242be -- deno.lock`: **6 added lines, 0 removed**, each exactly
`"jsr:@netscript/plugin-streams-core@0.0.6",`, in six hunks all inside workspace-member
dependency lists — one per newly declaring manifest (S1: `plugin-workers-core`, `triggers`;
S2: `sdk`, `plugin-sagas-core`, `plugin-auth-core`, `cli/e2e`). Independent JSON walk of the head
lock: 11 members declare (7 at base + 4), each with exactly one streams-core entry; the `jsr` and
`npm` specifiers stanzas contain no streams-core entries at either ref and no package/version
stanza moved. No version drift anywhere.

## Verification 5 — scope: PASS

`git diff --stat 38f2ce735..166c242be`: five member manifests (+1 line each), `deno.lock` (+6),
and the run directory only (`codex-thread-ids.md`, cycle-1 `impl-eval.md`, and the leaf's
artifacts). No `.ts`/`.tsx` source change, no new check/gate/fitness script, `plugins/workers`
untouched, no existing artifact rewritten. Worktree verified clean after all evaluator gate runs
(`git status --porcelain` empty — no residue).

## Verification 6 — worklog contract and drift: PASS

- `worklog.md` § Design now states the cycle-2 contract exactly as delivered: every workspace
  member other than `plugin-streams-core` itself with a **static import/export module specifier**
  rooted at the package declares the exact dependency, with string literals "reported separately
  and ... not counted as module edges". The delivered manifest set satisfies it precisely.
- `drift.md` records both cycle-1 findings: the completeness gap (severity **significant**, naming
  all four undeclared members at `10aa2a944`, with fix and evidence) and the string-reference
  misclassification (minor). Cycle 1's medium finding is fully discharged.

## Gates re-derived at head (claims falsified where they deserved it)

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Publish dry-run | `deno task publish:dry-run` | PASS | `PUBLISH_DRY_RUN_REAL_EXIT=0`, "Success Dry run complete" (supervisor claim confirmed) |
| Architecture | `deno task arch:check` | PASS | `ARCH_CHECK_REAL_EXIT=0`; pre-existing WARN lines only, zero failures (claim confirmed) |
| Scoped check, the four changed member roots | `run-deno-check.ts --root packages/sdk --root packages/plugin-sagas-core --root packages/plugin-auth-core --root packages/cli/e2e --ext ts,tsx` | PASS | `SCOPED_CHECK_4ROOTS_REAL_EXIT=0`; 425 files, 4 batches, 0 failed |

Proportionality: the delta over cycle 1's fully-gated head `10aa2a944` is four manifest lines plus
four lock lines, so the scoped check over exactly the changed members plus the two root-level
gates named as claims is the sufficient independent set. Heavier gates (root check, lint, fmt,
`quality:scan`, corpus checks) were re-derived by cycle 1 and the leaf; nothing in the delta can
alter them beyond what the scoped check covers.

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL before implementation | PASS | justified `PLAN-EVAL: N/A` recorded before S1; mechanical manifest change (accepted by cycle 1) |
| Design checkpoint | PASS | `worklog.md` § Design updated to the cycle-2 contract, with separate string-reference reporting |
| Commit slices | PASS | S1 `10aa2a944` (issue's two members), eval `4f194dbb1` (preserved), S2 `166c242be` (completeness); each names what it proves |
| Commit trail | PASS | PR #1876: OPEN, **draft**, head `166c242be`, base `main` (`gh pr view 1876` — read-only) |
| Evaluator separation | PASS | generator OpenAI GPT-5.6 Sol (`supervisor.md`); this is a separate opposite-family session |
| Issue letter (#1543) | PASS | box 1: publish evidence re-confirmed (`REAL_EXIT=0`); box 2: both named manifests declare; box 3: N/A — no new gate added, condition still holds |
| Issue spirit (workspace-wide consistency) | PASS | all five formerly undeclared members now declare; the declaring/undeclared split between sibling cores (`plugin-workers-core` vs `plugin-sagas-core`/`plugin-auth-core`) that cycle 1 flagged is closed |
| Prior findings | PASS | cycle-1 high (completeness) fixed; medium (contract wording + drift) fixed; low (reference-kind) fixed via separated census |

## Observations (non-blocking, no action required)

| Severity | Observation |
| --- | --- |
| info | `docs/site/reference/streams/examples_test.ts:2-3` contains real import statements but `docs/` is not a workspace member (no manifest exists to declare in; resolution comes from the root config). Out of the design contract's scope — recorded so a future "workspace-complete" claim does not stumble on it. |
| info | The pre-existing `check:mcp-export-corpus` staleness drift carries unchanged (recorded in `drift.md`, forbidden `packages/mcp` scope untouched). |
| info | `packages/fresh`'s explicit `/sse` sub-path key is style, not necessity — the bare key already covers sub-paths (Verification 3 probe). Relevant context for any future bump wave: one bare declaration per member is sufficient for tooling to see the dependency. |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | PASS |
| Rationale | The completeness delta is done and correct: an independently derived, reference-kind-separated census shows every workspace member with a real module edge now declares the exact established specifier, the lock gained exactly six identical member-dependency lines with no version drift, scope is manifests + lock + run artifacts only, the worklog contract now matches what is delivered, `drift.md` records the cycle-1 gap, and the three disclosed gate claims were re-derived with captured exits and all confirmed (`publish:dry-run` 0, `arch:check` 0, scoped check 0). No unnecessary declarations exist; the one sub-path ambiguity was resolved empirically in favor of the implementation. |

VERDICT: PASS
