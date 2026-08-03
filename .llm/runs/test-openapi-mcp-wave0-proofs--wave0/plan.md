# Plan: OMB wave-0 proofs

## Run Metadata

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Run ID         | `test-openapi-mcp-wave0-proofs--wave0`               |
| Branch         | `test/openapi-mcp-wave0-proofs`                      |
| Phase          | `implementation`                                     |
| Target         | Wave-0 proof / measurement artifacts for #1127–#1129 |
| Archetype      | N/A — no published-surface change                    |
| Scope overlays | service                                              |

## Archetype

N/A. This is a proof/measurement slice. It exercises generated CLI/service/Aspire output but owns
only committed run artifacts and the RFC decision record. Any required product or published-surface
change is a rescope to S7 (#1133) or another later wave.

## Current Doctrine Verdict

Read-only context: `@netscript/aspire` is Archetype 2 / Keep, `@netscript/service` is Archetype 4 /
Refactor, and `@netscript/cli` is Archetype 6 / Restructure. This PR does not remediate or widen any
of those surfaces.

## Axioms in Play

| Axiom | Why it matters                                                                                |
| ----- | --------------------------------------------------------------------------------------------- |
| A1    | The proof records the endpoint manifest and discovery/error shapes before productization.     |
| A6    | Disposable measurement helpers must have one explicit experimental purpose.                   |
| A7    | The experiment uses `fetch`, `URL`, Web Crypto, and atomic Deno file operations directly.     |
| A13   | A missing spec and an unavailable lifecycle seam are explicit failures, not silent fallbacks. |
| A14   | Measured runtime evidence, not plausible source inspection, determines each verdict.          |

## Goal

Produce three empirical, committed Wave-0 verdicts at the RFC-authoritative paths:
`proofs/P1-verdict.md`, `proofs/P2-verdict.md`, and `proofs/P3-verdict.md` inside this run. P1 must
select F1(a) or F1(b); P2 must quantify the real DB and no-DB scaffold surfaces against current MCP
truncation; P3 must ratify the exact `spec_unavailable` wording from a real auth-guarded fixture.

## Scope

- Scaffold two local-source scratch applications: one SQLite-backed, one `--db none`.
- Run at most one owned AppHost at a time and collect endpoint/spec/log evidence.
- Commit narrowly scoped experiment programs and normalized, credential-free evidence under
  `proofs/experiments/` and `proofs/evidence/`.
- Commit P1/P2/P3 verdicts, including an explicit FAIL when evidence does not meet a proof bar.
- Update the seed RFC's §9 F1 record and GitHub RFC #1123 plus epic #1126 after P1 arbitrates F1.
- Maintain harness, draft-PR, review, and evaluator evidence for every slice.

## Non-Scope

- No changes under `packages/**`, `plugins/**`, generated templates, or published exports.
- No production endpoint-discovery implementation, MCP server, auth policy change, or truncation
  redesign; those belong to #1133 and later RFC waves.
- No `deno task e2e:cli`; merge-readiness is the orchestrator's decision.
- No mutation of foreign AppHosts, containers, ports, worktrees, caches, or lock files.

## Hidden Scope

- Normalize endpoint identity against both Aspire's allocated-endpoint view and a successful live
  HTTP request; a plausible callback without those checks cannot pass P1.
- Measure both the discovery row and each schema-view payload, including source and locally
  dereferenced representations, because the current MCP truncator has per-array/per-string limits
  but no whole-result byte cap.
- Inspect operation-level non-success responses and component schemas rather than treating one
  example error as proof of a common envelope.
- Verify process-tree death and ownership after every AppHost; exit-code success alone is not stop
  evidence.
- Treat `NOT_RUN`, missing evidence, or a skipped branch as FAIL in a proof verdict and in
  summaries.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                                                                           | Rationale                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| D1  | The authoritative verdict paths are `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P{1,2,3}-verdict.md`.                                                                                                                                                                                                                                                                   | RFC §4 places proof artifacts in the implementing run.                                                      |
| D2  | Supporting committed material lives only below that run's `proofs/experiments/` and `proofs/evidence/`; disposable scaffolds live below `.llm/tmp/openapi-mcp-wave0-proofs/`.                                                                                                                                                                                                      | Keeps proof logic auditable without leaking experiment code into product templates.                         |
| D3  | Use a local-source SQLite scaffold for P1/P2, stop it with verified process-tree death, then use a local-source no-DB scaffold for P2. Never run both AppHosts concurrently.                                                                                                                                                                                                       | Covers both required P2 shapes and respects shared-host ownership.                                          |
| D4  | P1 tests `onResourceEndpointsAllocated` and awaits `EndpointReference.getValueAsync()` for every generated service. It writes an atomic temp-then-rename manifest with schema version, real project root, per-run UUID, timestamp, service identity, and allocated URL.                                                                                                            | This is the documented post-allocation seam and the RFC identity-binding contract.                          |
| D5  | P1 PASS requires the committed manifest to agree with the same owned run's Aspire description and successful live request, with non-zero allocated ports and complete service identity. Otherwise P1 is explicit FAIL.                                                                                                                                                             | Source availability is not lifecycle proof.                                                                 |
| D6  | P1 PASS selects F1(a); P1 FAIL, including skipped or incomplete execution, selects F1(b). The selected outcome is written to the verdict, local RFC §9, RFC issue #1123, and epic #1126.                                                                                                                                                                                           | Implements RFC §9's proof-arbitrated fork without a false-green state.                                      |
| D7  | P2 records total live-spec bytes; operationId values/shapes; discovery-row bytes; each request, response, error, and all-schema view's source and dereferenced bytes; non-2xx response schemas/envelopes; and recursively observed OpenAPI/JSON-Schema keywords for both scaffolds.                                                                                                | Directly answers #1128 and exposes both per-item truncation and aggregate-size risk.                        |
| D8  | P2 compares arrays and strings to the current `maxItems=50` and `maxStringLength=2000` implementation and explicitly reports that there is no whole-result byte ceiling.                                                                                                                                                                                                           | Avoids implying protection the runner does not provide.                                                     |
| D9  | P3 reruns the existing auth fixture and records the observed 401, 403, and 200 envelopes. The ratified text is: `spec_unavailable: OpenAPI document could not be fetched. The spec route may require authentication; allow anonymous access to the OpenAPI route (for NetScript auth, add /api/openapi.json to auth.authn.allowAnonymous) or provide a reachable public spec URL.` | Names both the likely cause and the concrete NetScript corrective exemption without changing auth behavior. |
| D10 | All raw evidence is normalized to omit credentials, absolute foreign paths, and volatile process noise; verdicts cite commands, timestamps, versions, and evidence paths.                                                                                                                                                                                                          | Makes results reproducible and safe to commit.                                                              |
| D11 | A separate Codex implementation thread executes slices; a separate Fable review checks each slice; this supervisor alone signs, commits, pushes, and comments. Formal PLAN/IMPL evaluation uses separate Qwen sessions.                                                                                                                                                            | Preserves harness generator/reviewer/evaluator separation.                                                  |
| D12 | Product changes, failed scaffolding caused by product defects, or a need to relax the evidence bar trigger `FAIL_RESCOPE`; they are not repaired inside this PR.                                                                                                                                                                                                                   | The user explicitly bounded this to proof/measurement work.                                                 |

## Open-Decision Sweep

| Decision                                                 | Status                 | Notes                                                                                                  |
| -------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Whether the real allocation callback satisfies P1        | must resolve now by P1 | The result is deliberately not pre-decided; the locked pass/fail bar removes implementation ambiguity. |
| Exact operation/schema sizes and observed keyword subset | must resolve now by P2 | The committed measurement schema is locked; values come only from live scaffold specs.                 |
| Exact current auth-guarded responses                     | must resolve now by P3 | Expected 401/403/200 shapes are re-measured rather than copied from source.                            |
| Production manifest/template implementation              | safe to defer          | S7 (#1133), after F1 arbitration.                                                                      |
| MCP row/schema projection and truncation redesign        | safe to defer          | Wave 1+ RFC implementation issues.                                                                     |
| Production authenticated-spec support                    | safe to defer          | Wave 4 after the P3 wording is ratified.                                                               |

All decisions that would change these proof artifacts or force experimental rework are resolved by
D1–D12. The three empirical values remain proof outputs, not deferred design choices.

## Risk Register

| Risk                                                        | Mitigation                                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared host contains foreign Aspire/container resources.    | Inventory first; use explicit owned paths/PIDs; never stop by name/pattern; run leak reporter with the exact run/worktree and owned scratch root.                                                 |
| Aspire stop reports success while descendants live.         | Capture the owned process tree, request exact-target stop, and prove every owned PID/port is gone before the next scaffold.                                                                       |
| Per-resource callbacks race and publish a partial manifest. | Closure tracks the full expected service set; write only after all allocated endpoint values resolve; atomic rename the complete sorted payload.                                                  |
| Allocated hosts differ (`localhost`, IPv4, IPv6, wildcard). | Compare normalized URLs/ports and separately prove a live request; preserve raw allocated URLs in evidence.                                                                                       |
| Scaffold or Aspire commands create lock/source churn.       | Snapshot status and `deno.lock`; use documented CLI flags; reject/restore only slice-owned scratch, never mutate caches or lock files.                                                            |
| P2 measurement accidentally counts presentation formatting. | Define UTF-8 byte length of canonical compact JSON for every measured object/string and record the measurement tool version.                                                                      |
| Local dereferencing loops or crosses external `$ref`s.      | Resolve only local document refs with cycle detection; report unresolved/external refs rather than fetching them.                                                                                 |
| Error-envelope presence is inferred from one template.      | Enumerate every operation's non-2xx responses for both DB and no-DB specs and report absent as well as present.                                                                                   |
| A skipped command is summarized as success.                 | Verdict schema permits only PASS/FAIL; `NOT_RUN`, incomplete, timeout, or missing evidence maps to FAIL.                                                                                          |
| P3 wording overpromises a universal fix.                    | Name NetScript's exact exemption as a parenthetical and retain the generic public/reachable alternative.                                                                                          |
| Formal evaluator route lacks inherited credentials.         | Use only the documented `$HOME/.config/netscript-agentic/openrouter.env` assignment parser to populate the isolated child environment; if live canary still fails, stop and record blocked drift. |

## Anti-Patterns to Resolve or Avoid

| AP                              | Status | Plan                                                                                              |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| AP-1 / large files              | risk   | Keep each experiment single-purpose and review size; no product file changes.                     |
| AP-2 / generic helpers          | risk   | Name experiments by proof and use platform primitives directly.                                   |
| AP-10 / swallowed errors        | risk   | Record command exit, timeout, missing evidence, and runtime response as explicit FAIL conditions. |
| AP-20 / hidden runtime coupling | risk   | Bind endpoint evidence to real project root, run UUID, resource identity, and allocated port.     |

## Fitness Gates

The archetype F-* matrix is N/A because no package/plugin source or published surface changes. The
service overlay still requires the following manual/runtime fitness evidence.

| Gate                   | Required | Expected evidence                                                                                |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| Contract check         | yes      | P2 measurement validates each live OpenAPI document and records malformed/unresolved refs.       |
| Service check          | yes      | Scoped Deno check/lint/fmt for committed experiment TypeScript.                                  |
| Runtime health         | yes      | Owned Aspire resource status, allocated endpoint, HTTP response, and verified teardown evidence. |
| Trace/log review       | yes      | Owned AppHost/service logs checked for startup/request failures and hidden retries.              |
| Consumer check         | yes      | The generated live spec is fetched and projected by the committed measurement experiment.        |
| Release gate / CLI E2E | no       | No scaffold/template product change; user explicitly prohibits `deno task e2e:cli`.              |

## Arch-Debt Implications

| Entry                            | Action | Notes                                                                     |
| -------------------------------- | ------ | ------------------------------------------------------------------------- |
| `.llm/harness/debt/arch-debt.md` | none   | Measurement work creates no doctrine debt; product defects cause rescope. |

## Validation Plan

| Order | Gate             | Command or check                                                                                                           | Expected result                                                                       |
| ----- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1     | Plan-Gate        | Separate Qwen PLAN-EVAL using `claude-openrouter` / `claude-print`                                                         | `plan-eval.md` says `PASS` before any experiment file exists.                         |
| 2     | P1 runtime       | Serialized owned SQLite scaffold/AppHost; callback manifest; Aspire description; live fetch; logs                          | Verdict PASS/F1(a) or evidence-backed FAIL/F1(b); never NOT_RUN-as-pass.              |
| 3     | P1 hygiene       | Exact owned process/port teardown check                                                                                    | No owned descendants/listeners remain; foreign resources unchanged.                   |
| 4     | P2 measurement   | `deno run --no-lock --allow-read --allow-net <run>/proofs/experiments/p2-measure-spec.ts ...` against each owned live spec | Stable JSON evidence for DB and no-DB operation/schema/error/keyword measurements.    |
| 5     | P3 fixture       | Targeted existing auth test filter in `packages/service/tests/auth/define-service-auth_test.ts`                            | Observed 401/403/200 behavior matches committed evidence or verdict explicitly FAILs. |
| 6     | Static check     | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <run>/proofs --ext ts,tsx`                          | PASS for touched experiment source.                                                   |
| 7     | Static lint      | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <run>/proofs --ext ts,tsx`                           | PASS; no new lint ignores.                                                            |
| 8     | Static format    | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root <run> --ext ts,tsx,md`                                | PASS for owned run artifacts.                                                         |
| 9     | Lock/status      | Raw `git diff --exit-code origin/main -- deno.lock` plus owned-path diff review                                            | No `deno.lock`, package, plugin, or unrelated churn.                                  |
| 10    | Resource hygiene | `deno task agentic:leak-check -- --slice-dir <run> --worktree <worktree> --owned-root <scratch-root>`                      | No unreviewed owned leaks; foreign entries remain untouched.                          |
| 11    | Slice review     | Separate Fable review after every proof slice                                                                              | No unanswered blocking finding before supervisor sign-off commit.                     |
| 12    | IMPL-EVAL        | Separate new Qwen session follows evaluator protocol                                                                       | `evaluate.md` supplies a merge-eligible harness verdict.                              |

## Dependencies

- Deno 2.9.3, .NET SDK 10.0.110, Aspire CLI 13.4.6, Docker, current local-source NetScript CLI.
- Existing foreign resources are an environmental constraint, not a dependency.
- GitHub issue/RFC/epic edits occur only after corresponding committed evidence exists.

## Drift Watch

- Aspire callback signature or allocated endpoint value differs from current documentation.
- Scaffold layout, operationId convention, schema/error shape, or truncation constants differ from
  the re-baseline.
- Any proof needs product source changes or a second concurrent AppHost.
- Any planned gate cannot run, is skipped, or leaves owned resources alive.
- Formal evaluator/provider/reviewer lane is unavailable or differs from `supervisor.md`.
