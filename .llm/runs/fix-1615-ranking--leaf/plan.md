# Plan: deterministic close-score guidance ranking

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `fix-1615-ranking--leaf`                |
| Branch         | `fix/1615-guidance-ranking-determinism` |
| Phase          | `impl`                                  |
| Target         | `packages/mcp` guidance ranking         |
| Archetype      | `2 — Integration`                       |
| Scope overlays | none                                    |

## Archetype

`packages/mcp` is assigned Archetype 2 by the current doctrine. This slice changes the pure ranking
policy inside the domain layer and leaves both filesystem and embedded corpus adapters behind the
existing `DocsCorpusPort` contract.

## Current Doctrine Verdict

**Keep** — “Keep MCP transports behind token-bounded tool contracts.” No public tool contract,
transport, port, adapter, or composition change is planned.

## Axioms in Play

| Axiom | Why it matters                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------ |
| A2    | Deterministic ordering remains simple and explainable at the published `find_guidance` boundary. |
| A6    | The tie-break belongs in the existing non-trivial ranking computation, not a new helper module.  |
| A8    | The focused unit test stays beside the existing guidance ranking behavior.                       |
| A14   | Positive, regenerated-corpus, and deliberately failing negative controls prove the ranking gate. |

## Goal

Make near-equal cross-document guidance scores deterministic across unrelated corpus-statistic
movement while preserving meaningful numeric ordering between sections of the same source page.

## Scope

- Add a measured close-score band to the existing ranking policy.
- Stabilize one route/score band at a time by source document identity, retaining score and section
  identity within the same document.
- Add focused unit coverage for transitive grouping, stable cross-document ordering, and same-page
  score preservation.
- Prove the full eight-case fixture on both the shipped corpus and the fresh PR #1608 corpus.

## Non-Scope

- No `.llm/assets/agent-docs/**`, `.llm/tools/docs/**`, generated publish assets, or `docs/site`
  edits.
- No #1260 corpus-selection or #1410 hybrid-retrieval scope.
- No golden changes and no unrelated fixture tuning.
- No CLI/scaffold E2E.

## Hidden Scope

- The close-score comparator must be transitive; an epsilon comparator passed directly to
  `Array.sort` is invalid. Groups are anchored to the leading score and then sorted
  deterministically.
- Curated route order must remain dominant. Tie stabilization applies only within one route index.
- The fresh sibling corpus must be read without copying its generated asset into this worktree.

## Locked Decisions

| ID | Decision                                                                                                     | Rationale                                                                                                                                                                                   |
| -- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 | Direction 1: deterministic close-score tie-break.                                                            | The fresh absolute gap is `0.3019801981861221`, only ~2.6%, and the order reverses solely through corpus-wide statistics.                                                                   |
| D2 | Use a `0.5` score band anchored at each group's highest score.                                               | It exceeds the full observed cross-corpus swing while remaining far below the `13+` point separation of the stable top result; anchoring avoids non-transitive epsilon comparisons.         |
| D3 | Inside a close band, order source slugs stably; within one slug, retain numeric score then section identity. | Corpus-wide statistics are the unstable cross-document input. Candidate-local distinctions within one page remain meaningful.                                                               |
| D4 | Do not change the golden.                                                                                    | The old corpus is not an oracle, but the measurement shows instability rather than a wide quality preference, and the direct-ownership citation remains explainably relevant.               |
| D5 | Derive confidence from the post-order winner.                                                                | This preserves route-promotion semantics. Close-score ordering can lower the winning score by at most `0.5`, so only a winner within `0.5` of thresholds `8` or `24` can change confidence. |

## Open-Decision Sweep

| Decision                   | Status        | Notes                                                                                        |
| -------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| Exact band value           | resolved now  | `0.5`, measurement-derived and covered by boundary tests.                                    |
| Concept/metadata weighting | safe to defer | Rejected here: no wide scorer preference justifies a semantic weight.                        |
| Fixture mode narrowing     | safe to defer | Rejected here: a deterministic rank-three contract is achievable without weakening coverage. |
| Hybrid retrieval           | safe to defer | Explicitly owned by #1410 and out of scope.                                                  |

## Risk Register

| Risk                                         | Mitigation                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tie logic violates sort transitivity.        | Form explicit leader-anchored groups, then sort each group with total-order keys.              |
| Other locked cases reorder.                  | Run all eight cases on both base and fresh corpora; no fixture edits allowed.                  |
| Same-page section relevance is lost.         | Preserve raw score order inside one source slug.                                               |
| Generated/corpus sibling ownership conflict. | Read PR #1608's blob through `git show`; never write generated assets.                         |
| Gate is falsely green.                       | Required throwaway-commit expectation perturbation must return raw non-zero, then be reverted. |

## Anti-Patterns to Resolve or Avoid

| AP    | Status | Plan                                                                                                   |
| ----- | ------ | ------------------------------------------------------------------------------------------------------ |
| AP-9  | risk   | Avoid a fixture-specific route, concept alias, or weight tuned to the named anchors.                   |
| AP-18 | risk   | Assert ordering semantics and boundary behavior, not a generated corpus snapshot in new unit coverage. |

## Fitness Gates

| Gate                                 | Required  | Expected evidence                                    |
| ------------------------------------ | --------- | ---------------------------------------------------- |
| F-1..F-19 applicable Archetype-2 set | yes       | `deno task quality:gate` plus scoped source wrappers |
| F-5/F-6/F-7 public surface           | unchanged | full-export doc lint; no public declaration changes  |
| F-10 test shape                      | yes       | focused unit test remains below limit                |

## Arch-Debt Implications

| Entry             | Action | Notes                                                          |
| ----------------- | ------ | -------------------------------------------------------------- |
| `MCP-A6-V2-SHAPE` | none   | Pre-existing package-shape debt is unrelated and not deepened. |

## Validation Plan

| Order | Gate                 | Command or check                                                      | Expected result                                       |
| ----- | -------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| 1     | focused ranking      | package-scoped ranking/guidance tests                                 | exit 0                                                |
| 2     | fresh-corpus fixture | scratch loader over PR #1608 generated blob                           | all eight cases pass twice                            |
| 3     | guidance suite       | `rtk proxy deno task test --filter guidance`                          | exit 0                                                |
| 4     | negative control     | perturb one expected anchor in throwaway commit and run guidance test | raw non-zero exit; revert commit                      |
| 5     | repo tests           | `rtk proxy deno task test`                                            | exit 0 or only the documented unchanged #1589 failure |
| 6     | scoped static        | check/lint/fmt wrappers for `packages/mcp`                            | exit 0 each                                           |
| 7     | package docs         | `deno task doc:lint --root packages/mcp --pretty`                     | exit 0                                                |
| 8     | code quality         | `rtk proxy deno task quality:gate`                                    | exit 0                                                |

## Deferred Scope

- Corpus membership/presence (#1260) and hybrid retrieval (#1410).
- Any docs content correction discovered by ranking evidence; record in `drift.md` and file
  separately.

## Drift Watch

- Any fresh-corpus order or score that differs from the live issue's abbreviated reproduction.
- Any other guidance fixture movement under the close-score policy.
- Any lockfile, generated asset, or docs-site change.
