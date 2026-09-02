# PLAN-EVAL — fix-aspire-reference-name-validation--1732-source-safety

- Plan evaluator session: Claude Fable 5 (native opposite-family evaluator), cycle 1, 2026-08-30
- Run: `fix-aspire-reference-name-validation--1732-source-safety`
- Surface / archetype: `packages/aspire` config boundary (Archetype 2, Keep) + `packages/cli`
  background AppHost generator (Archetype 6, dominant)
- Scope overlays: none
- Evaluated head: `fddcb833ba5e49466ac942112b41bd7712aa7c17` (branch
  `fix/aspire-reference-name-validation`, base `13878a80a50c55b9662099fed64555f2310ae4a3`)
- Head assertion: local detached worktree `fddcb833` == `origin/fix/aspire-reference-name-validation`
  `fddcb833` == PR #1747 `headRefOid` `fddcb833`. Verdict is scoped to this head only.
- Scope discipline: `git diff --stat 13878a80..fddcb833` = 6 files, all under
  `.llm/runs/fix-aspire-reference-name-validation--1732-source-safety/` (548 insertions). No
  `packages/`, `plugins/`, test, lock, or asset change has leaked ahead of the gate.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                 |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselined against `13878a80` on 2026-08-30. Spot-checks below (findings 1, 2, 3, 6) all hold at this head.                                                                        |
| Decisions locked                        | PASS   | `plan.md` D1–D5 with rationale. Ordering rationale (escaping first because grammar is unexecuted) is sound and I could not break it.                                                                 |
| Open-decision sweep                     | FAIL   | The plan declares "no implementation decision remains open", but one decision that forces rework if deferred is undeclared: what D1 does at the **identifier** seam (see F1). Evaluator sweep below. |
| Commit slices (< 30, gate + files each) | PASS   | 4 implementation slices (P, 1–4), ordered, each names proof, gate, files. RED-first slice 1 is genuinely red at baseline (probe below).                                                              |
| Risk register                           | PASS*  | 10 rows with mitigations. *Missing the identifier-seam row that F1 requires; otherwise complete.                                                                                                     |
| Gate set selected                       | PASS   | 14-row table; wrapper-sourced, root test honestly `NOT FIRED`, `check:assets-barrel` and baseline comparisons are relevant (verified below).                                                         |
| Deferred scope explicit                 | PASS   | "Deliberately Untouched" enumerates scaffold grammar, siblings, `safeIdentifier`, #1728/#1365, publics, runtime. Sibling-generator scoping is acceptable (verified below).                          |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Resolution of the pre-dispatch finding holds: `src/domain/` is not in the export map and is not reachable from any exported entrypoint; both red baselines re-measured true at this head (below).   |

## Verdict

**`FAIL_FIX`** — the approach, ordering, grammar, scope, and gate set are sound; two bounded
corrections to the plan text/matrix are required before the RED slice. The `plan-protocol.md`
vocabulary maps this to `FAIL_PLAN` on the single unchecked box (open-decision sweep); the dispatch
authorized `FAIL_FIX` for bounded corrections and that is the honest size of the defect. Cycle 1 of
2.

### Required fixes

1. **F1 — D1 over-claims; the identifier seam is undeclared.** D1 states generated source becomes
   "parseable for every input name independently of grammar correctness" and the PR DoD says
   "Accepted generated source remains parseable". Both are false at this head for names that pass
   D2's grammar: `safeIdentifier(name)` places the name in **identifier** position (`const class =
   builder.addExecutable(...)`, `const await_perms = …`) where `JSON.stringify` never applies.
   Measured with a probe that invoked `generateRegisterBackground` directly at `fddcb833` and
   `deno check`ed the output with imports stripped:

   | Input (processor name)   | D2 grammar | Result at head                                                          |
   | ------------------------ | ---------- | ----------------------------------------------------------------------- |
   | `workers`                | accept     | no SyntaxError                                                          |
   | `it's`                   | reject     | `SyntaxError: Expected ']', got 's'` (RED premise confirmed)            |
   | `back\slash`             | reject     | `SyntaxError: Expected unicode escape` (RED premise confirmed)          |
   | `class`                  | **accept** | `SyntaxError: Expected ident`                                           |
   | `await`                  | **accept** | `SyntaxError: \`await\` cannot be used as an identifier in an async context` |
   | `builder`                | **accept** | parses; emits `const builder = builder.addExecutable('builder', …)` → TDZ `ReferenceError` at runtime |
   | `config`                 | **accept** | parses; inner `const config` shadows the outer config before `buildOtelEnvVars('config', config.Version, …)` |
   | ref `it's` (ServiceReferences) | reject | `SyntaxError` (RED premise confirmed for references)               |

   Every JS reserved word is lowercase-alpha, so it passes the scaffold's `/^[a-z][a-z0-9-]*$/`
   too: `plugin install worker --name class` is accepted by `validateResourceName`
   (`packages/cli/src/kernel/adapters/scaffold/workspace-writer.ts:119-146`; its reserved list has
   no JS keywords) and produces unparseable AppHost source that neither D1 nor D2 catches. The
   same applies to any reference name, via `${safeIdentifier(ref)}ServiceEndpoint${index}`.

   This is not a request to widen scope. It is a request that the plan **decide** this seam
   explicitly, because either choice forces rework if discovered mid-implementation. Any one of
   the following satisfies F1:

   - (a) extend slice 2 to make identifier derivation collision/reserved-safe **inside the
     background generator** (e.g. a generator-local prefix such as `bg_${safeIdentifier(name)}` /
     `ref_…`, which also removes the `builder`/`config`/`infrastructure`/`_services` shadowing
     class), leave `_utils.ts` untouched as planned, and add matrix rows `class`, `await`, and
     `builder` (accept at config, parse + execute at generator); **or**
   - (b) keep the generator as planned, add a JS-reserved-word / generator-binding rejection at the
     D4 boundary with a matrix row, and state that the platform grammar is layered with a
     generator-safety rule (this is stricter than Aspire and must be disclosed under D5); **or**
   - (c) defer it: narrow D1 and the PR DoD to "every emitted **string-literal** position", add a
     risk-register row and a "Deliberately Untouched" entry naming reserved-word/shadowing
     identifiers as a pre-existing cross-generator defect (siblings use `safeIdentifier` the same
     way), and open a follow-up issue before slice 1.

   I recommend (a): it is ~3 lines in a file already being edited, keeps `safeIdentifier` and the
   platform grammar pure, and makes D1 actually load-bearing. Whichever is chosen, the DoD box
   "Accepted generated source remains parseable" must be true as written or reworded.

2. **F2 — pin the non-name literal positions in the same generator.** D1 enumerates the
   name-derived default entrypoint but the generator interpolates the resolved `entrypoint`
   variable (user-supplied `Entrypoint` included), `workdir` (`Workdir`), and
   `entry.ConcurrencyEnvVar` as raw single-quoted literals (`generate-register-background.ts:38-40,
   75, 102, 150`). State explicitly that slice 2 stringifies the `entrypoint` and `workdir`
   literals unconditionally (covering both derived and user-supplied values — this is the natural
   implementation anyway) and either does the same for `ConcurrencyEnvVar` or lists it as
   deliberately untouched. Without this, "every interpolation site" is enumerated by name-origin
   rather than by emission site, which is the gap the risk register says it closes.

### Advisory (not blocking)

- D4 must stay a composed-level custom issue (`superRefine`/`check` on the object), as written. If
  implementation drifts to `.regex()` on `ReferenceFields` or on the record key, the change would
  surface in `z.toJSONSchema(AppSettingsSchema)` (`packages/aspire/schema.ts:35`) and alter the
  published JSON-schema output for every section — exactly the broadening D4 forbids. Worth a
  one-line note in slice 3.
- `ConcurrencyEnvVar` default derivation `key.toUpperCase().replace(/-/g,'_')` (`config.ts:708`)
  is unaffected by the grammar; no action.

## Attack narrative — what I tried to break and could not

1. **Grammar correctness (attack 1).** Fetched upstream
   `src/Aspire.Hosting/ApplicationModel/ModelName.cs` (main): 1–64 chars; must start with an ASCII
   letter; only ASCII letters, digits, hyphens; no consecutive hyphens; no trailing hyphen;
   `IsAsciiLetter()` accepts uppercase. D2 is **exactly** the platform rule — neither stricter nor
   looser on uppercase, digits, dots (rejected both sides), length, leading/trailing characters.
   Attack failed.
2. **D5 blast radius (attack 2).** Searched `packages/`, `plugins/`, `docs/` for
   `BackgroundProcessors` keys and `ServiceReferences`/`PluginReferences` values containing `_`,
   uppercase, `--`, or trailing `-`: none in tests, fixtures, templates, e2e, or docs. The two
   affected test files are green at baseline through the structured wrapper (48 passed / 0
   failed). Producers: `validateResourceName` (plugins, contracts, init) caps at 64 and allows
   `a--b`/`a-`; services have no separate cap (research 6 confirmed). D5's enumeration is accurate
   and honestly labelled a fail-fast correction. Attack failed — except for the reserved-word
   class in F1, which D5 does not need to mention if F1(a) or (c) is chosen.
3. **Escaping enumeration (attack 3).** Read the generator end to end. Name/ref **string-literal**
   sites: config lookup (l.57), comment (l.54), executable name (l.102), OTEL name (l.128), map key
   (l.220), error-message strings (already `JSON.stringify`), both reference lookups (l.84, l.94),
   both discovery keys (l.201, l.211), default entrypoint (l.39→l.102). Plan's list is complete
   for literals. What it misses is the identifier seam (F1) and the non-name literals (F2).
4. **Discovery-key contract (attack 4).** Both loops emit `'services__${ref}__http__0'` (service
   l.201, plugin l.211) — the existing test already pins `services__workers-api__http__0` and the
   plan's negative assertion (`services__workers_api__http__0` absent) cannot false-match the
   `workers_apiServiceEndpoint0` identifier. `JSON.stringify` of a hyphenated key is byte-identical
   to the raw key. Positive + negative assertion applied to both kinds is sufficient. Attack failed.
5. **Validation placement (attack 5).** `NetScriptConfigZod` (`config.ts:619-636`) is composed
   into `AppSettingsZod` and is the only seam holding processor key + both arrays together; the
   existing cross-reference pass (`config.ts:760-806`) runs after schema parse and returns
   *warnings*, so a grammar check there would not be a deterministic pre-generation error. The
   plan's seam is right. Sibling generators (`generate-register-services/plugins/apps.ts`) contain
   no `'${name}'`/`'${ref}'`/`'${key}'` raw-literal interpolation of the background kind (grep
   count 0 each), so scoping D4 to background entries leaves no equivalent literal hole open —
   acceptable scoping. Their identifier seam shares F1's defect; that is pre-existing and belongs
   in F1(c)'s follow-up if deferred.
6. **Test matrix (attack 6).** Config-boundary rows all go red (no validation exists). Generator
   rows: quote and backslash are red (probe); backtick, underscore, hyphen, uppercase, `a--b`,
   `a-`, 64/65 already parse — the plan discloses this caveat honestly. 64/65 boundary, uppercase
   (`Workers-API2`), and both reference kinds are present. Missing rows are exactly F1's.
7. **Gate set (attack 7).** `check:assets-barrel` is relevant: the generator renders
   `generate-register-background-1.ts.template` through the embedded barrel
   (`assets/manifest.ts:96`); the gate proves no asset drifted. `quality:scan` `--max-allow 7`
   matches the `allowCount 7` expectation. Root `deno task test` is recorded `NOT FIRED` in plan,
   PR body, and phase comment — not a green in disguise. Attack failed.
8. **Scope discipline (attack 8).** Run artifacts only (above). Attack failed.
9. **Receipt honesty (attack 9).** Every SHA in the run dir resolves: `13878a80…3a3`
   (commit, base), `2176041116f3…` (commit, plan-authoring). PR body and phase comment cite
   `fddcb833…c17` (commit, head). No fabricated suffixes.
10. **GitHub surface (attack 10).** PR #1747: body contains `Closes #1732`; labels
    `type:fix`, `area:cli`, `area:aspire`, `priority:p1`, exactly one `status:` = `status:plan`;
    milestone `0.0.7`; draft. Attack failed.

## JSR-surface resolution check (the disclosed pre-dispatch finding)

- `packages/aspire/deno.json` export map: `.`, `./config`, `./schema`, `./types`, `./constants`,
  `./application`, `./adapters`, `./testing`, `./public`. `./src/domain/**` is not an entrypoint
  and JSR resolves consumer imports only through the export map. `publish.include` does ship the
  file bytes, which is fine and unavoidable for any internal module.
- Indirect reach: `src/domain/mod.ts` re-exports types and two error classes only; no exported
  entrypoint imports `src/domain/` today (grep of `mod.ts`, `config.ts`, `src/public/mod.ts`,
  `src/application/mod.ts`). A `RegExp`/string constant consumed inside a `superRefine` closure
  does not appear in any exported type, so doc-lint cannot see it. Resolution holds — provided
  slice 3 does not add the constant to `src/domain/mod.ts` or type any exported symbol with it.
- Baselines re-measured at `fddcb833`:
  - `deno task doc:lint --root packages/aspire --pretty` → exit 1; `combinedMissingJSDoc: 0`,
    `combinedTotal: 0`; per-entrypoint private-type refs on `./src/adapters`, `./src/application`,
    `./src/public` (52), `./src/testing` (2), `./types` (19). Matches the recorded baseline.
  - `audit-jsr-package.ts --root packages/aspire --text` → exit 1; four `FAIL F-JSR-2` (missing
    `@module` on `./application`, `./adapters`, `./testing`, `./public`), one `WARN F-JSR-7`;
    `dry-run: OK slowTypeWarnings=1`. Matches the recorded baseline.

## Open-decision sweep (evaluator-run)

- **Identifier seam under D1** — must resolve now (F1). Deferring it silently would mean the RED
  matrix, the PR DoD, and the "load-bearing" framing are all built on a property the code does not
  have; discovering it in IMPL-EVAL forces a slice-2 rewrite.
- **Non-name literal positions** — must resolve now but trivially (F2); it only fixes the
  enumeration basis.
- Everything else: none found. Dual-defense ordering, grammar, constant separation, compatibility
  position, and the no-runtime constraint are correctly locked.

## Host conditions (recorded, not charged to the plan)

- `rtk` is not installed on this host (`command not found`); raw commands were used directly.
- ~7.7k unreapable PID-1 zombies: root `deno task test` was not run and is not a usable signal
  here. The focused structured test wrapper, `doc:lint`, the JSR audit, and direct generator
  probes all completed normally; no host-caused failure was observed in this evaluation.
- Not run and not findings: Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli`. No runtime
  lease.

## Notes

- Nothing in this evaluation touched source, tests, other run artifacts, PR body, labels, draft
  state, milestone, or the issue. Probe scripts lived under the job tmp dir and are not committed.
