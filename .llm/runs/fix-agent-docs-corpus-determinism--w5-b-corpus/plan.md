# Plan: deterministic agent-docs corpus freshness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-docs-corpus-determinism--w5-b-corpus` |
| Branch | `fix/agent-docs-corpus-determinism` |
| Phase | `plan` |
| Target | repository tooling / generated agent-docs asset |
| Archetype | N/A — no package/plugin architecture is being introduced |
| Scope overlays | docs |

## Archetype

N/A. This is a focused generated-artifact freshness gate and transport-integrity adjustment. The
docs overlay applies because the owned asset is the agent-facing docs corpus and evidence/run docs
are deliverables.

## Current Doctrine Verdict

N/A for this repository-tooling fix; no framework-layer architecture claim changes.

## Goal

Make agent-docs freshness depend on the SHA-256 identity of the canonical uncompressed corpus,
preserve existing valid gzip bytes for unchanged content, and prove both transport variance
tolerance and real input-staleness detection.

## Scope

- Refactor the corpus builder/checker so check mode is semantic and non-mutating.
- Define provenance `sha256` as the canonical uncompressed corpus hash and align consumers.
- Preserve checked-in gzip bytes when the canonical content is unchanged.
- Add regression tests covering identical regeneration, alternate gzip encoding, and content drift.
- Regenerate the owned asset through `gen:agent-docs-prose`; record full evidence.

## Non-Scope

- No publication, release cut, tag, merge, or edit to `release/cut-0.0.6` / PR #1624.
- No compressor/runtime pinning and no hand-edited generated asset.
- No package/plugin architecture or unrelated docs-site content change.

## Hidden Scope

- The embedded CLI consumer and release helper/tests must agree with the provenance hash semantic.
- The root task must stop treating a raw `.gz` diff as the freshness verdict.
- Lockfiles must remain untouched.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Hash the canonical uncompressed JSON bytes for corpus identity. | Compression is transport and may vary across runtimes. |
| D2 | In generation mode, reuse existing valid gzip bytes when their decompressed bytes equal the canonical corpus. | Keeps coordinated release regeneration stable and avoids spurious non-version bytes. |
| D3 | In check mode, compare canonical content identity without rewriting outputs or requiring compressed-byte equality. | Makes the gate deterministic while still failing on real input drift. |
| D4 | Keep runtime integrity by verifying the decompressed canonical bytes against provenance. | A transport-byte hash is no longer the corpus identity contract. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Provenance schema bump versus compatible semantic migration | safe to resolve in implementation | Prefer the smallest coherent migration supported by all in-repo readers/tests. |
| Compressor replacement | safe to defer | Byte preservation removes it from unchanged-content freshness and release-cut stability. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A semantic checker accidentally always passes. | Mutate one rendered input fixture and assert a failing freshness verdict. |
| Alternate gzip bytes break runtime integrity. | Verify integrity after decompression and test a content-identical alternate encoding. |
| Normal generation rewrites unchanged transport. | Assert consecutive generation preserves exact gzip bytes and provenance. |
| Release inheritance changes behavior. | Run focused `github-release` and publish-asset tests plus the required root gates. |
| Generated or lockfile drift leaks into the PR. | Generate through the official task; explicit-path staging; assert both lockfile stats empty. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| N/A | tooling-only | Avoid duplicating freshness logic across task shell and builder. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| docs source alignment | yes | tests and generated provenance agree with builder/consumer semantics |
| docs drift log | yes | run `drift.md` records any material deviation |
| package archetype fitness | no | N/A — no package/plugin architecture change |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No deferred architecture violation is planned. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | discriminating pre-fix | focused builder regression tests before implementation | failure against baseline with the failing assertion named |
| 2 | focused | focused docs builder, publish-assets, CLI consumer, and release helper tests | pass |
| 3 | required static | `rtk proxy deno task check`, `test`, `lint`, `fmt:check` | exit 0 |
| 4 | freshness stability | `deno task check:agent-docs-prose` twice consecutively | both exit 0 with unchanged asset hashes |
| 5 | real staleness | focused fixture changes one input and runs semantic check | non-zero/stale verdict |
| 6 | hygiene | raw git status/diff and lockfile stat assertions | only owned files; lockfiles empty |

## Deferred Scope

- Cross-runtime compressor conformance is unnecessary once transport bytes no longer define
  freshness and unchanged canonical content reuses the checked-in artifact.

## Drift Watch

- Any need to change docs-site source content, public package APIs, lockfiles, or the release branch
  is significant and requires rescoping rather than silent expansion.
