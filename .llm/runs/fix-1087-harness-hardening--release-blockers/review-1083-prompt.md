use harness

# Opposite-family slice review: #1083 0.0.4 breaking-change release note

## SKILL

- `.agents/skills/netscript-harness` — apply the substantive slice-review and verdict rules.
- `.agents/skills/netscript-release` — verify the note is a valid hand-authored release intro input;
  do not publish or mutate a release.

You are the separate Claude/Fable reviewer for a Codex-authored docs slice. Review only; do not edit
source. Write the compact verdict to:

`.llm/runs/fix-1087-harness-hardening--release-blockers/review-1083.md`

Review the uncommitted diff after `1921a106c`, especially `release-notes-0.0.4-intro.md`.

Acceptance boundaries:

1. The tracked intro is a real intended input to
   `deno task release:publish -- v0.0.4 --notes-file <path>`; do not invoke the publish task.
2. It contains an explicit `Breaking Changes` section naming the exact removed public API
   `ServiceStreamProducerOptions.assertResolvable` and package.
3. It tells consumers to remove the option and states the replacement behavior: producers fail fast
   at startup when no reachable streams URL is configured; no replacement flag is needed.
4. No live docs, package/plugin source, generated surface, root README, or root configuration still
   references the removed option. Historical run/incident artifacts are immutable evidence and are
   not live residue.
5. The prose is concise, unambiguous, and suitable for the 0.0.4 GitHub release intro.

Inspect the release tooling contract and live surfaces directly. Your artifact must include
`Verdict: PASS` or `Verdict: FAIL_FIX`, severity-ordered findings with file/line evidence, explicit
assessment of all five boundaries, and any independently run read-only checks.

Do not spawn sub-agents or workflows. Do not publish a release. Do not modify any file except the
named review artifact.
