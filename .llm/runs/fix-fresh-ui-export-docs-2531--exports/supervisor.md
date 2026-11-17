# Supervisor — Fresh UI export documentation

- Issue: #2531, independent remaining leaf of tracker #2412 / #2416.
- Branch: `fix/fresh-ui-export-docs-2531`; repository root `.`.
- Baseline: `e7906c80e8177bcf2544b3ce3bff3481f4f6d9ff` (merged #2592).
- Implementation: Codex, feature tier, matrix `sol` at `xhigh`.
- Independent implementation evaluation: matrix `muse_spark_1_3` at `xhigh`, then declared
  fallback `opus_5` at `xhigh` if unavailable; separate session and vendor family throughout.
- Allowed writes: Fresh UI public export documentation/type declarations under
  `packages/fresh-ui/`; package export/doc validation tooling and tests under `.llm/tools/`;
  related package/contributor documentation; canonical generated carriers only through their
  owning tasks; this run directory. Ignored diagnostic output lives under `.llm/tmp/2531/`.
- Preserve public runtime APIs, schema, `contracts.json`, native callbacks, dependency versions,
  lockfiles and other workers' PR surfaces. No component/style redesign or native OS claims.
- Delivery: early draft PR, independent review, appropriate source/package/runtime gates, then
  ready for review under the latest owner instruction. No rebase, force push or direct merge.
- Prior #2591 assignment and final-report handoff remain excluded and belong to their original run.
