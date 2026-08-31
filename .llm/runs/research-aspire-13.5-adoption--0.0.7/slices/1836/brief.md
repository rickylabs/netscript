use harness

## SKILL

- netscript-harness — commit-by-slice + push + draft PR from the first commit; no self-certification.
- netscript-doctrine — `packages/cli` is framework code: contract first, no `any`, no unsafe casts,
  no new lint-ignores.
- netscript-pr — draft PR on start, `Closes #1836` in `## Scope`, namespaced labels, milestone.
- netscript-tools — scoped check/lint/fmt wrappers; lock hygiene.

## Slice — #1836: reserved-word bindings and unescaped literals in the sibling register generators

#1747 fixed this defect class in `generate-register-background.ts`. **The identical defect is still
live on `main` in four sibling generators.** Reproduced before dispatch: rendering
`generateRegisterApps` with an app named `class` emits

```js
const class = builder.addExecutable('class', 'deno', class_workdir, ['task', 'dev']);
```

`const class` is not valid JavaScript — the generated AppHost will not parse.

## Affected sites

All four derive bindings via `safeIdentifier(name)` (hyphen-only replacement, **no reserved-word
guard**, `helpers/_utils.ts`) and emit user strings through raw `'${…}'` interpolation:

| Generator | Sites |
| --- | --- |
| `generate-register-apps.ts` | `:68`, `:217` |
| `generate-register-plugins.ts` | `:185`, `:220` |
| `generate-register-tools.ts` | `:37` |
| `generate-register-infrastructure.ts` | `:109` |

Two failure modes, both already proven for the background generator:
1. **Reserved word / collision** — `class`, `await`, `function`, `const`, `return` produce
   `const <keyword> = …`; `a-b` and `a_b` collide after normalization.
2. **Literal breakage/injection** — quotes, backslashes, backticks, `${}` or newlines in a `Workdir`,
   `Entrypoint`, path or env value escape their literal.

## Required change — mirror the #1747 treatment exactly

1. **Ordinal bindings.** Derive every emitted `const <binding>` from a generated ordinal (the
   background generator uses `bg_<n>`; use an equivalent per-generator prefix), **never** from user
   text. This makes reserved words and collisions *structurally impossible* rather than filtered.
2. **`JSON.stringify` every user-supplied string** emitted into generated source — resource names,
   `Workdir`, `Entrypoint`, paths, env keys and values, `addParameter('${name}', …)` sites, and any
   other interpolated user value. Not just the resource name.
3. Keep the resource-name **string argument** semantically identical — only the *identifier* becomes
   ordinal. Generated behaviour must not change for well-formed names.
4. Follow the existing pattern in `generate-register-background.ts` rather than inventing a new one,
   so the four generators stay consistent with the fixed one.

## Tests — contract first, and they must be capable of catching this

Write failing tests first, record the RED output, then fix.

- Render each generator with **hostile inputs**: reserved words (`class`, `await`, `function`,
  `const`, `return`), colliding names (`a-b` + `a_b`, `workers-api` + `workers_api`), and
  quotes / backslashes / backticks / `${}` / newlines in every user-supplied string field.
- **Parse or type-check the emitted output — string matching alone is NOT sufficient.** A string
  assertion is exactly what let `const class` ship past a prior evaluation. Parse-check the emitted
  module (e.g. `deno lint` on the written file, or dynamic import against stubs) so invalid JavaScript
  fails loudly.
- **Prove by mutation**: confirm each test fails if the ordinal binding or the `JSON.stringify`
  escaping is reverted. State that result explicitly in your report.

## Gates

Scoped `deno check --unstable-kv`, `deno lint`, `deno fmt --check` on changed files; focused
generator tests; **repo-wide `deno task check`** expecting `failedBatches: 0`;
`deno task quality:scan`; `deno task arch:check`; `check:assets-barrel` if any snapshot/barrel is
affected by the emission change (regenerate with `gen:assets-barrel` if so).

**No runtime** — do not start Aspire or Docker (host runtime is parked). Rendering generators
in-process is not runtime; do that. **No self-dispatched evaluator** — a supervisor-dispatched
IMPL-EVAL follows. Do not change lifecycle labels.

## PR

Draft PR against `main` from the first commit, `Closes #1836` in `## Scope`, labels
`type:fix, area:cli, area:aspire, priority:p1, status:impl, orchestrator:aspire`, milestone `0.0.7`.
Report branch, head SHA, PR number, the RED evidence, the mutation-proof result, and every gate's exit
code.
