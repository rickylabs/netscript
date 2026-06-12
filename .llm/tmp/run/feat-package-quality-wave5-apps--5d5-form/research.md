# 5d5 `./form` PLAN-phase research

Run: `feat/package-quality-wave5-apps-5d5-form` PR #38  
Trigger: RE-DISPATCH phase 1 of 2 — RESEARCH ONLY.  
Reused from prior trace `.llm/tmp/run/openhands/pr-38/run-27442097563-1/summary.md` where noted.

## 1. MEASURE-FIRST baseline

> TODO: fill with current numbers from `deno doc --lint`, `deno check`, `deno publish --dry-run`, file sizes, private-type-ref count.

| Check | Command / scope | Result |
|---|---|---|
| Type check `./form` | TODO | TODO |
| Root type check (excludes `packages/fresh`) | TODO | TODO |
| Doc lint `./form` combined | TODO | TODO |
| JSR dry-run `@netscript/fresh` | TODO | TODO |
| Over-cap files | TODO | TODO |
| Private-type-refs | TODO | TODO |

## 2. `./form` public surface & internal seams

> TODO: symbol map from `deno doc` + exports; decomposition raw material.

## 3. fresh↔fresh-ui seam analysis

> TODO: read `packages/fresh-ui/registry/components/ui/form-field.tsx`, `registry/lib/control-props.ts`, `packages/fresh-ui/docs/l0-conventions.md`; document state contract and `data-*`/ARIA expectations.

## 4. Standard Schema landscape & market bar

> TODO: zod/valibot/arktype interop sources; Remix/RR, Next.js server actions + useActionState, TanStack Form gaps worth closing vs deferring.

## 5. Reused findings from prior trace

> TODO: distill what was valid from run-27442097563-1 and what we re-verified.

## 6. Gaps / blockers

> TODO: questions requiring supervisor/design trigger.

