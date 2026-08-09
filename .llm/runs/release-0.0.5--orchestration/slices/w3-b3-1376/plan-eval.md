# PLAN-EVAL: #1376 cycle 1

## Current verdict

`PASS` — cycle 2, separate Claude · Fable 5 session. Implementation authorized.

Cycle 1 returned `FAIL_PLAN`; its findings and repair disposition remain below as provenance.

## Findings

### F1 — blocking: claimed equality gate does not exist

`plan.md` locked publish-assets generation as the release-equality authority, and `research.md`
claimed it proved CLI/MCP equality. Inspection showed `.llm/tools/generate-publish-assets.ts` reads
`packages/mcp/deno.json` and `packages/cli/deno.json` independently and compares nothing. Repo-wide
search found no product or tooling assertion that `CLI_PACKAGE_VERSION === MCP_PACKAGE_VERSION`.

The actual current equality mechanism is the workspace-wide release bump in
`.llm/tools/deps/bump-version.ts` plus residue/readiness checks. Target contract 3 permits a real
equality assertion or an explicitly decoupled stated policy. The plan had to select one, identify
the owning slice and exact files, and avoid publishing a false claim in the MCP README.

### F2 — minor: wrong slice directory

Artifacts landed in `slices/w3-b-1376/`; the brief assigned `slices/w3-b3-1376/`. The drift log also
misreported the assigned directory as absent. Consolidate on the canonical path.

### F3 — minor: distinguish RED strength

The mismatched-version host identity RED can initially fail only at compile time because the
planned identity input and result fields do not exist. The receipt RED is behavioral on the
baseline because `execute_command` is unwrapped and `record_drift` refuses. Evidence must label
each class rather than present them as equivalent; standalone fallback is characterization.

### F4 — minor: choose denial receipt behavior

The plan said a denial “may” write a failure receipt. Both branches fail closed, but the plan must
choose one before implementation.

## Checks that passed cycle 1

- #1375 separability is respected; no docs-root, host-config, environment, or corpus work.
- The planned `run-agent-mcp.ts` edit is restricted to CLI version and executor injection.
- Identity is executor-owned and shared by both command tools; the plan replaces `"current"` with
  `CLI_PACKAGE_VERSION`.
- Standalone execution is visible rather than accidental.
- Mutating-verb safety is stated and checkable without changing the allow/deny set.
- All ten live acceptance rows are quoted verbatim and mapped to slices.
- The full gate set is named, including token-request-only serialized `scaffold.runtime`.
- Five of six load-bearing research claims verified against the tree.

## Repair disposition

- F1: explicit decoupling selected; exact S2/S4 files named in `plan.md`.
- F2: repaired by directory consolidation.
- F3: RED classes and baseline characterization distinguished in research, plan, and worklog.
- F4: denial always overwrites the resource receipt with `exitStatus: 1`.

## Cycle 2 verification

- Re-opened `bump-version.ts`, `publish-readiness.ts`, and `auditLockstepAndResidue`; confirmed the
  replacement attribution rather than accepting it from prose.
- Verified all four cycle-1 repairs and found no new findings.
- Binding for IMPL-EVAL: report the compile-time identity RED and behavioral execute→drift RED with
  separate raw exits; report standalone fallback as characterization, not RED.
- Expected intermediate condition: the committed S1 identity test leaves branch type-check red
  until S2 introduces the contract. The S1 PR comment must identify that as intentional.
