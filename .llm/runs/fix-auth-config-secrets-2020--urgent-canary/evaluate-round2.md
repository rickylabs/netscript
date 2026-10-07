# IMPL-EVAL — fix-auth-config-secrets-2020--urgent-canary (final, round 2)

- Evaluator: same independent opencode-go/glm-5.3-flash session that produced the round-1 source
  evaluation, retained across the correction per run contract; distinct from the gpt-6.1-sol
  generator session. Requested route honored (no fallback). Final pass 2026-10-08.
- Exact corrected HEAD: `21260e740b928b5bd825e251e752a2ea58939cf6` (branch
  `fix/auth-config-secrets-2020`), working tree clean. One correction commit on top of round-1
  HEAD `be24b5d0fd25afe03520d6a3d878da5c27442a02` (`21260e740 test(auth): check secret-free
  configuration in scaffold runtime`, 3 files, +102/−2; slice bound intact). Fresh `main` baseline
  remains `6f6cbdf030d7595d1730272d0a74aedd66225069` (five commits total on top).
- Round-1 source PASS retained verbatim as `evaluate-round1.md` (independent focused 54-test
  observation at `be24b5d0f…`, restored 300-test suite, eight mutation controls with
  assertion-red/proof/byte-identical restore, scoped check/lint/fmt receipts — unchanged and not
  re-run, per contract). Direct GitHub URL: the hosted runtime dispatch receipts below.

## Round-2 correction review (the only new observation)

Diff `be24b5d0f…`→HEAD contains exactly: `packages/cli/e2e/src/application/gates/scaffold/runtime/runtime-scripts.ts`
plus this run directory's `evaluate-round1.md`/`worklog.md`. All auth runtime sources, the six
security regressions, and generated carriers are byte-untouched — the round-1 source PASS therefore
stands at the corrected head without re-execution.

`packages/cli/e2e/src/application/gates/scaffold/runtime/runtime-scripts.ts` — `AUTH_SMOKE_ENV_SCRIPT`
(the fixture consumed by `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` for the
hosted runtime smoke that failed both tiers) updated to the implemented contract and nothing else:

1. Canonical plugin backend selector replaces the obsolete tracked `Auth.Backend` assertion:
   `NetScript.Plugins.auth.NETSCRIPT_AUTH_BACKEND === "kv-oauth"`.
2. New tracked-credential guard: rejects any `Auth.Environment` or
   `NETSCRIPT_AUTH_CLIENT_SECRET` reachable in tracked appsettings — pins "old leakage not
   retained".
3. Actual native loader child: `deno eval --env-file=<projectRoot>/.env` after CLI provider set,
   asserted successful, printing only provider id and boolean presence metadata for
   `NETSCRIPT_AUTH_CLIENT_SECRET` / `NETSCRIPT_AUTH_KV_OAUTH_KEY` — boot proven through the real
   documented `.env` consumer with no credential values emitted. Hostile-value round-trip remains
   the unit-level POSIX `sh` child regression, confirming the documented source/export boundary
   stays where research/plan put it.

In-scope per contract: consumer assertions only; no new tests, no auth implementation changes,
no fixture dependencies beyond the existing smoke path.

Independent verification performed this round (bounded, one command pair):
- Emitted script inspection: sibling `../tmp/C-auth-smoke-env.ts` matches the source array
  statement-for-statement (canonical selector, credential-copy guard, native loader child).
- Targeted type/syntax check of both touched files exits 0 (` EXIT-scripts=0`, `EXIT-emitted=0`),
  corroborating the recorded check receipts.
- Carrier freshness proven by my own git observation, not only receipts: the diff adds/changes no
  generated carrier files and `git status` is clean — the recorded generation/publish-asset
  regeneration runs left carriers byte-identical.

Not re-run (per contract): full runtime suite execution, mutation controls, broader CLI gates,
docs generation — all retain round-1 receipts, none blocked by this diff.

## Verdict

**PASS** for source correctness at exact corrected HEAD
`21260e740b928b5bd825e251e752a2ea58939cf6`: round-1 retained PASS (auth implementation and six
security regressions untouched) + correction reviewed as in-scope consumer-assertion fix with
receipts independently corroborated.

Not claimed, explicitly:

1. Pending hosted full `scaffold.runtime` one-pass workflow 37695503306 (corrected dispatch).
   Not waited on and not inferred from the failed predecessor run 37694325882; merge readiness
   stays gated on its green result.
2. Shared critical audit blocker: recorded actual exit 1 during this run
   (`2020-audit-critical=1`). Owner maintenance, outside evaluator authority, and distinct from
   source correctness; resolves only through the owner path already recorded for it.

Per the run plan the PR stays draft until pending hosted runtime passes and the owner resolves the
critical audit; this verdict does not alter draft or publication status. No source edits, no
publication, no CI polling performed in this final pass.

## Notes

- All locations above are repo-relative; hosted-runtime links are official GitHub URLs; this
  report intentionally contains no operator paths, endpoints, or credential values.
- No labels/PR state changed in this pass (no push or PR edit performed).
