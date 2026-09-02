## Summary

Wire the existing MCP export-corpus freshness gate into CI's `quality` job and refresh the stale
generated corpus. The gate uses the existing catalog/receipt runner and has been preconditioned on
byte-identical warm-cache and pristine-cache generation.

## Scope

- Archetype / area: repository CI tooling; generated `packages/mcp` Archetype-2 infrastructure asset
- Closes #1920

## Slices

- [x] S1 Bootstrap the harness plan and deterministic-generation evidence — `1ad32bc02`
- [x] S2 Add the CI invocation and complete dispatched-base trigger/teeth validation — implementation commit (see live commit list)
- [x] S3 Integrate current main, regenerate the collision-prone corpus, and revalidate the final identity — `92ae7df426` + final evidence commit
- [x] S4 Converge with release main while preserving the evaluated CI blob — `8a8c6a073` + convergence evidence commit

## Validation

- Pinned-base `deno task check:mcp-export-corpus` — expected `REAL_EXIT=1`
- Two warm generations and one pristine-`DENO_DIR` generation — all `REAL_EXIT=0`, byte-identical
  file SHA-256 `906827e588700236fb663fa423a527cbf73f0ed150e51f22b471d73baac9956f`,
  payload SHA-256 `749a692aa86a9d978a187865e4a28fd4b7bf0c3b4b22435b2bdb9b3f50253f73`,
  272 subpaths, 7,803 symbols
- Parsed YAML assertion — `REAL_EXIT=0`
- Nine-case classifier reachability assertion — `REAL_EXIT=0`
- Throwaway-worktree stale RED — `REAL_EXIT=1`; expected diagnostic matched
- Live-tree fresh GREEN and exact catalog runner — each `REAL_EXIT=0`
- Structured `.llm/tools` check — `REAL_EXIT=0`; 342 files, 3 batches, 0 findings
- Integrated main SHA `37452f11f5045f0f5a98e07d802bcc2a2e94333b` by merge (no rebase)
- Final warm repeat and new pristine-`DENO_DIR` generation — each `REAL_EXIT=0`, byte-identical
  file SHA-256 `21cfdee7c2f48ab48358dd0fbe0ab18749aac12ff2c00a9c6aafa748e6e38c9d`,
  payload SHA-256 `81d49c6cc3f8cf6ea8bee59330ec562998ce6def0ea137d06287bd21376214df`,
  273 subpaths, 7,809 symbols
- Throwaway-worktree current-main stale RED — `REAL_EXIT=1`; expected diagnostic matched
- Final live-tree fresh GREEN and catalog runner — each `REAL_EXIT=0`
- Final parsed YAML, nine-case classifier reachability, structured `.llm/tools` check, and lock
  hygiene assertions — each `REAL_EXIT=0`
- Convergence main `4720596fcd0a4c00d72616bec9739be8796718fe`; sole generated conflict
  cleared and regenerated rather than line-merged
- Two detached-worktree pristine-cache regenerations — each `REAL_EXIT=0`, byte-identical to the
  committed file SHA `d1a5d3fb88fb49a5b4e9303d4350159a7f59945a77fdeebe1e4aaf0243fc70f4`,
  payload SHA `0ce5d3066d740f2d1170d0eb0ca98022d0d32d22ba8afd37b93f58e383a04758`,
  273 subpaths, 7,815 symbols
- `ci.yml` carry proof — `8c028d820` and convergence integration head both have blob hash
  `b36057ab6adc68be5bf760637ca2a7998e65e040`; byte-diff `REAL_EXIT=0`
- Convergence freshness, structured `.llm/tools` check, and parsed-YAML read-back — each
  `REAL_EXIT=0`
- `deno task e2e:cli` — intentionally not run; explicitly excluded by #1920

## Harness

- Run dir: `.llm/runs/ci-mcp-export-corpus-gate--1920/`
- Phase: `impl` — see phase comments below.
- Do not merge until mandatory supervisor slice review and separate-session IMPL-EVAL are complete.

## Drift / Debt

- Minor environment drift: the documented `rtk` binary is unavailable, so focused raw reads were
  used. No architecture debt is created or deepened.

## Definition of Done

- [x] Generator output is byte-identical across repeated warm-cache and pristine-cache runs.
- [x] The stale generated MCP corpus is refreshed without dependency or lockfile changes.
- [x] The existing `mcp-export-corpus` gate runs in `quality` with the required ID and receipt path.
- [x] Every input class that can stale the corpus selects the gate's CI path.
- [x] A stale corpus fails and the fresh corpus passes with captured real exits.
- [x] The requested structured tooling check and parsed-YAML assertion pass.
- [x] The implementation evidence is committed and the branch is clean for supervisor review.
