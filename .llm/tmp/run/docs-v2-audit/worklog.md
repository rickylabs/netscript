# Worklog

## 2026-06-19

- Read `/home/codex/.codex/docs-w2-audit-brief.md`.
- Confirmed branch state: already on `audit/docs-capability-truth` at `origin/docs/user-site` (`becd99a90b304d6234ad88b7431820ec89ba35c4`).
- Ran `git branch --unset-upstream`; branch had no upstream, matching the requested push discipline.
- Used read-only inspection only for `packages/**`, `plugins/**`, and `docs/site/**`.
- Used `deno doc --json packages/plugin-workers-core/mod.ts` as a surface probe; output was written only to `.llm/tmp/plugin-workers-core-doc.json` scratch.
- Inspected public exports from package/plugin `deno.json` files and root `mod.ts` files.
- Verified maintainer-flagged claims:
  - Triggers webhook path is raw Hono, not oRPC.
  - Streams topic producer/consumer helpers are no-op stubs.
  - Scaffolded worker `createJobTools(ctx).trace` helpers do not emit spans.
  - Framework telemetry helpers themselves are real span wrappers.
- Mapped polyglot task capability across public builder, runtime adapters, worker dispatch, task queue listener, workers oRPC contract, and deploy task copier.
- Mapped `@netscript/fresh` meta-framework subpaths and found the capability miscategorized under "Fresh UI & design".
- Wrote:
  - `capability-truth-matrix.md`
  - `caveats-and-gaps.md`
  - `missing-and-miscategorized.md`
  - `commits.md`

## Validation

No code validation was run because this is a read-only evidence audit and only Markdown artifacts under `.llm/tmp/run/docs-v2-audit/` were added. Git inspection was used to verify the change set before commit.
