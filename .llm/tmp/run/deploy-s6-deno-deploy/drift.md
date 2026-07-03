# Drift — deploy-s6-deno-deploy (Implement)

Append-only. Records divergence from plan/doctrine discovered during implementation.

## D-IMPL-1 — `secrets`/`rollback` core convention seam is ABSENT (BLOCKING for those two ops)

- **Severity:** significant (cross-slice dependency).
- **Plan expectation:** Locked D4 sets the adapter's `operations` to the full
  `['plan','up','down','status','logs','rollback','secrets']` and routes `secrets`/`rollback`
  through the deploy **core** conventions (R-DEPLOY-3), owned by #339/#340/#341 (PR #364/#341).
- **Reality on branch (95576c44 S0 merge + main):** only the 7-op `DeployTargetPort` type exists.
  There is **no core secrets/rollback convention primitive** anywhere in `packages/cli/src/kernel`
  (grep for `rollback|secrets convention|SecretsConvention|RollbackConvention` returns only the port
  type + its test + unrelated asset templates). The port's own docstring states rollback/secrets
  bodies "land with the deployment hardening slice (#341); until then adapters may declare them
  unsupported (omit the method) rather than provide a silent no-op."
- **Decision (per task guardrail + port doctrine):** do NOT fork the convention adapter-locally
  (that is the R-DEPLOY-3 violation / B1-class error). The DenoDeployTarget declares the subset it
  can genuinely support today — `operations = ['plan','up','down','status','logs']` — and OMITS the
  `rollback`/`secrets` methods, exactly as the port docstring and the S0 `linux-service` test
  precedent prescribe. `rollback`/`secrets` are added when the #341/#364 core convention seam lands;
  the adapter is structured so they slot in by delegation, not re-implementation.
- **Surface:** flagged as a NEEDS-USER / cross-slice blocker in the implementer checkpoint. Does not
  block the marquee `up` path (plan/up/down/status/logs), which is the beta driver (D5).

## D-IMPL-2 — `packages/cli` is excluded from workspace `deno fmt`/`deno lint`

- **Severity:** minor (evidence-path clarification, not a code change).
- Root `deno.json` `fmt.exclude` and `lint.exclude` both list `packages/cli/`; the repo `fmt:check`
  task also excludes it via `^(packages/(cli)|...)`. The scoped wrappers run from the worktree root
  therefore report "No target files found" for cli paths — this is the repo policy, not a failure.
- **Evidence path used instead:** `deno check` (authoritative) + `deno test` for cli, plus a direct
  `deno fmt --check --no-config --line-width=100 --indent-width=2 --options-single-quote` and
  `deno lint --no-config` on the new files to prove default-style conformance. `packages/config` IS
  fmt/lint-gated and uses the wrappers normally.
- **S4 addendum (`no-explicit-any`):** `deno lint --no-config` on the new `deno-deploy-command.ts`
  reports `no-explicit-any` for the cliffy `Command<any, …>` generics. These are the repo-standard,
  explicitly-accepted "top-level router any" (see MEMORY: only 2 accepted casts + the router `any`);
  every command in `packages/cli/src/public/features/**` uses the identical signature. cli is
  lint-excluded, so this is not a new soundness debt and not a gate failure. Business logic uses no
  `any` (flag marshalling narrows from `unknown`).

## D-IMPL-3 — unstable-API preflight guard is best-effort (not full graph walk)

- **Severity:** minor (documented bound, recorded in arch-debt).
- The `DenoDeployPreflightReader` feeds the pure guard with `deno.json` + the entrypoint (and
  `src/<entrypoint>`), not the full transitive module graph. A violation reached only through a deep
  import is not detected. This is an intentional cost/scope bound for S6; recorded under
  `cli-deploy-artifacts-missing` in arch-debt as remaining work. The guard is advisory on preview
  pushes and blocking only on `up --prod`.

## D-IMPL-4 — `deno deploy delete/show` subcommand surface assumption

- **Severity:** minor (upstream-CLI-shape assumption, isolated).
- The argv builders map `down`→`deno deploy delete` and `status`→`deno deploy show`. The non-`deploy`
  subcommand surface of the native `deno deploy` CLI is still stabilizing; the builders are isolated
  (`buildDeleteArgs`/`buildStatusArgs`) so a rename is a one-file edit. Verified argv shape by unit
  test, not against a live platform account (no credentials in this environment — D5 NEEDS-USER).
