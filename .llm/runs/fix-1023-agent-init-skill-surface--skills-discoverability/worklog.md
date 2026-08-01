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

## Gate Results

PLAN-EVAL passed before implementation began. Implementation gates remain pending.

### Slice 1 review

- Source manifest is the finite route authority: `netscript`, `netscript-operate`,
  `netscript-build`, `aspire`, `deno`.
- Focused grep found no `deno-fresh`, `netscript-deno-toolchain`, or Deno-doc-only handoff in
  source skills.
- Symptom-first occurrences of `netscript plugin doctor` exist in `help.md`, `netscript-build`, and
  `netscript-operate`; the Aspire/Deno drafts retain the required symptom anchors.
- Generated artifact and executable tests intentionally remain S2, after regeneration.
