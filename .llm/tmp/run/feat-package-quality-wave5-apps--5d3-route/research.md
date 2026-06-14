# 5d3-route research — fresh route manifest + contract runtime

Status: PLAN-phase research. Implementation deferred.

## 1. Reused findings from prior trace

Source: `.llm/tmp/run/openhands/pr-36/run-27442056651-1/summary.md`

- File sizes: `route/mod.ts` 755 lines, `route/contract.ts` 600 lines, `route/manifest.ts` 463 lines — all over cap.
- Combined `deno doc --lint` over `./route/mod.ts ./route/contract.ts ./route/manifest.ts` produced **180 errors**:
  - `missing-jsdoc`: 106
  - `private-type-ref`: 74
- `private-type-ref` originates in `contract.ts` importing/re-exporting internal builder types from `../builders/define-page/navigation.tsx` (`BoundGetLinkPropsInput`, `BoundLinkProps`, `InferRoutePath`, `InferRouteSearch`, `TypedRouteTarget`, etc.).
- `deno check --unstable-kv` directly on route files fails to resolve from repo root (`Warning No matching files found`). Must use task wrappers or scoped tools.
- NetScript service contracts already expose `BaseContract` (`baseContract`) primitives under `packages/contracts/`. Route contract vocabulary should reuse rather than fork.

## 2. MEASURE-FIRST (to verify + extend)

TODO: run combined `deno doc --lint` for `./route` and capture counts.
TODO: run `deno check --unstable-kv` via task wrappers (root excludes `packages/fresh`).
TODO: over-cap inventory + private-type-ref detailed list.
TODO: dry-run snapshot.

## 3. Public symbol map

TODO: `deno doc --json` on `route/mod.ts`, `contract.ts`, `manifest.ts` — list exports, dependencies, types.

## 4. E2E typesafety chain

TODO: trace route contract → handler → 5b sdk client (`createServiceClient`) → island props.

## 5. Manifest vs Fresh 2 fsRoutes

TODO: document what `manifest.ts` adds vs what Fresh 2 provides upstream.

## 6. oRPC / contracts alignment

TODO: relate route contract to `contracts/versions/v1/` and oRPC patterns; market comparison.

## 7. Remaining gaps / blockers

TODO.
