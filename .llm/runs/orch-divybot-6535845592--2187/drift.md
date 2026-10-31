# Drift

- Environment: RTK absent (same as #2165); use focused raw commands and structured wrappers.
- Instruction reconciliation: owner-specific controls take precedence for Refs opening, readiness, no labels/milestones, prohibited local scaffold runtime and final READY report. Generic dispatcher also requires a final tracking closure line; preserve it at the end of the PR body without changing the Refs opening.
- Privacy: public run artifacts use repo-relative paths and role identities only. Raw logs and evaluator session state remain outside Git.

- Plan review R1: replace raw JSON-tuple keys with SHA-256 tuple identities to avoid oversized KV keys. Add separate adapter/TTL negative controls and separate preserved-behavior controls. This is a pre-implementation design correction within scope.

- S1 test placement: the adapter/runtime/disk-KV suite belongs in the existing package tests/ directory per doctrine cross-cutting guidance. Moving it out of src/runtime avoids increasing that already over-cap source folder. No behavior or public surface changes from this placement correction.
