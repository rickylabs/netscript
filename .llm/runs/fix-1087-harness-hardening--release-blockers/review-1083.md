# Slice Review — #1083 0.0.4 breaking-change release note

- **Reviewer:** Claude (Fable 5), opposite-family session; review-only, no source edits.
- **Scope reviewed:** uncommitted diff after `1921a106c` — new `release-notes-0.0.4-intro.md`, one
  worklog row, and the review prompt artifact.
- **Date:** 2026-08-03

## Verdict: PASS

## Boundary assessment

1. **Valid `release:publish` notes-file input — PASS.** `deno task release:publish` →
   `.llm/tools/release/github-release.ts` (deno.json:107). The tool requires `--notes-file <path>`
   or `--message` and refuses without one (`github-release.ts:325-364`); the file content becomes
   the `intro` and is composed as the first body section ahead of the generated `## What's Changed`
   and `## Closed Issues` sections (`github-release.ts:90-99`). The intro's `##` heading level
   matches the generated sections (`github-release.ts:86`), so the composed body renders
   consistently. Publish task was **not** invoked.
2. **Explicit Breaking Changes section naming API + package — PASS.**
   `release-notes-0.0.4-intro.md:1-4` opens with `## Breaking Changes` and names
   `ServiceStreamProducerOptions.assertResolvable` on `@netscript/plugin-streams-core` exactly.
3. **Migration instruction + replacement behavior — PASS.** Lines 4-6 instruct consumers to remove
   the option, state "there is no replacement flag", and describe the fail-fast-at-startup
   replacement behavior. This matches the implementation: `DurableStreamProducer` construction calls
   `resolveRequiredStreamUrl` and throws when the streams URL does not resolve
   (`packages/plugin-streams-core/src/application/create-durable-stream.ts:62,269-280`), and
   `ServiceStreamProducerOptions` is now a bare alias of `DurableStreamProducerOptions` with no
   `assertResolvable` member
   (`packages/plugin-streams-core/src/application/create-service-stream-producer.ts:14-15`).
4. **No live residue — PASS.** `grep -rn assertResolvable` across the repo (excluding
   `.git`/`node_modules`): every match is under `.llm/runs/` — historical run logs
   (`beta5-impl--supervisor`), the originating run's immutable drift/worklog evidence
   (`fix-1067-plugin-wiring--codex`), and this run's own artifacts. Zero matches in `packages/`,
   `plugins/`, `docs/`, root README, root configuration, or generated surfaces. Corroborates
   research.md finding #9 and plan-eval.md.
5. **Prose quality — PASS.** Four lines, one bullet, unambiguous: names the package, the removed
   member, the consumer action, and the enforced-by-construction rationale. Suitable as the 0.0.4
   intro input.

## Findings (severity-ordered)

- **LOW — "reachable" slightly overstates the failure trigger.** `release-notes-0.0.4-intro.md:5`
  says producers fail fast "when no reachable streams URL is configured". The actual
  construction-time check is configuration/discovery _resolution_ (`DURABLE_STREAMS_URL` /
  `services__streams__http__0`), not a network reachability probe
  (`create-durable-stream.ts:269-280`; docs say "throws at construction" —
  `docs/site/reference/streams/index.md:143`, `docs/site/durable-workflows/streams.md:221`).
  Optional wording tweak: "when no streams URL can be resolved". Consumer action is identical either
  way; not blocking.
- **LOW — intro is breaking-changes-only.** The file carries no one-line summary of what 0.0.4 ships
  before the Breaking Changes section. Acceptable as this slice's deliverable (the #1083 scope is
  the breaking-change note, and the generated What's-Changed list follows), but the supervisor may
  want to prepend a one-sentence release summary before the actual `release:publish` invocation.

## Independent read-only checks run

- `git status` / `git diff 1921a106c --stat` — confirmed the diff is docs/run-artifact only.
- `grep -rn assertResolvable` (full repo, excluding `.git`/`node_modules`) — residue sweep.
- Read `github-release.ts` intro/notes-file contract and body composition.
- Read `create-service-stream-producer.ts` (full) and `create-durable-stream.ts` constructor +
  `resolveRequiredStreamUrl`.
- Grepped `docs/site/reference/streams/index.md` and `docs/site/durable-workflows/streams.md` for
  the fail-fast contract — both state the throws-at-construction behavior and the install +
  `netscript service generate` remedy; neither references the removed option.

No sub-agents or workflows were spawned; no release was published; no file other than this artifact
was modified.

## Remediation verification (2026-08-03)

- **Scope:** re-review of the wording remediation only — `release-notes-0.0.4-intro.md:5-6` now
  reads "fail fast at startup when no streams URL can be resolved", adopting this review's suggested
  phrasing verbatim in place of "when no reachable streams URL is configured".
- **Verified against code:** the construction-time check is pure configuration/discovery resolution
  with no network probe. `DurableStreamProducer`'s constructor calls `resolveRequiredStreamUrl` →
  `buildStreamUrl` → `getStreamsUrl` (`create-durable-stream.ts:62,269-280`;
  `stream-url-resolver.ts:100-133,153-157`), which resolves `DURABLE_STREAMS_URL`, then Aspire
  discovery (`services__streams__http__0` / `VITE_services__streams__http__0`), and throws when none
  resolves. "Can be resolved" describes this exactly; the LOW "reachable" finding is **resolved**.
- **Out of scope:** the one-line `claude-print.ts` timer typing change responds to hosted CI, is not
  part of #1083, and was not reviewed here.

## Verdict after remediation: PASS (unchanged)
