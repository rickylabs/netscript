# Research — fix-783-beta10-stabilization--codex

## Re-baseline

- Authoritative source: GitHub issue #783, fetched in full through the GitHub REST API with
  `resolveGithubToken()`; the issue has zero comments.
- Re-derived against the requested integration baseline `origin/feat/beta10-integration` @
  `0daa575b` on 2026-07-16.
- The issue is open, current, milestone `0.0.1-beta.10`, and not already fixed.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The copied Markdown component directly imports `react-markdown@^9`; the registry manifest installs it into every consumer. | `registry/components/ui/markdown.tsx.template`; `registry.manifest.ts` markdown entry |
| 2 | Existing tests exercise only `markdown-pipeline.ts`; they never type-check or render the copied component. | `tests/registry/markdown-pipeline.test.ts` |
| 3 | A real generated Fresh consumer fails `deno check --unstable-kv components/ui/markdown.tsx` with three renderer-layer errors: sanitize-schema nullability, inferred rehype plugin tuple incompatibility, and custom `citation-chip` rejection by the React-oriented component type. | `.llm/tmp/issue-783-repro/apps/dashboard` baseline run, exit 1 |
| 4 | The current consumer graph initializes `react-markdown@9.1.0` and React 19 even though the app is Preact-native. | Baseline generated-consumer check output and copied `deno.json` |
| 5 | A scratch direct pipeline using `unified` + `remark-parse` + `remark-rehype` + `rehype-react` configured with `preact/jsx-runtime` type-checks and server-renders GFM, KaTeX, highlighting, citations, and strips unsafe HTML/event handlers. | Scratch `deno check` and `deno eval --config deno.json` in the reproduction app, exit 0 |
| 6 | `rehypeInlineStyles` remains required: the successful direct renderer preserves KaTeX strut/vlist style objects after sanitization. | Scratch render output includes KaTeX inline layout styles |
| 7 | Removing the wrapper makes `unified` a direct import; it must be declared explicitly rather than relied on as a former transitive dependency. | Scratch check initially failed on an undeclared `unified` import, then passed after adding `npm:unified@^11` |

## Root cause

The registry owns a Preact-native rendering pipeline but delegates its final compile/render step to
the React-oriented `react-markdown` wrapper. That unnecessary wrapper introduces React/compat graph
cost and constrains plugin/component types around React's JSX surface. Because tests stop at the
dependency-free transforms and never compile the copied component in a generated Fresh app, the
wrapper boundary's type failures and dependency leakage were not caught.

## jsr-audit surface scan

- Surface scanned with `deno doc packages/fresh-ui/mod.ts` and `packages/fresh-ui/deno.json`.
- The Markdown item is copy-source registry content and does not add a new package export.
- Planned risk: generated source and manifest/docs can drift; regeneration plus a consumer fixture
  must prove the copied surface. Existing unrelated `interactive` private-type-ref debt is not
  deepened or addressed by this slice.
- No slow-type or new published-export risk is introduced by the plan.

## Open questions

- None that would force rework. The direct dependency set, processor order, inline-style adapter,
  regression layer, and validation commands are locked in `plan.md`.

