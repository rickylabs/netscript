# docs(doctrine): the codebase verdict table names five deleted packages, omits 14 live units, and its `arch:check:repo` gate has been accepted-red since 2026-06-21 — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T6-03 · **Proposed milestone:** 0.0.6 · **Labels:** `type:docs` `area:docs`
`area:tooling` `area:packages` `priority:p2` `status:triage` · **Depends on:** none (this is the
denominator the rest of the remediation train measures against)

## Location

`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`, `.llm/harness/debt/arch-debt.md`
(entry "repo doctrine task — full historical scan remains red"), `.llm/tools/fitness/check-doctrine.ts`,
`deno.json:155-156`, `rfcs/`.

## Kind of issue

Out-of-date content with governance consequences — the doctrine's own definition of done cannot be
evaluated against the current package set, and its mechanical gate cannot be read as a verdict.

## Summary

The doctrine's per-package verdict table is the roadmap's denominator: `10-…md:197-208` defines
doctrine completion as "`arch:check` passes for every package … and the codebase walk above shows
zero Restructure or Rewrite verdicts". That walk names five packages that no longer exist, omits 14
that do, the promised engineering reference is ~20% written, and the repo-wide gate that would
adjudicate it has been accepted-red for seven weeks. Now: a remediation roadmap that schedules
refactor work against this table would schedule work on deleted units and skip the entire auth and
`plugin-*-core` tiers.

## Details

All counts executed at baseline `fac9e339042c` on 2026-08-08. Corpus:
`research/repo-audit/scaffold-doctrine.md` §3.1-3.5, divergences D6/D7/D8/D9/D10.

**D6 — verdict table vs reality.** `10-…md:22-51` holds 29 rows.
- Rows naming units absent from `ls packages/`: `@netscript/shared`, `@netscript/streams`,
  `@netscript/triggers`, `@netscript/workers`, `@netscript/sagas`. Row naming a unit absent from
  `ls plugins/`: `plugins/hello-world`. (Four of the five packages were plausibly renamed into the
  `plugin-*-core` tier; the re-walk must record rename-vs-deletion per row, not assume.)
  Note `@netscript/shared` also has a dedicated doctrine subsection at `06-archetypes.md:378-388`
  and is remediation priority #3 at `10-…md:46,67-69`.
- Live units: **30** dirs under `packages/` + **6** under `plugins/` = 36. Units with **no row**:
  `ai`, `auth-better-auth`, `auth-kv-oauth`, `auth-workos`, `bench`, `mcp`, `plugin-ai-core`,
  `plugin-auth-core`, `plugin-sagas-core`, `plugin-streams-core`, `plugin-triggers-core`,
  `plugin-workers-core`, `plugins/ai`, `plugins/auth` — **14**, including the whole auth family and
  the entire `plugin-*-core` tier that `11-plugin-thinness-and-base-seams.md` is built around.
- The same staleness reaches the archetype assignment table at `06-archetypes.md:368-381`.

**D7 — engineering reference.** `10-…md:79-181` specifies ten required contents. §7 (debt registry)
exists as `.llm/harness/debt/arch-debt.md`. §6 (fitness-function source) is partial:
`.llm/tools/fitness/` contains exactly 5 files (`audit-jsr-package.ts`, `check-doctrine.ts`,
`check-ds-color-utilities.ts`, `check-ds-no-raw-hex.ts`, `check-ds-gates_test.ts`). §1–§5 and
§8–§10 — archetype recipes, role-folder recipes, pattern skeletons, per-anti-pattern fix catalogue,
refactor playbooks, review checklist, glossary, phased roadmap — do not exist.

**D8 — the accepted-red gate, decomposed.** `deno task arch:check` exits **0**; it iterates 16
hand-listed roots (`deno.json:155`) out of 36 live units, so **20 live units have no doctrine gate
at all**. `deno task arch:check:repo` exits **1** with `FAIL=53 WARN=341 INFO=1`. The 53 failures
decompose into exactly two mechanical causes, neither of which is package debt:
- **52 × `FAIL A14: Jest/Vitest globals`** are false positives. `check-doctrine.ts:407` matches a
  bare `describe(` / `it(` / `expect(` anywhere in a `*_test.ts` file without checking where the
  identifier came from. Example: `packages/database/tests/migrate-retry_test.ts:10` is
  `import { describe, it } from 'jsr:@std/testing@^1/bdd';` — the sanctioned Deno BDD API.
- **1 × `FAIL A1: mod.ts missing`** is structural. `deno.json:156` runs `check-doctrine.ts` with no
  `--root`, so the checker evaluates the repository root as a single package
  (`check-doctrine.ts:110-113`) and walks trees that are not packages: 16 of the cited findings are
  under `.llm/tmp/eis-chat/…`, plus `docs/site/` and `.llm/tools/`.
The `arch-debt.md` entry recording this is Created **2026-06-21**, `Status: open, DEBT_ACCEPTED`,
Target "2026-Q3", closing gate "reduce unrelated root failures **or** replace the legacy root scan
with debt-aware package selection". The decomposition above shows the second branch is the cheap
one.

**D9/D10 — RFC practice divergence.** `ls rfcs/` → `0000-template.md`, `README.md`. Zero numbered
RFCs have ever landed. Real design records live at `.llm/runs/plan-*--seed/design/canonical/`,
produced by merged PRs #891 (deploy plugin family) and #1123 (OpenAPI→MCP) and cited by
`.github/labels.yml` label descriptions as "RFC #891" / "RFC #1123". `rfcs/README.md:82-86`
self-flags as provisional, deferring to "a ratified doctrine governance statement" that does not
exist in `docs/architecture/doctrine/`. Meanwhile `arch-debt.md` carries 5 `DECISION_PENDING`
entries, 4 of them public-surface questions that `rfcs/README.md:15-24` says *require* an RFC:
`CRON-SUBSYSTEM-DUP` (1536), `RUN-ARTIFACT-ARCHIVAL-POLICY` (1582), `PAGEBUILDER-LEGACY-COMPAT-TREE`
(1598), `FORMPAGEPROPS-PLAYGROUND-MIGRATION` (1613), `REDIS-LEGACY-VALUE-FALLBACK` (1628). The
archival-policy entry proposes pruning the very tree where the de-facto RFCs live.

## Target contract

1. The verdict table enumerates every live unit under `packages/` and `plugins/` and nothing else,
   with rename-vs-deletion recorded for each removed row.
2. `arch:check:repo` is a real verdict: it iterates live workspace members rather than treating the
   repository root as a package, and its A14 rule does not fire on `@std/testing/bdd` imports.
   Whatever residue remains is either green or listed as named debt entries with owners.
3. The `arch-debt.md` accepted-red entry either closes or states a dated closure plan naming the two
   causes above.
4. The engineering reference has a written, dated plan for §1–§5/§8–§10 — authored *from* the
   refactors as a byproduct, not as a separate project.
5. The RFC divergence is recorded and resolved one way: either `.llm/runs/*/design/canonical/`
   bundles are promoted to numbered `rfcs/NNNN-*.md` at acceptance, or `rfcs/README.md` is retired
   and the harness path is named as canonical.

## Acceptance

- [ ] The verdict table lists all 36 live units and no deleted ones.
- [ ] Each removed row is recorded as renamed (with its new name) or deleted.
- [ ] `06-archetypes.md` archetype assignment table matches the refreshed verdict table.
- [ ] `arch:check:repo` iterates live workspace members instead of the repository root.
- [ ] The A14 rule does not fire on a test importing `describe`/`it` from `@std/testing/bdd`.
- [ ] `arch:check:repo` no longer walks `.llm/tmp/`, `docs/`, or `.llm/tools/`.
- [ ] The `arch-debt.md` accepted-red entry is closed or carries a dated closure plan.
- [ ] The doctrine records which of the 36 units `arch:check` gates and why any are excluded.
- [ ] The engineering-reference gap (§1–§5, §8–§10) is recorded as a dated plan, not silence.
- [ ] The RFC-location divergence is resolved in `rfcs/README.md` with the 5 `DECISION_PENDING`
      entries mapped to the chosen location.
- [ ] A test fails if the verdict table names a directory that does not exist.
- [ ] A test fails if a live `packages/*` or `plugins/*` directory has no verdict row.
- [ ] `gate:` `deno task arch:check` stays green and `deno task arch:check:repo` exits 0 or its
      residue is enumerated in `arch-debt.md`.

## Boundaries

- Do **not** perform the six open verdict-Refactor/Restructure refactors here (`packages/database`,
  `packages/kv`, `packages/service`, `packages/workers`, `plugins/triggers`, `plugins/workers`) —
  this issue re-establishes the denominator; the refactors are separate slices.
- Do **not** file the five `DECISION_PENDING` RFCs here; this issue only records where RFCs live.
  The generated-workspace governance RFC (D5) is a separate T3/T8 item.
- Do **not** duplicate #1093 — plugin-discovery hardcoding is its own defect with its own doctrine
  check requirement.
- Do **not** touch #1280 (`status:blocked` upstream) or #1320 (blocked on `@ag-ui/core`).
- Do **not** re-file #232 or #301 (docs/stable umbrellas); this is a doctrine-document refresh, not
  a docs program.

## Docs/consumer proof

`docs/architecture/doctrine/` is the published governance surface every framework contributor and
every harnessed agent reads via `.agents/skills/netscript-doctrine`. The consumer proof is that a
contributor running `deno task arch:check:repo` gets a verdict they can act on rather than 53
failures they must learn to ignore — and that the doctrine skill's routing no longer points at rows
for packages that do not exist.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Source:
`research/repo-audit/scaffold-doctrine.md` §3.1-3.5 and divergence rows D6–D10; §6 Phase A names the
verdict re-walk as the roadmap's denominator. The `arch:check:repo` failure decomposition (52 A14
false positives + 1 root-as-package A1) is new to this draft — executed at `fac9e339042c`, not
present in the corpus, and it converts the seven-week-old "reduce unrelated root failures" gate text
into two named, cheap fixes.
