# Tier-A — #1729 grouped agent-init leaf at `9abc76d48cb7bf63ee25b413fb72160362bc2e8c`

Grouped leaf for **#1674 (p0)**, **#1672**, **#1675** · PR #1729 · branch
`fix/agent-init-guidance-and-cross-host-skills` · integrated `main@8b1e42f725919457c64781d5973fd419017fab13`
(through #1711 and #1728). Reviewer = topic supervisor, not evaluator, not author. Probes ran in a
pristine tracked-files-only archive of the exact head.

## Main integration — semantics preserved

| Check | Result |
| --- | --- |
| Integration method | **merge**, not rebase — `a04e505f4`; gate receipts keep commit correspondence |
| `main@8b1e42f72` is ancestor | yes |
| Product paths vs pre-merge checkpoint `83d24ba57` | `git diff --stat` over the agent-init product roots → **empty**; the merge changed no product byte |
| Leaf-attributable product paths vs main | exactly five: `assets/agent/guidance.md.template`, `assets/embedded.generated.ts`, `assets/manifest.ts`, `features/agent/init/init-agent.ts`, `features/agent/init/init-agent_test.ts` — no sixth path |
| Conflict markers under `packages/` | none |

## Shared derivative cascade — regenerated from the exact merged base

| Gate | Result |
| --- | --- |
| `check:agent-docs-prose` | `fresh: true`, `stalePaths: []`, exit 0 |
| `gen:assets-barrel` re-run | **reproduces the committed `embedded.generated.ts` byte-for-byte** |
| `check:mcp-export-corpus` | exit 0 |
| `check:publish-assets` | exit 0 |

The author regenerated the CLI barrel rather than shipping a template-only fix — the trap that leaves
a scaffold stale while the template looks correct.

## Product gates

- structured `check` on the agent feature root: **18 selected, 0 failed batches, 0 diagnostics**
- `init-agent_test.ts`: exit 0, **22 passed / 0 failed**
- `packages/cli` lint: 884 selected, **0 occurrences**
- `packages/cli` fmt: 884 selected, **0 findings**

### A red controlled away rather than filed

`run-deno-lint.ts --root packages/cli/src/public/features/agent` exits 2 with
`deno lint coverage refusal: all-excluded`. Run against a **base archive of `main@8b1e42f72`** the
refusal is byte-identical, and at `packages/cli` scope both head and base report the same shape —
884 files, 5 failed / 4 excluded batches, **0 occurrences**, 0 fmt findings. This is pre-existing
exclusion-config behaviour for that sub-root, not a leaf regression. Reporting it as a finding would
have been a false accusation from an unvalidated fixture, the same error class as the earlier
`deps:check:zod` false red.

## Behavioural close-gate — resolved before evaluation

The author correctly surfaced rather than decided the three acceptance boxes that require a measured
unfamiliar-agent signal (#1672 a4, #1674 a4, #1675 a5). Supervisor decision: all three marked
`[post-merge]` on the issue bodies, to be verified by one follow-up wave measuring `deno doc` usage,
`ui:add`/`find_guidance` usage, and skill invocation together against the merged artifact. This is the
marker's stated purpose — a fact that cannot exist until after merge — and it unblocks the closing
keywords rather than dropping them to dodge an impossible check.

## Verdict

`PASS`. Ready for a **fresh opposite-family IMPL-EVAL**. PR remains draft / `status:impl`; no
readiness flip or merge until that verdict returns PASS.

## ADVISORY-1 repair Tier-A at `608f68b076bfb724d111bdaf075fd4111703d937`

IMPL-EVAL cycle 1 returned **`PASS_IMPL`** at `9abc76d48` (artifact
`907cce4147d999f1ea0f145ca02731307cf680d4` on `eval/impl-eval-1729-cycle-1`) with two advisories.

**ADVISORY-1 taken.** The guaranteed-read root file claimed the app guide explains
`defineRouteContract`, `staleTime`, dehydration and optimistic UI; the evaluator's `grep -c` of the
generated `apps/evalapp-web/AGENTS.md` returned **0** for each. Advisory rather than blocking because
#1674's boxes were still met — but this leaf exists to stop the guaranteed-read file misdirecting an
agent, so shipping a pointer that overstates its own target would reproduce the defect in a new place.

Corrected sentence now claims only `definePage`, `withResource`, `withForm` — each counted 1 in the
generated target — and routes the other four to MCP `find_guidance` and the offline docs. The link and
its "read it before app work instead of inventing a parallel pattern" instruction are preserved;
#1674 acceptance box 2 rests on those.

| Check | Result |
| --- | --- |
| Product delta since evaluated head | exactly three files: `guidance.md.template`, `embedded.generated.ts`, `init-agent_test.ts` — no sixth path |
| Barrel regenerated | `gen:assets-barrel` **reproduces committed bytes** |
| Installer suite | exit 0, **22 passed / 0 failed** |

**ADVISORY-2 filed as issue #1737** (`type:fix`, `area:cli`, `area:agentic`, `p2`, milestone 0.0.7):
`skills/netscript/SKILL.md:43` and `skills/netscript-operate/SKILL.md:50` still reference
`.claude/skills/help.md`, contradicting the canonical-tree convention this leaf establishes. `skills/`
is outside the five-path ceiling, so the evaluator correctly declined to fix it and so did this leaf.
The follow-up states the barrel-regeneration requirement so it does not repeat the template-only trap.

### Supervisor evidence correction

The PR's `acceptance-evidence` entry for #1674 box 2 had **repeated the overstatement** — it cited the
guidance as promising `defineRouteContract`, `staleTime`, dehydration and optimistic UI from the app
guide. That was written from the guidance text rather than checked against the link target. Corrected
in the PR body to match the repaired wording. Lesson: evidence quoting a pointer must be verified
against what the pointer resolves to, not against the pointer's own claim.

### Next

Bounded delta re-review dispatched to the **same independent evaluator** (it holds full cycle-1
context and is independent of the author): confirm the claim is now accurate in both directions, the
link and instruction survive, the barrel reproduces, and nothing else moved. Verdict `DELTA_PASS` or
`DELTA_FAIL`. On `DELTA_PASS`: `status:ready-merge`, rerun CI so close-gate reads live labels, merge
when green, then dispatch #1673.
