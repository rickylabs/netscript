# Wave 6 — `@netscript/cli` — RESEARCH-ONLY summary

**Phase:** Research (analysis + proposed target architecture + seams). No implementation, no `packages/` edits.
**Branch:** `feat/package-quality-wave6-cli`
**Commit:** `0b1bf3d` — `docs(wave6-cli): research findings — domain decomposition, standards, deploy seams, scaffold improvements, risk register`
**Deliverable:** `.llm/tmp/run/feat-package-quality-wave6-cli--research/research.md` (1,609 lines, single file)

## Summary

Produced a research-only deep-dive of `@netscript/cli` answering the 6 feedback
points in `research-brief.md` (questions A–F, hard boundaries respected). The
artifact is a single self-contained `research.md` that the next OpenHands
session (or a human maintainer) consumes as the **implementation plan** for
the Wave 6 cli promotion from A6-v1 to A6-v2.

The research answers, with file:line evidence:

- **A. Domain decomposition** — the CLI owns 7 bounded domains
  (scaffolding, runtime, deploy, database, plugin, config, loggers) + 3
  command surfaces (public, maintainer, local) + 1 cross-cutting kernel.
  Current `packages/cli/src/{kernel,public,maintainer,local}/` is
  **architecturally correct** for A6; the target tree is a *bounded set of
  moves*, not a rewrite. A6 v2 gate matrix in §A.5.
- **B. Standards** — proposed `packages/cli/docs/standards.md` outline
  (§S.1–§S.7): command contract, typed error model, IO discipline, naming,
  testing tiers, public-surface rules, layer discipline. **14 violations
  catalogued** (V-1 through V-14) with file:line evidence.
- **C. Future-impl readiness** — 5 registries already seam-ready
  (`Template`, `DbEngine`, `OutputRenderer`, `PluginKind`, `DeployTarget`).
  `DeployTargetKey` is a literal-union lock-in (V-9) that gets fixed by
  the `DeployTargetPort` slice. `CliExitError` tree already in
  `kernel/domain/errors/`.
- **D. Aspire 13.4 deploy seams (DESIGN ONLY)** — `DeployTargetPort` +
  `DeployTargetRegistryPort` defined. 17 `Deno.Command` sites categorized;
  only 2 are aspire (`aspire-command-executor.ts:27,47` → `aspire run`,
  `aspire <sub>`). Windows deploy is *not* aspire — it becomes the
  `WindowsServiceDeployTarget` adapter. Future k8s / container / cloud
  adapters wrap `Aspire.Hosting.Kubernetes`, `Aspire.Hosting.ContainerApps`,
  `Aspire.Hosting.AWS`, `Aspire.Hosting.Azure`. Aspire 13.4 native Deno
  apphost not yet released at research time; bump deferred to slice 5.
- **E. Scaffolding improvements** — bounded, concrete, incremental
  (E.2.1–E.2.10). Scaffold is 1,361 LOC across 13 files (max 211 LOC).
  Wave 5 verdict `scaffold.runtime` 41/41 green.
- **F. Own analysis** — `deno check packages/cli` is **clean**;
  `deno publish --dry-run` fails **upstream in `packages/aspire`** (doctrine
  §9 documented false positive — not a CLI blocker). No file exceeds
  500 LOC (max 384, in `ui/registry.ts` and `scaffold/writers/write-app-files.ts`).
  **Zero** `console.*` leaks. One vendor URL leak (V-14:
  `editor-config.ts` lines 42, 115). Test/code ratios: kernel 13.7 %,
  public 9.2 % (thin), maintainer 11.6 %, local 25 % (small N), e2e 9.7 %.
  15 risks registered (R-1 to R-15).

**Wave 6 implementation slice plan (NOT executed):** 7 slices (0–6),
each ≤ 1 PR, sized for a single OpenHands session. Critical path:
0 → 2 → 3 → 4 → 6. Parallel: 1 (docs) and 5 (Aspire 13.4).

**AP-1 verdict (Research):** the existing `packages/cli AP-1` "Restructure"
debt is **valid**; the restructuring is **bounded** to the moves in the
target tree. The CLI is *not* broken — it is a *fast-evolved* A6-v1 that
needs a planned promotion to A6-v2. Closing AP-1 is a 7-PR program, not
a single rewrite.

## Changes

- `M .llm/tmp/run/feat-package-quality-wave6-cli--research/research.md`
  (+1,591 / -8 lines)
- New content sections (A–F) + TL;DR + slice plan + target `src/` tree +
  standards outline + summary + open questions + reading order.
- **No `packages/` edits** (the brief forbids them in the research phase).
- **No `deno.json` edits, no `deno.lock` edits, no `AGENTS.md` edits, no
  doctrine edits.** Workspace structure unchanged.

## Validation

- `deno check packages/cli/mod.ts` — **PASS** (verified during research).
- `deno publish --dry-run` (root) — **FAILS upstream in `packages/aspire`**
  (doctrine §9 documented false positive; not a CLI blocker). The CLI's
  own dry-run is the scoped `deno check mod.ts maintainer.ts scaffolding.ts
  testing.ts` task, which is green.
- `find … -name "*.ts"` LOC scan — **no file exceeds 500 LOC** (max 384).
- `grep -rln "console\\." packages/cli/src --include="*.ts"` —
  **0 production-code hits** (only the central `console-logger.ts`
  emitter, by intent).
- `grep -rE "raw\\.githubusercontent|node_modules|github:|gitlab"` —
  **1 hit** (V-14, in `editor-config.ts` lines 42, 115).
- `find … -name "*_test.ts"` / `find … -name "*.ts"` ratios — kernel
  13.7 %, public 9.2 %, maintainer 11.6 %, local 25 %, e2e 9.7 %.

## Responses to review comments / issue comments

PR #43 is the Wave 6 cli research trigger. The body asked for a
research-only deep dive answering 6 feedback points; the run produced
`research.md` as a single 1,609-line artifact committed at `0b1bf3d`.
No automated review threads exist on this PR yet (the research is the
first deliverable); the slice plan's slice 6.5 commits the verdict
entry that closes AP-1.

## Remaining risks

- **R-1 (HIGH likelihood, LOW impact):** `aspire` barrel false-positive
  in root `deno publish --dry-run`. Mitigated by treating it as a sibling
  PR (slice 0.3), not a Wave 6 cli risk.
- **R-2 (MEDIUM):** 6 files in the 320–384 LOC range need a passive
  monitor; the lint-fitness soft warning is slice 3.6. The two
  approaching-cap files (384 LOC) are split in slice 3.4 / 3.5.
- **R-3 (LOW):** `editor-config.ts` references a pinned HTTPS schema URL
  (V-14). Mitigated by mirroring the schema in slice 5.3.
- **R-4 (MEDIUM):** `src/public/` test ratio stays at 9.2 % until slice
  2.5 adds 4 in-memory-port unit tests.
- **R-5 (HIGH):** `e2e/` is not a true workspace member. Mitigated by
  one-line root `deno.json` change in slice 0.1.
- **R-11 (LOW likelihood, HIGH impact):** slice 2 (command-registry
  rewrite) is the load-bearing change. Slice 2 is **only allowed to land
  with a green `scaffold.runtime` rerun** (41/41); the PR template blocks
  merge without it.
- **R-12 (HIGH):** doc drift between `research.md` and the actual impl.
  Mitigated by the slice 6.4 "impl-realized" log.
- **R-15 (HIGH likelihood, HIGH impact):** the hand-wired
  `public-command-tree.ts` chain (V-1, F-CLI-27) becomes a maintenance
  hotspot if slice 2 doesn't close it. Slice 2 **must** close V-1.

5 open questions for the maintainer are listed in §"Open questions for the
maintainer" of `research.md`; the maintainer's answers are required
before slice 0 lands.

---

RESEARCH COMPLETE
