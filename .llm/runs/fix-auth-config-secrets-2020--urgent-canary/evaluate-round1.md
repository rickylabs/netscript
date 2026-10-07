# IMPL-EVAL — fix-auth-config-secrets-2020--urgent-canary

- Evaluator: independent opencode-go/glm-5.3-flash session, distinct from the gpt-6.1-sol
  generator session; no shared session state. Requested route honored (no fallback). 2026-10-08.
- Exact current HEAD: `be24b5d0fd25afe03520d6a3d878da5c27442a02` (branch
  `fix/auth-config-secrets-2020`), working tree clean at evaluation time.
- Fresh `main` baseline verified: `6f6cbdf030d7595d1730272d0a74aedd66225069` — current HEAD is
  exactly four commits on top (plan `f9fd12ce0`, plan-eval approval `1e3e43b11`, implementation
  `eb2a9f7b4`, docs/carriers `be24b5d0f`).
- PLAN-EVAL record: PASS at `f9fd12ce0` (`.llm/runs/fix-auth-config-secrets-2020--urgent-canary/plan-eval.md`),
  read before evaluation; no implementation preceded it per commit history.

## Scope actually exercised (bounded, per brief)

1. Targeted diff review of the four owned seams only, baseline→HEAD (21 files, +686/−75):
   - `packages/cli/src/public/features/plugins/auth/auth-env.ts` (new): POSIX single-quote literal
     framing, `'\''` bridging, multiline quoted assignment reassembly, NUL rejection before any
     write, duplicate-occurrence replacement, `export`/plain legacy `readAuthEnvBackend` parsing.
   - `packages/cli/src/public/features/plugins/auth/auth-config.ts`: credentials/settings now
     persist to `.env` only; tracked canonical `NetScript.Plugins.auth.Environment` receives only
     `NETSCRIPT_AUTH_BACKEND`; legacy `Auth/auth/backend/Env` namespaces reconciled and pruned;
     unrelated benign string keys merged into canonical `Environment` with backward-compatible
     show fallback (canonical selector → legacy backend). Write ordering puts the `.env`
     reconciliation before the appsettings write, so NUL failure leaves zero files written.
   - `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts`: five native Cliffy
     `.env()` prefix bindings (OAuth secret/key, WorkOS key/password, better-auth secret); flag
     precedence is proved encountering Cliffy's `{...env, ...flags}` merge at runtime.
   - `packages/cli/src/kernel/templates/aspire/helpers/register/resolve-resource-environment.ts`
     (shared classifier `isCredentialEnvironmentKey`): refusal matrix extended to credential-shaped
     keys for both `Environment`/`Env` aliases; credential values never rendered; refused comments
     JSON.stringify-escaped so malformed keys (embedded newlines) cannot break generation; PORT
     refusal and applied plain keys unchanged.
2. Independent focused security suite run (canonical `.llm/tools/run-deno-test.ts` wrapper,
   TAP): the three canonical files — new `auth-config-security_test.ts` (six regressions),
   changed `auth-plugin-command_test.ts`, changed `generators-service-plugin_test.ts` — at exact
   HEAD: **54 passed, 0 failed, 0 ignored** (my independent receipt:
   evidence/C/2020-impl-eval-focused.json; matches the implementer's recorded focused evidence).
   The six regressions cover tracked-credential pruning per provider variant, real POSIX
   `sh` source/export into a real Deno child with hostile values (apostrophe/substitution/backtick/
   backslash/CRLF/newline) with clean stderr, multiline duplicate rewrite with orphan removal and
   byte-pinned exact output, NUL transactional rejection, credential-literal refusal for both
   aliases, and native env-input with flag precedence plus no output leak.
3. Changed existing tests inspected: backend selector assertions updated to quoted form, provider
   tests now forbid tracked credential copies and build the runtime registry from the actual
   `.env` lines, generator expectation corrected to the secret-free `configuredEnvironment`.
4. Mutation controls (not re-run, verified from recorded evidence per brief): tooling
   C-2020-mutations.py mutates one source each for the eight controls, asserts exit 1 with
   assertion failure and explicitly rejects compiler-error red herrings, and restores bytes
   identically in a `finally`; spot-checked hostile/NUL/renderer logs show the filtered test
   failing on assertion, 0 compiler errors.
5. Recorded gate receipts spot-checked (read-only): scoped check/lint/fmt zero findings, full
   affected auth+Aspire-helper suite 300 passed/0 failed/0 ignored restored, publish dry-run and
   quality gates logged, official CI dispatch receipt present.

## Findings

- The security contract holds under independent execution: credentials land only in `.env`
  (POSIX-quoted), tracked files carry only the selector plus merged benign unrelated keys, the
  Aspire partition refuses credential-shaped literals for both aliases, hostile values survive an
  actual shell source/export byte-identically, and no credential value appears in CLI output.
- The flaws named in the PLAN-EVAL seams (first-occurrence-only `.env` replace, unquoted appends,
  duplicate copies in `Auth`+plugin `Environment`, `PORT`-only refusal) are each fixed and each
  pinned by a regression with mutation-red evidence.
- No regressions observed in the affected suite; changed existing tests assert the new safe
  contract rather than merely tolerating it.
- Non-blocking observations (no rework demand, keep as notes): (1) privileged legacy blocks that
  declare both `Environment` and `Env` merge only the preferred spelling; (2) non-string unrelated
  environment values are dropped rather than carried; (3) an unterminated quote in an existing
  `.env` makes reconcile/show fail loudly rather than skip — consistent with the "no arbitrary
  shell parsing" boundary but worth a future fixture if desired; (4) the CLI env-binding test runs
  with real process environment mutation and restores previous values in `finally` — acceptable
  isolation as written.

## Honest verdict

**PASS** for source correctness at exact HEAD `be24b5d0fd25afe03520d6a3d878da5c27442a02`, within
the bounded independent scope defined by the brief (one focused suite + targeted diff + recorded
evidence; no mutant re-run, no broad probes).

Not claimed here: merge readiness — the full one-pass `scaffold.runtime` hosted workflow
(GitHub Actions run 37694325882) is pending and was not waited on or inferred, and the shared
critical advisory audit is owner maintenance separate from this evaluation. Per the run plan the
PR stays draft until those complete; this verdict does not alter that gate.

## Notes

- No source/config/lock edits worktree-side, no branches/worktrees, no CI waiting. The only write
  outside the clone was the evaluator receipt into the provided sibling evidence directory.
- No operator paths, endpoints, credential values, or usage counts in this report, per brief.
