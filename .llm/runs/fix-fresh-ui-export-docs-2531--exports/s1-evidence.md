# S1 source gate evidence

Candidate gates run on the S1 working tree before sign-off; final-head gates are separate.

| TypeScript entrypoint | Native doc-lint exit | Findings |
| --- | ---: | ---: |
| `./mod.ts` | 0 | 0 |
| `./src/ai/render-ui.tsx` | 0 | 0 |
| `./desktop.ts` | 0 | 0 |
| `./interactive.ts` | 0 | 0 |
| `./primitives.tsx` | 0 | 0 |
| `./registry.ts` | 0 | 0 |
| `./tokens.ts` | 0 | 0 |
| `./token-config.ts` | 0 | 0 |
| `./registry-v2.ts` | 0 | 0 |
| `./contracts.ts` | 0 | 0 |

Scoped structured check/lint/fmt:20 source files selected; zero findings; lint/fmt processed20/20,
no drops or refusals. Run commands use repeated --file selectors from the actual diff.

Fresh focused package test command:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh-ui/tests/publish-size.test.ts packages/fresh-ui/tests/consumer-render.test.tsx
```

Exit0, passed5, failed0, ignored0. This includes actual native publication and budget enforcement.
The initial full suite passed626 and failed1 against the pre-anchor snapshot; the repaired
publication case is verified here. The fresh complete package run now passes627/627, failed0, ignored0 (321755ms).

Broader quality-gate: initial pass, then a cold dependency resolver failure outside this diff,
then a full retry pass without changing source or locks. Do not infer final-head evidence from
a candidate receipt. Both failed and passed attempts are retained in private scratch.

`contracts.json` exactly matches the main baseline, SHA-256:
`ab23bc8432bd06cdb9e52c3cb527bb8ed100b421f257a4fe08a995751ee5bb5b`.

JSON is deliberately absent from the native TS gate above. Raw Deno reports its upstream
module-JSDoc limitation; S2 must validate it explicitly as data, including negative controls.

Reconcile: component bodies and original upstream Preact prop/VNode types are retained;
all modified package files are reached from interactive.ts, token-config.ts or consumer tests.
No dependency, lock, token value or catalog payload changes. No new accepted debt.
