# Plan: reproducible shipped agent-docs corpus

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1531-corpus--leaf` |
| Branch | `fix/1531-agent-docs-corpus-gate` |
| Phase | `impl` |
| Target | `docs/site` generated corpus and MCP publish asset |
| Archetype | N/A — repository docs/tooling task, not package architecture |
| Scope overlays | `SCOPE-docs.md` |

## Archetype

No package archetype applies. The only `packages/**` change is the output of the existing publish
asset generator; no framework source or public surface changes.

## Current Doctrine Verdict

N/A for this generated docs/tooling leaf. Package doctrine is not modified or newly described.

## Goal

Rebuild the agent corpus from the current rendered `docs/site` twins, embed it in MCP, and make a
required CI lane detect any future site/corpus drift.

## Scope

- Make the checked-in generator rebuild site-derived corpus entries reproducibly.
- Regenerate the corpus, provenance, and dependent generated publish asset.
- Add a regenerate-then-diff task and call it from the existing CI quality job.
- Apply the existing forbidden-term assertions to the shipped compressed corpus.

## Non-Scope

- No `docs/site` content edits.
- No corpus selection changes (#1260) and no MCP export-surface changes (#1201).
- No package source edits beyond regenerated `.generated.ts` output.
- No CLI/scaffold E2E.

## Hidden Scope

- Check mode must preserve volatile provenance fields so an unchanged source tree reproduces bytes.
- The two `context/*` entries are not owned by `docs/site`; retain them byte-for-byte from the
  existing corpus instead of changing selection.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Extend the existing builder with a rendered-site input mode; do not create a second generator. | One authority remains responsible for the corpus format. |
| D2 | Normal generation records current version/commit/time; check generation preserves those volatile fields while recomputing content sizes/hash. | Enables regenerate-then-`git diff` without weakening direct content evidence. |
| D3 | CI calls a named `check:agent-docs-prose` task in the required quality job. | A task with no workflow caller caused this defect. |
| D4 | `docs:accuracy` decompresses the shipped corpus and runs the same forbidden-term list over every entry. | Independently catches stale vocabulary even if a freshness gate is bypassed. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Corpus membership | safe to defer | Owned by #1260; preserve current non-site entries. |
| MCP serving/export shape | safe to defer | Owned by #1201; this leaf only refreshes existing generated input. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Generator or docs build mutates unrelated files/lock state. | Inspect raw `git status` after every run; never accept `deno.lock` churn. |
| Provenance volatility makes the check always red. | Preserve version/sourceCommit/extractionTimestamp only in `--check` mode. |
| A drift check appears green without testing its fall. | Edit one `docs/site` page, record raw non-zero exit, restore it, and rerun green. |
| Compression differences create noise. | Use the same Web `CompressionStream` implementation and sorted corpus keys. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| N/A | no framework architecture change | Keep tooling focused and avoid package-source edits. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Docs source alignment | yes | direct corpus census plus docs accuracy/links/snippets |
| Generated freshness | yes | asset barrel and new agent-docs drift task |
| Negative control | yes | raw non-zero exit after a temporary `docs/site` edit |
| Scoped static wrappers | yes | check/lint/fmt over `.llm/tools/docs` and touched workflow script roots |
| Repository tests | yes | `deno task test` |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| N/A | none | No doctrine debt created or closed. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | content census | direct gzip/generated greps | `api-clients` = 0 |
| 2 | generated freshness | `deno task check:assets-barrel` | exit 0 |
| 3 | corpus freshness | `deno task check:agent-docs-prose` | exit 0 |
| 4 | negative control | same check after temporary site edit | raw non-zero exit |
| 5 | docs | `docs:snippets`, `docs:links`, `docs:accuracy` | exit 0 each |
| 6 | scoped static | check/lint/fmt wrappers | exit 0 |
| 7 | repository | `deno task test` | exit 0 |

## Drift Watch

- Any surfaced docs defect is logged rather than fixed in `docs/site`.
- Any generator output beyond the exact corpus/provenance and dependent generated assets is removed.
