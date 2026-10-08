# PLAN-EVAL — fix-auth-config-secrets-2020--urgent-canary

- Plan evaluator session: independent opencode-go/glm-5.3-flash (owner-mandated), 2026-10-07; fresh
  session, no generator-session contact. Requested route: opencode-go/glm-5.3-flash max; observed:
  same provider/model executing this eval (no fallback). Tier: feature; distinct vendor family from
  the gpt-6.1-sol generator — route requirement satisfied.
- Run: fix-auth-config-secrets-2020--urgent-canary
- Exact head: `f9fd12ce00a97fd810016bd4d7712d7b940fc67d` (branch `fix/auth-config-secrets-2020`).
  Fresh `main` baseline: `6f6cbdf030d7595d1730272d0a74aedd66225069` — matches supervisor.md.
- Surface / archetype: Archetype 6 CLI/tooling — `packages/cli` public auth feature + Aspire helper
  generation; plugin consumer overlay; S3 docs overlay.
- Bounded review per brief: three load-bearing seams, POSIX vs Deno parser contract,
  pruning/canonical selector compatibility. No implementation, no full repo gates, no CI, no
  unrelated forensic scans. No code or implementation gates evaluated (IMPL-EVAL territory).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | research.md re-baselined against freshly fetched main (baseline equals current origin/main); five load-bearing findings spot-checked against the tree (see seam table) |
| Decisions locked                        | PASS   | plan.md "Locked decisions": sole .env credential home, canonical tracked plugin selector, POSIX single-quote literal with NUL refusal, native Cliffy env bindings with flag precedence, Aspire credential-shaped refusal matrix; rationale distributed plan.md + research.md |
| Open-decision sweep                     | PASS   | plan.md §"Open-decision sweep and deferred scope": no blocking decision; owner POSIX-sourceability choice recorded in drift.md; evaluator sweep below found no rework-forcing open decision |
| Commit slices (< 30, gate + files each) | PASS   | S1/S2/S3 ordered, each names files, proving gates, and "< 30 files" bound (plan.md §Design and slices) |
| Risk register                           | PASS   | plan.md §Risks and gates: credential pruning, hostile values, NUL, multi-line duplicates, input safety, generator false positives — each with a mitigation gate |
| Gate set selected                       | PASS   | plan.md "Required gates" matches Archetype 6 matrix + docs overlay + release-gate class (scaffold.runtime one-pass required because Aspire helper output changes); quality:gate = quality:scan + arch:check (deno.json task 56), consumer validation via generated carriers |
| Deferred scope explicit                 | PASS   | loader grammar boundary, generic deploy renderer, cross-platform shells, secret manager, rotation, publication, other plugins, dependency maintenance — all listed |
| jsr-audit surface scan (pkg/plugin)     | PASS   | package wave (packages/cli): planned public surface adds no new exports (research.md), slow-type/surface risk named before slicing and bounded to existing command factory/config functions; CLI publish dry-run gate required. jsr-audit rubric to be exercised at S2/S3 gates |

## Load-bearing seam spot-checks (brief-required)

| Seam | Claim | Observed |
| ---- | ----- | -------- |
| Writer duplicate credential persistence | writer copies all provider values into both `Auth.Environment` and `NetScript.Plugins.auth.Environment`; duplicate occurrence handling stale | Confirmed. auth-config.ts:192-210 writes every provider value into both containers; writeAuthEnv (auth-config.ts:166-176) replaces only the first occurrence per key and leaves later duplicates carrying stale values, and appends unquoted `KEY=value`. Plan's "replace every duplicate occurrence" and quoting/NUL decisions are load-bearing and correctly targeted |
| Aspire partition literal renderer | partition/render helper refuses PORT only and embeds every other declared value; single rendering authority for service and plugin entries | Confirmed. resolve-resource-environment.ts:59-61 exact-match `PORT` refusal; :108-114 everything else applied; :143 values embedded via JSON.stringify literal; both resource kinds share this helper. Plan extends the refusal set to credential-shaped keys without widening the authority — consistent with existing structure |
| Native Cliffy env prefix semantics | env bindings with prefix provide environment input; same-name CLI options retain precedence | Confirmed against jsr:@cliffy/command@1.2.1 source and its shipped env_var_test: `env(name, desc, { prefix })` reads the named process env var and derives the option property by stripping the prefix; merged options `{ ...ctx.env, ...ctx.flags }` (command.ts) prove flag precedence; shipped tests prove env value lands when the flag is absent and flag wins when passed. Permission check is satisfied: the CLI binary runs `--allow-all`, and generated services already include allow-env in defaults. Caveat for implementer: `findEnvVar` silently skips ungranted env permissions — fine for the CLI, worth a test fixture note |

## POSIX vs Deno parser contract (explicit review)

Empirically probed with a hostile-value fixture (apostrophe, `$(sub)`, backtick, backslash, literal
newline):

- POSIX sourcing decodes the single-quote concatenation exactly: `it's a $(sub) `back` \ back`
  survives as a literal value; multi-line quoted assignment decodes with the embedded newline.
- Deno's direct `--env-file` parser strips the outer single quotes but does **not** decode the
  POSIX concatenation sequence (the `'\''` bridging survives literally), while simple unquoted /
  plainly-quoted values round-trip identically in both readers.

This is precisely the boundary research.md documents ("existing simple credentials and scopes remain
directly parseable"; hostile path is source/export before AppHost) — the plan documents the grammar
limitation instead of promising arbitrary dotenv compatibility, and the risk register demands an
actual sh child exporting a byte-identical environment into Deno as the acceptance gate. Contract
review: sound. The backend reader must additionally accept quoted and plain selector forms, which
plan.md states explicitly.

## Pruning / canonical selector compatibility

- Canonical tracked selector `NetScript.Plugins.auth.Environment` holding only
  `NETSCRIPT_AUTH_BACKEND` is compatible with the generator: the plugin entry is read through
  `Environment ?? Env` (resolve-resource-environment.ts:89), so pruning the plugin `Env` alias while
  writing `Environment` is safe.
- Show order (`.env` → canonical plugin selector → legacy backend fallback) matches the service
  composition read path (backend-registry.ts:117 reads runtime env first, then legacy appsettings
  backend), so unreconciled legacy projects keep working and reconciled projects converge.
- Note for implementation (non-blocking): "removes ... plugin Env alias while preserving unrelated
  fields" must merge unrelated `Env` keys into `Environment` rather than drop them; S1/S2 focused
  reconciliation fixtures should pin that case.

## Open-decision sweep (evaluator-run)

None that force rework. Two advisory notes recorded above: (1) Env-alias merge semantics pinned by
tests, (2) env-permission grant context documented. One slice per named risk holds: credential
migration/hostile values/NUL/multi-line → S1; input safety/generator false positives → S2; docs and
carriers → S3. Relevant open debt `AUTH-BACKEND-ENV-CENTRALIZATION` concerns backend composition and
is not touched or deepened (research.md states this; verified the plan does not alter backend env
construction).

## Verdict

`PASS`

## Notes

- Bounded scope honored: no implementation, no repo-wide gates, no CI, no forensic scans run.
- Plan is committed at the reviewed head; working tree carries only the run artifacts.
- Feature-tier loop policy: max two PLAN-EVAL cycles; a fixable iteration-two issue would be
  edited by the evaluator — not needed this cycle.
- Report contains no operator paths, endpoints, credential values, or usage counts, per brief.
