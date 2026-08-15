# Drift log — reference-export-drift-gate

## S1

- **Implementation drift:** none. The seven S1 implementation paths match the approved plan.
- **Evidence drift:** none. Intermediate direct-checker reds were preserved and recorded under
  N1/D11; final green followed documentation and policy-order reconciliation, not a widened
  exclusion or narrowed parser.
- **Known adjacent finding:** PLAN-EVAL O1 notes that `schemas/pagination.ts` uses free example
  identifiers beyond its import line. SA-2 authorizes only the import-subpath edit, so the remainder
  stays with #1533's example-compile work and did not trigger a fourteenth-path rescope.

## S2

- **Implementation drift:** none. The three S2 implementation paths match the approved plan; the
  named task, aggregate child argv, and guarded root-cwd Pages step are the only implementation
  edits.
- **Framing drift:** none. S2 is recorded as discoverability over the already-enforced non-draft CI
  chain; no `wired to nothing` or inverse `no workflow runs docs-accuracy` premise returned.
- **Evidence diagnostic:** the structured lint wrapper refused the accuracy tool because the repo
  lint configuration excludes `.llm`; this remains raw exit 2 rather than a false pass. The exact
  file passed a non-authoritative `--no-config` lint diagnostic. A first single-execution audit had
  a shell-quote assertion defect (raw exit 1); its corrected assertion was raw exit 0.
- **Controlled mutation:** one Fresh UI symbol row was changed only in-memory/on-disk for the
  negative proof, backed up under `.llm/tmp`, and restored in `finally`. SHA-256 and byte equality
  matched, the scratch directory was removed, and the path has no diff.
