# Worklog: agent init skill discoverability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1023-agent-init-skill-surface--skills-discoverability` |
| Branch | `fix/1023-agent-init-skill-surface` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `netscript agent init` installed Claude skill bundle.
- The marked `AGENTS.md` NetScript guidance block.
- Root `skills/manifest.json` and generated embedded barrel.

### Domain Vocabulary

- installed skill — one name in `manifest.skills` backed by `<name>/SKILL.md`.
- companion playbook — installed `help.md`, routed from AGENTS/skills but not itself a skill.
- skill reference — explicit hand-off wording that must resolve to an installed skill name.

### Ports

- Existing `AgentInitFileSystem` only; no new port.

### Constants

- `AGENTS_SECTION` — one marked, deterministic block naming all five skills and `help.md`.
- Manifest `skills` — the finite allowed route targets.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove the source bundle is complete, symptom-routed, documented, and semantically tested. | focused init tests + review | `skills/**`, installer/test, docs, `deno.json`, run artifacts |
| 2 | Prove the embedded artifact matches source and the requested gate set passes. | generator + four requested validations + quality/arch checks + temp install | `skills.generated.ts`, run artifacts |

### Deferred Scope

- Installer architecture and scaffold/runtime E2E are unchanged/N/A.

### Contributor Path

Add or edit a source skill under `skills/`, register it in `skills/manifest.json`, regenerate with `deno task gen:assets-barrel`, and prove route integrity through `init-agent_test.ts` plus `check:assets-barrel`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | plan | repro | Actual contributor binary reproduced exactly three skills and 164 lines; requested entry path/flag are stale. |
| 2026-08-01 | plan-eval | PASS | Separate OpenHands/Qwen session passed every Plan-Gate box; run 30714594170. |
| 2026-08-01 | S1 | source/content complete | Adapted the three supplied drafts; manifest now names five skills plus `help.md`; dangling specialist routes removed; plugin symptom added to help/build/operate; AGENTS, tests, docs, and freshness task updated. |
| 2026-08-01 | S2 | generated + validated | Regenerated hash `71a86900a53bb52eb6e3ba974426fb66657aa50b433586c522ab55b621487264`; narrowed the route parser after its first run exposed false positives for ordinary “use CLI/help” prose. |

## Gate Results

PLAN-EVAL passed before implementation began.

### Slice 1 review

- Source manifest is the finite route authority: `netscript`, `netscript-operate`,
  `netscript-build`, `aspire`, `deno`.
- Focused grep found no `deno-fresh`, `netscript-deno-toolchain`, or Deno-doc-only handoff in
  source skills.
- Symptom-first occurrences of `netscript plugin doctor` exist in `help.md`, `netscript-build`, and
  `netscript-operate`; the Aspire/Deno drafts retain the required symptom anchors.
- Generated artifact and executable tests intentionally remain S2, after regeneration.

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Type check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 742 files, 7 batches, 0 failed, 0 diagnostics |
| Lint | `deno lint packages/cli` | PASS | Checked 107 files |
| Init tests | `deno test -A packages/cli/src/public/features/agent/init/` | PASS | 4 passed, 0 failed |
| Asset freshness | `deno task check:assets-barrel` | PASS | post-commit generator produced no diff; the task now includes `skills.generated.ts` |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code-quality scan | PASS | `deno task quality:scan` | no findings; 7 pre-existing allowances reported |
| Architecture check | PASS | `deno task arch:check` | exit 0; repository warnings are pre-existing and outside this slice |
| Docs overlay | PASS | source/installed grep + semantic test | enumerations aligned; symptom routes present; no dangling installed skill reference |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fresh Claude install | PASS | temp artifact `/tmp/tmp.nsCKv5AcJh` | five `SKILL.md` files + `help.md`, 863 lines; AGENTS names all routes |

## Handoff Notes

- Inspect the route parser and generated hash first.
- `scaffold.runtime` is N/A by explicit owner instruction and the release-gate matrix: no scaffold,
  plugin scaffold, DB wiring, or Aspire helper generation changed.

### Post-slice reconcile

- PR #1034 remains the sole resolving PR with `Closes #1023`, milestone `0.0.3`, the requested area/
  priority/type labels, and exactly one lifecycle status.
- No new reviewer comments require implementation changes. PLAN-EVAL remains PASS.
- No plan or doctrine drift beyond the already-recorded stale repro entry/flag.
