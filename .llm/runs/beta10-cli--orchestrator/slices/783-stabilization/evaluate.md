# IMPL-EVAL: PR #790 — fresh-ui Markdown via Preact JSX runtime (fixes #783)

| Field | Value |
| --- | --- |
| Verdict | **PASS** |
| Evaluator | Claude Fable 5 low (opposite-family, separate session) |
| Generator | Codex GPT-5.6-Sol, run `fix-783-beta10-stabilization--codex` |
| Subject | `/home/codex/repos/b10-783` @ `da00f883` (branch `fix/783-beta10-stabilization`, base `feat/beta10-integration` @ `0daa575b`) |
| Date | 2026-07-16 |

## Rationale

The slice replaces the `react-markdown`/preact-compat boundary with a direct
`unified → remark-parse → gfm/math/citations → remark-rehype → katex/highlight →
rehype-sanitize → rehypeInlineStyles → rehype-react(Preact Fragment/jsx/jsxs)` pipeline,
exactly as locked in plan D1–D6. The security posture is preserved or improved:
`remarkRehype` is invoked with default options (`allowDangerousHtml: false`), so raw HTML
in markdown input is dropped at the mdast→hast boundary (same default as react-markdown),
and `rehype-sanitize` with the extended schema remains unconditional and last among content
transforms. Independently re-run gates all pass. No new suppressions; template and generated
mirror agree.

## Independent Gate Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Renderer + pipeline tests | PASS 16/16 | `deno test --no-lock -A packages/fresh-ui/tests/registry/markdown-{pipeline,renderer}.test.ts` — includes generated Fresh production build/hydration test (62s) |
| Template/generated drift | PASS | `deno task check:assets-barrel` exit 0 in subject worktree — `registry.generated.ts` matches `markdown.tsx.template` |
| XSS assertion | PASS | renderer test feeds `<script>alert(1)</script><img src=x onerror=alert(1)>` through a real generated consumer SSR and asserts `<script` / `onerror` absent from output |
| New suppressions | NONE | grep of full diff: zero new `@ts-ignore` / `deno-lint-ignore` / `ts-expect-error`; quality:scan exit-1 findings are pre-existing plugin debt outside touched roots |
| Generator gates | Verified in worklog | scaffold.runtime 60/0 PASS one-pass with cleanup; scoped check/lint/fmt zero findings; arch:check exit 0; publish dry-run PASS |
| Close-gate | OK | PR body carries `Closes #783`, DoD/acceptance boxes checked with evidence, taxonomy labels + `status:impl-eval` present |

## Numbered Findings

1. **(info, resolved by design)** No `plan-eval.md` exists in the run dir — protocol rule 2 would
   flag implementation-before-Plan-Gate. The generator recorded this explicitly in `drift.md`
   ("Evaluator dispatch remains supervisor-owned") as a written owner override; not self-certified.
   Recorded, not blocking.
2. **(info)** `SanitizeSchema.tagNames`/`attributes` widened to `| null` to accept upstream nullable
   fields; the pipeline test "accepts nullable upstream collections" covers it and
   `extendSanitizeSchema` still never admits `script` or event handlers. No weakening observed.
3. **(minor, per-render cost)** `createMarkdownProcessor(...)` builds a fresh unified processor on
   every render (needed to close over `activeCite`/`onCite`). Correct and avoids shared-state bugs;
   acceptable for streamed chat output, note for future perf work only.
4. **(supervisor note)** PR base is `feat/beta10-integration` (non-default), so the `Closes #783`
   keyword will NOT auto-close on merge — manual issue close required after merge, per repo memory.
5. **(info)** Windows hydration evidence remains open in the PR acceptance list (Linux-only lane);
   PR states this honestly and defers to supervisor/CI. Consistent with plan Non-Scope.
6. **(info)** `quality:scan` exits 1 on pre-existing `plugins/streams/services/src/proxy.ts:180` and
   `plugins/triggers/streams/producer.ts:34`; outside touched roots, predates the slice, not
   deepened — no `FAIL_DEBT` trigger.

## Concept of Done

Approved scope complete (all three slices landed with named proving gates), `MarkdownProps` API
preserved, registry docs/manifest/generated mirror consistent, run artifacts sufficient for resume.
