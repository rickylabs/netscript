# Research — 5d2-builders PLAN phase

Status: IN PROGRESS — skeleton created, findings appended incrementally.
Run: `.llm/tmp/run/openhands/pr-35/run-27445625660-1/`
Prev trace reused: `.llm/tmp/run/openhands/pr-35/run-27442040668-1/`

## 1. MEASURE-FIRST

TODO: re-run combined `deno doc --lint` for `./builders`; `deno check --unstable-kv`; private-type-ref count; over-cap inventory.

### 1.1 File-size inventory

| File | Size | Cap | Status |
|------|------|-----|--------|
| `builders/mod.ts` | TODO |  |  |
| `builders/define-page/builder.tsx` | TODO |  |  |
| `builders/define-page/types.ts` | TODO |  |  |
| `builders/define-page/navigation.tsx` | TODO |  |  |
| `builders/define-page/runtime.tsx` | TODO |  |  |
| `builders/define-page.test.tsx` | TODO |  |  |

### 1.2 Doc-lint diagnostics

TODO: run `deno doc --lint` over `./builders` combined; parse `private-type-ref` / `missing-jsdoc` counts.

### 1.3 Type-check

TODO: `deno check --unstable-kv` scoped to builders entrypoints.

### 1.4 Private-type-ref inventory

TODO: list files/symbols with leaks and root cause.

## 2. PUBLIC SYMBOL MAP

TODO: map every exported symbol of `./builders` → defining file → internal dependencies.

## 3. ISLAND / HYDRATION SEAM

TODO: identify typed loader→island handoff and where 5d6 (query bridge) will plug in.

## 4. STREAMING TOUCHPOINTS

TODO: locate `createStreamingResponse` / `createIncrementalStreamingResponse` call sites in builder code.

## 5. DSL MARKET BAR

TODO: TanStack Start, Next.js App Router, Remix data APIs — what `definePage` must match or beat.

## 6. REUSE FROM PRIOR TRACE

TODO: summarize what was reused from `run-27442040668-1/summary.md`.

## 7. GAPS & REMAINING WORK

TODO: list what needs deeper design in the follow-up trigger.
