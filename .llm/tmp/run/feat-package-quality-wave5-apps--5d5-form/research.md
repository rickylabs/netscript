# [5d5] `@netscript/fresh/form` — Phase 1 Research

Status: IN PROGRESS — skeleton, findings appended incrementally.

## 1. MEASURE-FIRST

- [x] `deno doc --lint` on `packages/fresh/form/mod.ts`
- [ ] `deno check --unstable-kv` on `./form` entrypoints
- [ ] private-type-ref count
- [ ] over-cap inventory (16.3K/16K/15.5K trio)
- [ ] publish dry-run excluded-module tally for form cluster

## 2. PUBLIC SURFACE MAP

- [ ] exports from `mod.ts`
- [ ] symbol map from `deno doc`
- [ ] public type graph

## 3. INTERNAL SEAMS (DECOMPOSITION RAW MATERIAL)

- [ ] `field-descriptors.ts`
- [ ] `schema-adapter.ts`
- [ ] `state.ts`
- [ ] `pipeline.ts`, `intent.ts`, `reply.ts`

## 4. fresh ↔ fresh-ui SEAM ANALYSIS

- [ ] read `packages/fresh-ui/registry/components/ui/form-field.tsx`
- [ ] read `packages/fresh-ui/registry/lib/control-props.ts`
- [ ] read `packages/fresh-ui/docs/l0-conventions.md`
- [ ] document state + `data-*`/ARIA contract

## 5. STANDARD SCHEMA LANDSCAPE & PROGRESSIVE ENHANCEMENT MARKET BAR

- [ ] zod/valibot/arktype interop (sources)
- [ ] Remix/React Router actions, Next.js server actions + useActionState, TanStack Form gaps

## 6. DRIFT / RISKS / GAPS

- [ ] drift entries `D-5d5-n`
- [ ] remaining phase-2 questions

---

