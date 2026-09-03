# PLAN-EVAL verdict — plan head `f8ed75b41`

Separate session: OpenRouter `qwen/qwen3.8-flash` · xhigh (`.llm/tmp/eval1481`, session 57b4cabd, 2026-09-02). Verdict:

`
PASS_PLAN`

Verified at plan head `f8ed75b41` (plan/research/RFC artifacts present in that commit; `f8ed75b41 --stat` shows the run bundle only, so cited sources were checked at that tree). All three issue acceptance boxes map to concrete, verifiable slices and gates. Key plan claims independently confirmed:

- `FreshViteConfig.ignore?: RegExp[]` exists in `jsr:@fresh/plugin-vite@1.1.2` and applies to route+islands crawling (M1 is upstream-API, per A7).
- Fresh 2 core honors `/_middleware` at any directory depth (`id.endsWith(\"/_middleware\")` in cached @fresh sources); asset layout has all route files under `routes/(design)/design/**` (nothing directly in `(design)/`), so the planned middleware placement covers the whole surface.
- `composition.tsx.template:8` carries the exact `Composition rules — NetScript design system` literal, and it appears in no non-design template (the `(_islands)` hit is a shorter substring inside the design group itself).
- Generated app `deno.json` has a `build` task emitting `_fresh/` (`start` = `deno serve -A _fresh/server.js`) — the gate's build-and-walk premise is real.
- `generated.quality-negative` plant→fail→restore→green pattern exists as described (`generated-quality-gate.ts`, `generated-quality-probes.ts` at 49/167 lines); debt `scaffold-runtime-a8-f16-1333` (arch-debt.md:2243+) stop-condition is honored by extending existing files, adding no new directory child.
- Cited test/asset files (`route-templates_test.ts`, `generators-config_test.ts`, `manifest.ts`, `write-app-files.ts:97`, `check:assets-barrel` at deno.json:117) all exist; RFC H-4/H-8 line citations check out.

Findings (all non-blocking):

1. **F1 — M2's development signal is the weakest empirical premise (plan §M2, §Divergence ruling, Risk row 2).** The scaffold's own `main.ts.template` banner (`Deno.env.get('MODE') ?? 'development'`) shows `MODE` is normally *unset* in dev, and recent Vite CLIs do not reliably mutate `NODE_ENV` for a `deno run -A npm:vite` dev server — so the fail-closed `MODE→NODE_ENV` chain may 404 the local gallery. The plan is compliant because it *gates* this claim (existing `behavior.app-reference` must reach `/design/composition`; stop-and-drift otherwise) instead of asserting it. Implementation must resolve the signal at GREEN step 3 before M2 is called delivered.
2. **F2 — Dangling production `/design` links and an implicit type-contract dependency (plan §File list, §Debt and deferred scope).** `discoverNetScriptRoutes` (`packages/fresh/src/application/route/manifest.ts:341-407`) walks `routes/` itself and does **not** consume the Fresh plugin's `ignore`, so production `.generated` files still emit `/design/*` references — this is what keeps `router.ts` (`routes.design.$route`) compilable in a production build, and the plan leaves that load-bearing fact implicit. Consequence: home/dashboard \"Browse design\" links remain in production output and now 404. Out of the acceptance box, but should be recorded as a known
