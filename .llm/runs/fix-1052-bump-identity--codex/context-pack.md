# Context Pack

- Objective: constrain coordinated release rewrites/residue checks to NetScript-owned identities.
- Branch/base: `fix/1052-bump-identity` / `948acd898`.
- Locked design: one exported anchored rewrite helper; residue derives from that helper; manifest
  dependency rules preserve optional supported range operators while package-own versions are exact.
- Scope: two dependency-tool TypeScript files plus this run directory.
- Required proof: stable and canary regression, genuine RED/GREEN, real-tree pre/post differential,
  scoped gates, teardown inspection, one local commit, no push.
- Follow-up: CI exposed missing manifest range support and the omitted root-suite gate. The helper,
  fixtures, evidence, and drift record are corrected; all focused gates and the full 2,437-test
  repository suite are green on the exact final tree. Scratch teardown, final review, and the local
  commit amendment are complete. Nothing was pushed.
