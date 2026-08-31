use harness

## SKILL

Activate `.agents/skills/netscript-harness` for the run lifecycle and artifacts, plus
`.agents/skills/netscript-cli` (this leaf is CLI/scaffold work), `.agents/skills/netscript-doctrine`
for any `packages/` surface decision, `.agents/skills/netscript-tools` for validation wrappers and
gate evidence, `.agents/skills/netscript-deno-toolchain` for `deno doc`/dependency inspection, and
`.agents/skills/netscript-pr` for branch/PR/issue process. If a skill is absent from `.claude/skills/`,
read `.agents/skills/<name>/SKILL.md` directly. Follow `AGENTS.md` read order and prefer `rtk` for
read-heavy git/grep inspection.

# Slice brief — re-intake wave-A grouped leaf: `agent-init-guidance-and-cross-host-skills`

Issues **#1674 (p0)**, **#1672 (p1)**, **#1675 (p1)** · milestone `0.0.7` · fixes topic ·
branch `fix/agent-init-guidance-and-cross-host-skills` · base `5bb112dd35f94fc8435672e2cabff1f9a447aa0b`
· run dir `.llm/runs/fix-agent-init-guidance-and-cross-host-skills--0.0.7/`

You are the canonical implementation author for this leaf. Coordinator has grouped these three
because they land in **one shared generated surface** — the output of `netscript agent init` — while
keeping **three distinct acceptance sets**. Do not merge them into a single undifferentiated change:
every acceptance box must be individually satisfiable and individually evidenced.

## Phase

**RESEARCH → PLAN → IMPLEMENT.** Produce `research.md`, `plan.md`, `context-pack.md`, `worklog.md`,
`drift.md` in the run dir. Do not self-certify; a separate supervisor Tier-A and an independent
opposite-family IMPL-EVAL follow.

## The three problems, kept distinct

**#1674 — p0, the guaranteed-read file teaches diagnostics but not building.** Root `AGENTS.md`
(~1,655 bytes) is the one file every coding agent loads by default. It covers `find_guidance`,
`search_docs`, `doctor`, `aspire otel`, drift receipts — and names **zero** build surfaces:
`definePage`, `withResource`, `staleTime`, `withForm`, `defineRouteContract`, query factories,
dehydration, optimistic UI all occur 0 times, and it never links `apps/<app>/AGENTS.md`, which is the
file that actually teaches the architecture. Measured consequence: a Wave 7 run deleted
`routes/(_components)/dashboard-view.tsx` — the first file the app guide says to inspect — and
finished with 0 route contracts, 0 dehydration, 0 `ui:add`, 0 MCP calls.

Contract: state the architectural spine in a few lines (database-derived schemas → contract →
service → typed SDK and query factories → `definePage` composition → islands); **link
`apps/<app>/AGENTS.md`** and say what it is for; name the `ui:add` route/island verbs. Keep it a
pointer surface, not a tutorial.

**#1672 — p1, generated guidance never teaches the Deno toolchain.** Wave 7 run 1 made **55 `deno`
invocations, zero of them inspection commands** (`deno doc` 0, `deno info` 0, `deno eval` 0), then
answered "what is this package's public API?" with **40 `curl` fetches of raw source from jsr.io**.
Generated `AGENTS.md` mentions `deno info` once and never mentions `deno doc`, `deno eval`, or
`deno.com/agents.md`.

Contract: link <https://deno.com/agents.md> as the canonical primer with its one-line setup prompt;
teach the inspection verbs **before** implementation — `deno doc <module>`, `deno doc --filter
<symbol>`, `deno info`, `deno eval` — explicitly as the alternative to reading source over HTTP; name
the quality verbs the workspace already defines and state a run is not finished until the test task
has run; point at `deno outdated` / `deno why` / `deno add` rather than hand-edited imports. **Link,
do not duplicate** the `netscript-deno-toolchain` skill's content.

**#1675 — p1, skills install Claude-only and invert the framework's own convention.** `agent init`
writes skills **only** to `.claude/skills/`; `.agents/skills/` is absent. Any non-Claude host (`agy`,
Gemini, Kimi, Grok, Qwen over OpenRouter) structurally cannot see them. This repo's own `CLAUDE.md`
states the opposite relationship: `.agents/skills/` is canonical and `.claude/skills/` is generated
from it. Measured: **1 skill invocation in ninety minutes**, despite the root file naming the skills
— being named without *when to invoke which* produced ~zero use.

Contract: `agent init` writes `.agents/skills/` as canonical and **generates** `.claude/skills/` from
it, mirroring the framework's own relationship; host selection still decides which mirrors are
emitted (`--host all` emits both) but the canonical copy is never host-specific; root `AGENTS.md`
says **when to reach for each skill**, not merely that they exist.

## Shared surface, separate evidence

All three change `agent init` output, and #1674/#1675 both touch the root `AGENTS.md` content. Plan
the file's structure **once** so the three contributions compose rather than collide, but keep the
acceptance evidence separable — a reviewer must be able to see which change satisfies which issue.

## A close-gate problem you must surface, not paper over

Several acceptance boxes across all three issues demand a **measured unfamiliar-agent smoke**
(non-zero `deno doc` usage, non-zero `ui:add` or MCP `find_guidance` usage, non-zero skill
invocation), each with the clause "or an explicit recorded rejection — silence is a harness failure,
not an agent failure."

An implementation leaf **cannot** produce a behavioural wave measurement. Do not fabricate one and do
not quietly tick those boxes. In `plan.md`, identify exactly which boxes are behavioural and propose
the disposition — a `[post-merge]` marker, or an explicit recorded rejection with reasoning — and
**surface it to the supervisor as a decision rather than deciding it yourself**. It affects whether
this PR can pass the close-gate at all.

## Scope

- Product surface is the `agent init` implementation and its templates/assets under `packages/cli`.
  Establish the exact path set in RESEARCH and **state it as a ceiling in `plan.md`**; treat any path
  beyond that ceiling as a rescope requiring supervisor approval.
- **Remember the generated cascade.** CLI asset or template edits require their generated barrel
  regenerated — `packages/cli/src/kernel/assets/*.generated.ts` is what actually ships, and a
  template-only fix leaves the scaffold stale with `check:assets-barrel` red. If your change touches
  the docs corpus or a public export surface, the cascade extends to `check:agent-docs-prose`,
  `check:mcp-export-corpus`, and `check:publish-assets`. Put every applicable gate in the plan's gate
  list up front; a sibling leaf lost two review cycles to exactly this omission.
- Do not change this repository's own `AGENTS.md`, the `netscript-deno-toolchain` skill, or the MCP
  corpus (#1201). Do not change the scaffold's example routes (#1333).

## Gates

Select from the harness gate matrix and justify each. At minimum expect: `deno task check` /
`test` / `lint` / `fmt:check` scoped to the touched roots via the structured wrappers, the assets
barrel check, and a **scaffold-level proof that a fresh `agent init --host all --with-docs` produces
the contracted files** — that is the only way to show the shipped generator changed, not just a
template.

`e2e:cli` and Aspire/Docker runtime gates are **not** authorized for this leaf without an explicit
request to the supervisor; Aspire is not a global barrier and no other lane blocks you.

## Boundaries

- No merge, no readiness flip, no label change, no issue closure.
- No `deno.lock` modification.
- Do not touch PR #1711, the `fix/prisma-mysql-honest-example` branch, or any eval worktree — an
  independent evaluator is running there concurrently.
- Push only this branch, with an explicit full refspec.
- No self-certification.

## Finish

Open a **draft** PR referencing all three issues **without** closing keywords until the behavioural
acceptance question above is resolved, report the exact head SHA and your gate receipts, then stop
for supervisor Tier-A.
