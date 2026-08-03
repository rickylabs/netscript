# Research — fix-close-gate-verdict-provenance--verdict-honesty

## Re-baseline

- Carried-in source: issue bodies #1171 and #1105 plus the user-provided slice contract.
- Re-derived against `origin/main` @ `fb75cf6fc5ad02130ada0ac42e6f44035ac03a9b` on 2026-08-03.
- Epic sequencing was confirmed from the user contract: S1/S2/S4 have landed and this S3/shared-
  surface cluster is next.
- The worktree is clean and already on `fix/close-gate-verdict-provenance`.

## Issue-body findings

### #1171

- The 0.0.4 incident was a stale read: an in-flight run evaluated the issue before its body edit and
  left a verdict that could not identify the evaluated state.
- Required additive provenance is `headSha`, `evaluatedAt`, and one issue snapshot per closing issue
  containing `number`, `updatedAt`, and `bodySha256`.
- Acceptance explicitly requires a negative test comparing a pre-edit verdict to post-edit issue
  state and regression proof that existing pass/fail behavior does not change.

### #1105

- PR #1088 merged with an unticked planning/DoD body even though implementation and checks had
  landed, making the durable human-readable record contradict the merge.
- The issue offers enforcement or a non-authoritative-body convention. The owner prompt locks the
  orchestrator recommendation to **ENFORCE** unless the implementation surface proves it unsound.
- Existing `netscript-pr` law already says every unchecked PR Definition-of-Done item blocks
  `status:ready-merge`; the shipped PR template currently calls the authoritative section merely
  `## Checklist`, so convention and template are inconsistent.

## Tree findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `Report` has no evaluation or snapshot identity. | `.llm/tools/validation/check-close-gate.ts:40` |
| 2 | PR API shape omits `head.sha`; issue API shape omits `updated_at`. | `.llm/tools/validation/check-close-gate.ts:9-18` |
| 3 | The gate only derives closing issues and scans issue bodies. It does not inspect unchecked PR-body DoD boxes. | `.llm/tools/validation/check-close-gate.ts:127-168` |
| 4 | Pretty output prints verdict, override, closing issues, notes, and findings only. | `.llm/tools/validation/check-close-gate.ts:322-347` |
| 5 | Tests currently cover only GitHub retry/fallback behavior (3 passing baseline tests). | `deno test .llm/tools/validation/check-close-gate_test.ts` → 3 passed, 0 failed |
| 6 | The shipped PR template has progress `## Slices` plus an authoritative-looking `## Checklist`; it has no `## Definition of Done` heading. | `.github/pull_request_template.md` |
| 7 | CI invokes the checker with `--pretty`; an annotation-text-only change is sufficient to surface provenance without restructuring CI. | `.github/workflows/ci.yml:87-98` |
| 8 | The checker is repository tooling under `.llm/tools`; no `packages/**` or `plugins/**` framework law is involved. | scoped path inspection |

## Design implications

- Preserve `findings` and override behavior for issue acceptance; add PR-body DoD findings as an
  additional fail input.
- Treat only checkboxes under PR headings containing `Definition of Done` or `Acceptance` as
  authoritative. This avoids making ordinary planning, rollout, or explanatory checklists
  accidental merge blockers while enforcing the convention named in `netscript-pr`.
- Rename the shipped template's authoritative `## Checklist` section to `## Definition of Done` and
  document the same narrow rule in `netscript-pr`.
- Hash the exact normalized API body value (`body ?? ''`) with Web Crypto SHA-256. Preserve
  `updated_at` as GitHub returned it.
- Export a pure snapshot comparison helper so staleness can be proven without timing or network
  races: a stored evaluated snapshot is stale when either `updatedAt` or `bodySha256` differs from
  the current snapshot for the same issue number.

## jsr-audit surface scan

- N/A: this is repo tooling and PR convention/template work; no package/plugin exports, JSDoc, or
  publish surface changes.

## Open questions

- None that force rework. Whether issue-only CLI mode can supply a PR head is resolved in the plan:
  it records `GITHUB_SHA` when present and otherwise `null`, while PR mode always records the live
  PR `head.sha`.
