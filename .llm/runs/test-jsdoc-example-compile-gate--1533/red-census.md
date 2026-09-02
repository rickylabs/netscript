# I3 RED census — published JSDoc examples

Measured on 2026-08-30 after the I3 semantic controls and before any corpus repair.

## Corpus

| Measure | N |
| --- | ---: |
| Publishable members | 35 |
| Publish-rule-selected TypeScript/TSX files | 2020 |
| Structured `@example` tags | 349 |
| TypeScript-fenced candidates | 348 |
| Checked candidates before repair | 348 |
| Exemptions | 0 |

## Failures by exclusive example class

Each failing example is counted once. Classification precedence is bad import/specifier, unbound
name, then other TypeScript/signature/syntax error; unfenced and malformed are policy findings.

| Class | N |
| --- | ---: |
| Bad specifier/imported export | 27 |
| Type error | 21 |
| Unbound name | 116 |
| Unfenced | 0 |
| Malformed | 1 |
| **Total failing examples** | **165** |

The malformed example is the bare fence at `packages/cron/ports/types.ts`.

## Command evidence

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- \
  --allow-read --allow-write --allow-run \
  .llm/tools/docs/jsdoc-example-corpus_test.ts

exitCode=1
passed=0 failed=1
jsdoc examples: FAIL members=35 files=2020 examples=349 candidates=348 checked=348 \
  exempt=0 non_ts=0 unfenced=0 malformed=1 failures=165
failureCensus={"badSpecifier":27,"typeError":21,"unboundName":116,"unfenced":0,"malformed":1}
Found 262 errors.
```

The command is expected RED in I3. The same corpus test becomes the GREEN assertion only after an
authorized repair slice.

## Ceiling decision

The owner-set D14 ceiling is crossed before I4:

- mechanical classes are at least 144 examples (`27 + 116 + 0 + 1`), above the 90-example ceiling;
- the type-error class is 21 examples, above the eight-example ceiling;
- therefore I4 must not begin without supervisor rescope.

No failure has been baselined or exempted. No public example has been repaired in I3.
