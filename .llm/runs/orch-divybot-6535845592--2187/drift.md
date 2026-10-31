# Drift

- Environment: RTK absent (same as #2165); use focused raw commands and structured wrappers.
- Instruction reconciliation: owner-specific controls take precedence for Refs opening, readiness, no labels/milestones, prohibited local scaffold runtime and final READY report. Generic dispatcher also requires a final tracking closure line; preserve it at the end of the PR body without changing the Refs opening.
- Privacy: public run artifacts use repo-relative paths and role identities only. Raw logs and evaluator session state remain outside Git.

- Plan review R1: replace raw JSON-tuple keys with SHA-256 tuple identities to avoid oversized KV keys. Add separate adapter/TTL negative controls and separate preserved-behavior controls. This is a pre-implementation design correction within scope.

- S1 test placement: the adapter/runtime/disk-KV suite belongs in the existing package tests/ directory per doctrine cross-cutting guidance. Moving it out of src/runtime avoids increasing that already over-cap source folder. No behavior or public surface changes from this placement correction.

- S2 CI repair: the generated agent-docs carrier was omitted when the triggers Markdown changed. CI quality actually failed agent-docs-prose freshness, not the already documented broad-quality baseline and not a test discovery diagnostic. Native generation outputs are now included in authorized scope, per the user's direct request to fix the red PR. GitHub withholds run-wide failed logs until the run finishes; the completed quality job log was retrieved directly through the job logs API.

- Augment review 4429496686 identified a new hash-await admission race during concurrent source/processor shutdown. Extend S2 to drain source tasks before closing processor admission, with deterministic negative-control coverage. The user explicitly requested all review items addressed; no approval pause is needed. This touches runtime lifecycle wiring, so request the coordinator-owned e2e-cli gate without mutating labels locally.
