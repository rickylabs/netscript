# Worklog: fresh-ui Markdown direct rendering

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-783-beta10-stabilization--codex` |
| Branch | `fix/783-beta10-stabilization` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `Markdown(props: MarkdownProps): VNode` remains the copied component entry point.
- `MarkdownProps` remains unchanged: `children`, `streaming`, `onCite`, `activeCite`, `class`.
- No new `@netscript/fresh-ui` package export or subpath.

### Domain Vocabulary

- `MarkdownProcessorOptions` — per-render citation state/callback captured by the compiler mapping.
- `CitationElementProps` — sanitized custom-element properties emitted by `remarkCitations`.
- `SanitizeSchema` — structural upstream schema that accepts nullable optional collections.

### Ports

- None. The processor is pure and the doctrine forbids inventing an integration seam for one
  concrete rendering stack.

### Constants

- `SANITIZE_SCHEMA` — immutable extended schema built once.
- No plugin arrays: ordered `.use()` calls keep pipeline order visible and correctly typed.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Harness bootstrap and draft PR | artifact/scope review | run directory |
| 2 | Direct renderer + owning registry docs/tests | focused renderer tests/check + wrappers | fresh-ui registry/manifest/generated/tests + run artifacts |
| 3 | Generated Fresh build/hydration evidence | build/browser + package/architecture/full scaffold gates | focused fixture/E2E if needed + run artifacts |

### Deferred Scope

- Broader `fresh-ui` doc-lint private-type debt — unrelated existing package debt.
- Visual restyling — rendering semantics and existing CSS stay unchanged.
- Windows-local execution — fixture is checked in OS-neutral form; this lane records Linux evidence.

### Contributor Path

Edit `registry/components/ui/markdown.tsx.template` for renderer composition,
`markdown-pipeline.ts` for pure transforms/security policy, and the markdown entry in
`registry.manifest.ts` for copied dependencies. Run focused renderer/consumer tests, regenerate
`registry.generated.ts`, then run the scoped package and generated Fresh browser gates.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-16T20:30Z | 1 | issue/reproduction | GitHub API issue read complete; real generated consumer reproduced three type errors and React graph leakage. |
| 2026-07-16T20:42Z | 1 | research spike | Direct Preact scratch processor check/render passed; inline-style adapter and explicit `unified` dependency locked. |
| 2026-07-16T20:45Z | 1 | design | Doctrine Archetype 4 + frontend plan and Design checkpoint recorded before source implementation. |
| 2026-07-16T21:00Z | 2 | implementation | Replaced the React wrapper with an ordered unified/rehype-react processor using the Preact JSX runtime; regenerated registry assets and added failing-layer coverage. |
| 2026-07-16T21:06Z | 3 | browser proof | Minimal generated Fresh production build passed; citation interaction hydrated from `0` to `1` with zero browser console messages. |
| 2026-07-16T21:12Z | 2/3 | scoped gates | Check/lint/fmt, focused tests, full package tests, architecture, doc-lint, and publish dry-run completed. Repository-wide quality scan exposed two unrelated existing plugin findings. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Fix registry owner, not CLI test behavior | The generated file fails because the source template owns the wrapper/types/dependencies. | issue #783 + reproduction |
| Keep processor pure and direct | Wrap upstream, do not reinvent or create a port. | doctrine A6/A7/A9 |
| Keep post-sanitize style adapter | Direct scratch render preserves KaTeX layout through it. | reproduction output |
| Do not launch evaluators | Explicit owner constraint; supervisor owns evaluation. | user prompt |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue shorthand omitted direct `unified` dependency | minor | yes |
| Current copied item also fails type-check, beyond reported bundle/compat cost | significant | yes |
| Tier-D runtime has thread id but zero daemon-managed sessions | significant | yes |
| Full local-source scaffold dev server has an unrelated dependency cycle | minor | yes |
| Repository quality scan fails on two untouched plugin suppressions/casts | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline copied renderer | `deno check --unstable-kv components/ui/markdown.tsx` in scratch generated app | FAIL (expected reproduction) | Three renderer-layer errors. |
| Scratch direct renderer | same check after research-only replacement | PASS | No source files changed yet. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype/doctrine selection | PASS | doctrine 06/10 + Archetype 4 profile | `fresh-ui` is Keep/Archetype 4. |
| Scoped check/lint/fmt wrappers | PASS | 130 TS/TSX files; zero findings | Required touched-root gates. |
| `deno task arch:check` | PASS | exit 0 | Existing warnings only. |
| `deno task quality:scan` | FAIL (pre-existing) | `plugins/streams/services/src/proxy.ts:180`; `plugins/triggers/streams/producer.ts:34` | Scanner does not inspect touched fresh-ui root; no new suppressions/casts added. |
| Package tests | PASS | 137 passed, 0 failed | Includes renderer and generated production-build regressions. |
| Doc-lint | PASS command / existing debt reported | 123 existing `interactive.ts` findings | No public export changed. |
| Publish dry-run | PASS | `@netscript/fresh-ui@0.0.1-beta.9` simulated | No publish performed. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Scratch SSR contract | PASS | direct render command | GFM, math, highlight, citation, sanitize verified. |
| Generated production build | PASS | focused regression + minimal Fresh fixture | Client and SSR production bundles emitted. |
| Browser hydration | PASS | Playwright named session `issue783` | Citation state `0 → 1`; zero console errors/warnings. |
| Full `scaffold.runtime` | NOT_RUN | pending final gate | Required because copied registry output changed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated Fresh baseline | FAIL (reproduced) | `.llm/tmp/issue-783-repro` | Owning failure established before fix. |
| Copied renderer after fix | PASS | focused test invokes actual `ui:add markdown`, check, and SSR assertions | No React/ReactDOM/react-markdown dependencies. |

## Handoff Notes

- Evaluator should inspect sanitize/plugin order, absence of React graph requirements, actual copied
  renderer regression, generated Fresh build/hydration evidence, and the explicit root cause.
