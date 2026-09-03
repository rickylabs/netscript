# IMPL-EVAL cycle 1 — #1732 `fix-aspire-reference-name-validation--1732-source-safety`

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Verdict        | **PASS**                                                                 |
| Evaluated head | `fc3ea1775029502ea0b811137aa2096e40505709` (PR #1747, base `13878a80`)  |
| Evaluator      | separate opposite-family session, detached worktree `007-eval-1732-impl` |
| Date           | 2026-08-30                                                               |
| Scope diff     | 7 files under `packages/aspire` + `packages/cli`; no other paths touched |

## What I tried to break, and what survived

### 1. Both directions of the validator (attack: over-rejection and under-rejection)

Drove `AppSettingsSchema.safeParse` at the head with a 43-name matrix in all three positions
(processor key, `ServiceReferences[0]`, `PluginReferences[0]`), well beyond the 15 names the leaf's
own tests use.

- **Still accepted (must keep working):** `workers`, `workers-api`, `Workers-API2`, `A`, `a1`,
  `a-1-b`, `class`, `await`, `builder`, `config`, `infrastructure`, `backgroundProcessors`,
  `constructor`, 64×`a`. All `AAA`.
- **Rejected:** 65×`a`, empty, `1worker`, `-a`, `a-`, `a--b`, `a_b`, `a.b`, `a b`, `a/b`, `ä`,
  `wörkers`, `it's`, `back\slash`, `` tick`name ``, `${x}`, `a\nb`, NBSP/ZWJ variants, leading and
  trailing spaces, `*/`, `a"b`, `_services`, `bg_0`, `ref_service_0_0`. All `RRR`.
- The regex `^(?=[A-Za-z0-9-]{1,64}$)[A-Za-z](?:[A-Za-z0-9]|-(?=[A-Za-z0-9]))*$` is exactly the
  documented Aspire `ModelName` rule (1–64, ASCII-letter start, ASCII letters/digits/hyphens, no
  `--`, no trailing `-`) and I found no name where the regex and the prose disagree.
- Absent `BackgroundProcessors` still defaults to `{}` through the `.default({}).superRefine(...)`
  chain; an invalid name with `Enabled: false` is still rejected (correct — the generator emits the
  block regardless of `Enabled`); a config with two bad names and a bad `Concurrency` reports all
  issues, not just the first.
- One `A` in my matrix — `__proto__` as processor key — is an artifact of my probe building the
  config with an object-literal computed key (it set the prototype, so the record was empty). Not a
  leaf defect.

### 2. Escaping is load-bearing underneath the grammar (attack: grammar wrong in the loose direction)

For every one of the 43 names above I also drove `generateRegisterBackground` with that string in
**every** user-controlled site at once (processor key, service ref, plugin ref, `Entrypoint`,
`Workdir`, `ConcurrencyEnvVar`) and dynamically `import()`ed the emitted `.mts` with stubbed SDK /
compat modules. **All 43 parse and load**, including every grammar-rejected spelling. So if the
documentation-derived grammar is wrong in the loose direction, generated source still cannot be made
unparseable by config text.

Shadowing attack: ten processors named `bg_1`, `bg_0`, `builder`, `config`, `infrastructure`,
`_services`, `_plugins`, `appHostDir`, `databaseProviderEnv`, `OtlpProtocol` (with `RequiresDb`,
`RequiresKv`, and cross-references to `ref_service_0_0` / `bg_0`) — the module loads; the
generator-local ordinals never collide with user text because user text never reaches identifier
position.

Comment-position sweep: with `ZZ`-tagged text in every user field (including `Permissions` and
`Sagas.Store.Backend`) I grepped every emitted line: **zero comment lines contain user text, and
zero lines contain user text outside a double-quoted (`JSON.stringify`) literal.** The U+2028 case
is genuinely proved: at the RED commit that exact test fails with `SyntaxError: Expression expected`
on the line after the comment (`// --- line<U+2028>separator ---` terminates the comment and
`separator ---` becomes code); at the head it loads.

### 3. Compatibility (attack: a working config that is newly rejected)

- Scaffold `NAME_PATTERN` is `/^[a-z][a-z0-9-]*$/` (`scaffold-validation.ts:10`), so `a--b`, `a-`,
  and >64 names are scaffold-valid. But the sibling service/plugin generators register those
  entries as Aspire resources under the **same config key** (`addExecutable('${name}', …` in
  `generate-register-services.ts:80` / `generate-register-plugins.ts:87`), and a background
  reference names one of those resources — so any name the new grammar rejects was already failing
  at the referenced resource's own Aspire registration. The "moves an existing failure earlier"
  claim holds; I found no counter-example.
- Scaffolded `BackgroundProcessors` starts `{}` (`generate-appsettings.ts:314`); plugin-added keys
  (`workers`, `sagas`, `triggers`, `streams`) and reconciler-written references (`workers-api`,
  scaffold service names) all satisfy the grammar.
- Raw discovery key: `services__workers-api__http__0` is emitted verbatim, and the string
  `workers_api` does not appear anywhere in the output. Uppercase and hyphenated names pass.

### 4. E2E fixture (angles the supervisor did not take)

Replayed the fixture's exact anchoring against real generator output with `workers` **last**,
preceded by `workers-api` and `sagas`, and with `RequiresDb`+`RequiresKv`+2 service refs+1 plugin
ref (the widest block the generator can emit): binding derived as `bg_2`, block braces balanced
12/12, zero two-space `}` lines inside the block before the wrapper close, no `"sagas"` inside the
slice (the only `"workers-api"` inside it is workers' own plugin-reference key, not the sibling
block).

- *Emitted body containing a two-space `}` before the wrapper closes:* impossible from user text —
  every user string goes through `JSON.stringify`, which escapes `\n`, so no raw newline can be
  emitted from config; every generator-authored inner line is indented ≥4. The `\n  }` delimiter is
  therefore exact, not merely "usually right".
- *No `.set(...)` for `workers`:* the generator emits `.set` unconditionally as the block's last
  statement; the only way it is absent is `workers` not being a processor, and then the earlier
  `addExecutable("workers",` regex throws a clear message first.
- *`Enabled: false`:* the block is still emitted (the check is a runtime `if`), so the fixture
  still anchors and inserts. No change in behavior.
- *`workers-api` false match:* the regex requires `"workers",` with the closing quote+comma, so the
  sibling cannot match.
- Coupling judgement: pinning generated text in a merge-readiness fixture is real coupling, and it
  pre-dates this leaf (the same file pins `// --- workers-api ---` in `register-plugins.mts`, which
  the sibling generator still emits with user text). The new derivation is strictly more robust than
  what it replaced. I note that the old `'  // --- '` delimiter still exists in the new output
  (`// --- processor N ---`), so retaining it was possible; the chosen delimiter is nonetheless
  exact per the analysis above. **Not a finding.** A stable machine marker owned by the generator
  would be the right long-term seam — supervisor's call, outside #1732.

### 5. JSON-schema broadening

Independently dumped `z.toJSONSchema(AppSettingsSchema)` at `main` `13878a80` and at the head:
pretty-printed 22,110 bytes / SHA-256 `4839f343…f22c399` on both — `diff` empty. Compact form is
9,988 bytes, matching the recorded figure. Zero `"pattern"` keys anywhere in the schema;
`BackgroundProcessors` still `{ default: {}, type: object, propertyNames: {type: string}, … }`.

### 6. JSR reachability

`ASPIRE_RESOURCE_NAME_*` is referenced only from `config.ts` (import + two `.test()` calls + one
message) and the domain file itself; it is absent from `src/domain/mod.ts`, `constants.ts`, every
export-map entry in `packages/aspire/deno.json`, and every exported symbol's type. Re-measured
baselines against `main` in a throwaway worktree: `doc:lint --root packages/aspire` exit 1 at both,
output identical modulo timings; JSR audit exit 1 at both, identical except `files=45→46`,
`loc=3654→3823` — same four F-JSR-2 and one F-JSR-7. No new finding. (The file ships inside the
tarball via the `**/*.ts` publish include, like every other `src/domain` file, but is unreachable.)

### 7. RED honesty

Re-executed the three focused files in a throwaway worktree at `5b84eaea`: exit 1, **111 passed /
32 failed / 143 total, 32 unique failures** — 24 grammar-rejection steps (8 names × 3 positions) +
6 generator seams + 2 parent suites. The RED commit touches only test files and run artifacts. The
head runs the same three files at **143/143**. The only test-file changes after RED are anchor
updates for the new emission shape (`'workers'`→`"workers"`, `workers_workdir`→`bg_0_workdir`,
`benchmark.`/`sagas.`/`triggers.`→`bg_0.`) — no assertion was weakened or removed.

### 8. Receipt honesty

Every 40-char SHA in `plan.md`, `plan-eval*.md`, `worklog.md`, `drift.md`, `context-pack.md`,
`supervisor.md`, the PR body, and the PR comments resolves via `git cat-file -t` to a commit (12
distinct SHAs, all `commit`); every 7–8 char short SHA in backticks resolves too. `origin/fix/aspire-reference-name-validation` == PR head == `fc3ea177`. `13878a80` is an ancestor of the head.

### Gates I ran myself at the head

| Gate                                                 | Exit | Result                               |
| ---------------------------------------------------- | ---: | ------------------------------------ |
| Focused tests (3 files, structured wrapper)          |    0 | 143 passed / 0 failed                |
| Same 3 files at RED `5b84eaea`                       |    1 | 111 / 32 failed — real RED→GREEN     |
| `deno check --unstable-kv` on the 7 changed files    |    0 | clean                                |
| `deno lint` / `deno fmt --check` on the 7 files      |    0 | clean                                |
| JSON schema main vs head                             |    0 | byte-identical                       |
| `doc:lint` aspire, head vs main                      |  1/1 | identical baseline                   |
| JSR audit aspire, head vs main                       |  1/1 | identical baseline (4×F-JSR-2, 1×F-JSR-7) |
| Root `deno task test`                                |    — | NOT re-run; supervisor's 4308/2/19 at the evidence head accepted, both reds reproduced at `main` and outside the diff |
| Aspire / Docker / browser / `e2e:cli` / `scaffold.runtime` | — | **NOT_RUN** — excluded by the coordinator-owned global expensive-gate lease (serialized at one holder), not by environment availability; the Docker sandbox is operational |

### Gate-table honesty

`worklog.md` row 6 and `drift.md` now record root test as FIRED / exit 1 with the two pre-existing
reds attributed to `main`; `context-pack.md` carries the correction. `plan.md` (§ gate row 6 and the
risk register) still reads "NOT FIRED by owner instruction" — that is the locked plan artifact
describing the plan-time decision, not the final evidence table, and the evaluator boundary forbids
editing it; acceptable as dated history.

## Observations (non-blocking, hand up)

1. The grammar was not executed against Aspire in this leaf; it matches the upstream `ModelName`
   rule as I know it and escaping is proven load-bearing for every rejected spelling. If the
   supervisor wants a runtime verdict, it needs the expensive-gate lease — I did not take it.
2. Sibling service/plugin/app generators still emit `addExecutable('${name}'` and user-text comments
   unescaped (known, deferred, recorded in drift and the PR).
3. Scaffold `NAME_PATTERN` remains looser than Aspire (known, deferred).

## Verdict

**PASS.** Both validator directions hold, escaping is independently proven sufficient beneath the
grammar for every rejected spelling, the fixture survives the new shape under the widest block the
generator can emit, the published JSON schema and JSR surface are byte/finding-identical to `main`,
RED→GREEN is real, and every cited receipt resolves.
