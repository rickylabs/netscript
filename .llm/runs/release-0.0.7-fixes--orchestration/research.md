# Research — release 0.0.7 fixes topic

## Reconciliation checkpoint

- The required six skills, harness milestone workflow, lane policy, tooling/handoff notes, and the
  approved coordinator artifacts were read completely before dispatch work.
- `git fetch origin main --prune` left live `origin/main` at the immutable dispatch base
  `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- The topic-control worktree is clean on `orchestrator/release-0.0.7-fixes` with no upstream.
- Issues #1243, #1262, #1263, and #1588 are live/open in milestone `0.0.7`.
- No matching leaf branch, remote ref, or pull request existed before creation.
- GitHub authentication is healthy as `rickylabs`; the agentic runtime reports `no_change`; no
  persisted routing fallback is active.

## Frozen contracts

- `legacy-port-pin-sweep` owns only #1243 and the four declared CLI/plugin file surfaces.
- `scaffold-generated-output-correctness` owns #1262, #1263, and #1588 as one connected leaf. It
  must retain a single shared `scaffold.runtime` verdict.
- Both touch publishable `packages/**` or `plugins/**` surfaces, so structured check/test/lint/fmt
  evidence, `quality:gate`, applicable JSR audit/publish-dry-run evidence, and contract-specific
  gates are required.
- Aspire/Docker/scaffold runtime work is serialized behind the coordinator-owned global expensive
  gate lease; no leaf may infer or seize that lease.
