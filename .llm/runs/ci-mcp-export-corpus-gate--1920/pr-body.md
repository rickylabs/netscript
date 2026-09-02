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
- [ ] S3 Integrate current main, regenerate the collision-prone corpus, and revalidate the final identity

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
- Final integrated-main repeat — pending S3 after detected corpus/classifier collision
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
- [ ] The implementation evidence is committed and the branch is clean for supervisor review.
