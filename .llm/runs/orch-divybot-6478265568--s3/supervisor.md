# S3 phase 1

- Assignment: #2416, part of #2412. Feature-tier leaf, implementation by Codex.
- Baseline: 9a31e879c32a8066c50946a57976f3da34ba43a6; branch `orch/divybot-6478265568`.
- Write surface: component sources/styles/markup and contracts/tests/docs in `packages/fresh-ui/`; dedicated ui:migrate implementation/tests and command registration in `packages/cli/`; scoped browser parity coverage in `tools/fresh-ui-browser/`; this run directory. No registry schema, ui:build/add/apply or lockfile changes.
- Matrix queried with `deno task agentic:matrix --tier feature --json`. Implementation primary sol/xhigh. Owner explicitly overrides both evaluation routes to `claude -p --model claude-opus-5-5 --effort high`, separate read-only sessions, stdin closed, blockers only. Fix once; preserve verdicts.
- Public evidence contains repository-relative paths and no machine/session identifiers.
- Stop at READY; no merge, tag or release. Labels unchanged by owner instruction.
