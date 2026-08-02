# Drift Log

## 2026-08-02 — significant: manifest range contract and repo-wide gate missed

- The initial plan relied on an incorrect tree census that said no range forms existed and treated
  only exact manifest import-map pins as supported release identities.
- `.llm/tools/release/cut_test.ts` is authoritative that NetScript manifest import maps support
  caret-ranged specifiers and that the release coordinator must preserve the operator while bumping
  the version. The first implementation silently left this owned surface stale.
- The implementation session compounded the mistake by changing an existing caret residue fixture
  to exact instead of treating the failing assertion as evidence of a missing supported shape.
- The focused dependency-tool suite did not expose the release-cut regression. Omitting the root
  `deno task test` gate allowed the slice to be handed off with a real release-path failure.
- Correction: preserve optional `^`, `~`, `>=`, `<=`, `>`, `<`, and `=` operators in rules 2 and 3;
  restore the original residue fixture; add first- and third-party range assertions in stable and
  canary directions; rerun RED/GREEN, differential proof, focused release/deps tests, and the full
  repository suite before amending the local commit.
