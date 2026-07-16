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
| Remaining package fitness | NOT_RUN | pending implementation | Required before handoff. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Scratch SSR contract | PASS | direct render command | GFM, math, highlight, citation, sanitize verified. |
| Production build/hydration | NOT_RUN | pending checked-in fixture | Required. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated Fresh baseline | FAIL (reproduced) | `.llm/tmp/issue-783-repro` | Owning failure established before fix. |

## Handoff Notes

- Evaluator should inspect sanitize/plugin order, absence of React graph requirements, actual copied
  renderer regression, generated Fresh build/hydration evidence, and the explicit root cause.

