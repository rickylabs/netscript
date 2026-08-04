# Ordinary slice review — S1 (F4a introspection-receipt evidence gate, #1136)

| Field | Value |
| --- | --- |
| Run | `feat-openapi-mcp-evidence-receipts-s10--1136` |
| Slice | S1 |
| Author lane | Codex (WSL implementation) |
| Reviewer | Claude Opus 5 — local opposite-family ordinary review (`netscript-harness` SKILL.md:141-143) |
| Date | 2026-08-04 |
| Diff under review | uncommitted working tree vs `HEAD` (`1282ee551`) |

## Verdict

PASS

Findings F1–F4 below are non-blocking. F1 and the worklog gap in "Pre-sign-off requirements" must be
actioned or explicitly recorded before the sign-off commit; neither invalidates the slice.

## Scope of diff

3 files, +127 / −1:

- `packages/mcp/src/application/flows/record-drift-flow.ts` — one template-literal line inside
  `diagnosticEvidenceRefusal()`.
- `packages/mcp/tests/drift-evidence_test.ts` — 1 assertion + 2 tests (+125).
- `deno.lock` — 1 added line, unowned (see "deno.lock isolation").

## Review dimensions

### Correctness — PASS

The only production change is the refusal string. `recordDrift()` gate logic
(`record-drift-flow.ts:30-43`) is untouched and remains command-agnostic, which is what makes F4a
true structurally rather than by a new branch.

**Acceptance path verified.** `a public introspection receipt satisfies the shared drift gate` drives
the shipped composition — `createMcpCliServer()` → JSON-RPC `tools/call` `list_api_services` → green
receipt (`resource: 'project'`, `command: 'mcp list_api_services'`, `exitStatus: 0`) → JSON-RPC
`record_drift` accepted, with the drift entry embedding `mcp list_api_services`. No receipt is hand-
written by the test; every write originates from a tool call. D2 satisfied.

**The obvious way this design could be wrong is closed.** `record_drift` is deliberately *not* wrapped
in `withReceipt` (`cli.ts:213`, unlike every neighbouring registration), so a `record_drift` call
cannot mint the evidence that authorizes it. I checked this explicitly because a single-slot receipt
store plus a self-wrapped mutator would let the second `record_drift` of a session always succeed.

**S8 ordering — PASS.** Read `mcp-server.ts:107-148` directly rather than trusting `research.md`.
Success settles only at line 143, after `validateSchema(outputSchema, execution.value)`,
`truncateResult`, and a second `validateSchema` on the bounded value. Every failure edge — flow throw
(111), explicit `!execution.ok` (118), and output-validation/byte-limit rejection (131) — settles a
failed receipt *before* returning the protocol error. The negative test exercises edge 131 through the
real `ResultByteLimitError` path: the flow succeeds, bounding rejects, the green receipt for
`catalog` is replaced with `exitStatus: 1`, and the following `record_drift` for `catalog` refuses
with `diagnostic_evidence_required`. That is exactly issue #1136's single acceptance checkbox — "a
pre-validation-style receipt cannot be produced by the shipped path" — and a pre-validation
implementation would fail this test rather than pass it silently.

Resource derivation is correct for the negative: `withReceipt` (`cli.ts:244-248`) falls back to
`record.service`, so `get_operation_schema {service: 'catalog'}` settles under `catalog`, the same key
`record_drift` then reads.

### Public-surface negative proof — PASS

- No export-bearing surface changed. `packages/mcp/deno.json` (3 entrypoints), `mod.ts`, and `cli.ts`
  are untouched; the sole production edit is inside a function body, so no exported signature moves.
  D7 satisfied by construction, not by assertion.
- The negative genuinely runs on public ports: `ServiceEndpointDirectoryPort` is imported from
  `../mod.ts` and is a real public export (`mod.ts:171`, also re-exported via `cli.ts:77`). No receipt
  lifecycle internal is imported to build the negative. D3 satisfied.
- The one internal deep import in the file — `withFlowReceipt` from
  `src/application/runner/receipt-lifecycle.ts` (line 8) — is **pre-existing at HEAD** and not added,
  extended, or relied upon by either new test.
- `deno publish --dry-run --allow-dirty` → `Success Dry run complete`; no slow types; file set
  unchanged.

### F4a vs F4b scope — PASS

The diff adds no command allowlist, no `evidenceKind` enum, no per-operation receipt key, no receipt
schema, and no filesystem-layout change. `DiagnosticEvidenceReceipt` and the one-receipt-per-resource
store are byte-identical to HEAD. D1 and D6 hold; F4b remains unbuilt rather than half-built, which is
the correct outcome given RFC #1123 §9 defers it a field wave.

### Doctrine fit — PASS

- `deno task quality:scan` → `{"ok":true,...,"findings":[]}` (7 pre-existing allowances, none in
  `packages/mcp`).
- `deno task arch:check` → exit 0, zero `FAIL=` rows repo-wide. `packages/mcp` has no census block,
  consistent with `research.md`'s note that the doctrine census predates the package; open debt
  `MCP-A6-V2-SHAPE` is neither closed nor deepened by a string change.
- No new production abstraction, port, adapter, folder, side effect, or dependency. AP-1/AP-2/AP-8
  exposure is nil.

### No lint ignores or casts — PASS

- No `// deno-lint-ignore`, `@ts-expect-error`, `as any`, or `as unknown as` anywhere in the diff.
- The `as { code?: string }` / `as { recorded?: boolean }` narrowings of `structuredContent` and the
  `entries[0]!` index assertion are the file's established HEAD idiom (lines 92, 123, 161, 247 and 75
  respectively, all pre-existing) and are the ordinary way to read an untyped JSON-RPC payload under
  `noUncheckedIndexedAccess`. They are not new-cast debt introduced to green a wrapper.
- `deno lint` (98 files) clean; `deno fmt --check` on both changed files clean; `deno check
  --unstable-kv mod.ts cli.ts openapi-projection.ts tests/drift-evidence_test.ts` clean.

Note: the scoped wrappers `.llm/tools/run-deno-lint.ts` / `run-deno-fmt.ts` both abort with
`Failed to parse "workspace" configuration ... invalid type: string "packages/*"` — a pre-existing
tooling fault unrelated to this slice (it reproduces with no diff applied). I fell back to direct
package-scoped `deno lint` / `deno fmt --check` on the package and the two changed files. Flagging so
the supervisor does not record wrapper output that cannot currently be produced.

### deno.lock isolation — PASS, conditional on staging

The single added line is `jsr:@netscript/queue@0.0.4` under the **`plugins/sagas`** dependency block —
not `packages/mcp`. It traces to HEAD commit `f7bcf77f0 fix(sagas)`: `plugins/sagas/deno.json:29`
already declares `@netscript/queue` and `plugins/sagas/src/runtime/saga-delivery.ts:1` imports
`createQueue`, so the lock is simply catching up to committed source. Unrelated to this slice, matches
`drift.md`'s pre-existing-lockfile entry, and `git diff --numstat` confirms `1 0 deno.lock`.

**Condition:** the S1 commit must stage the two owned paths explicitly. `git commit -a` or `git add .`
would sweep this line in and violate the plan's hygiene row and deferred scope.

## Findings

**F1 — minor, non-blocking. Published receipt guidance still omits the introspection evidence class.**

D5 changed the refusal text on the rationale that "F4a is incomplete if the gate accepts evidence that
its recovery text hides." The same rationale applies verbatim to the two places that document which
tools produce receipts, and both still list only three:

- `packages/mcp/README.md:173` — "Receipts are automatically produced when calling `doctor`, telemetry
  tools, or `netscript plugin doctor --resource <resource>`."
- `docs/site/reference/mcp/index.md:96` — "Diagnostic receipts are automatically produced by `doctor`,
  telemetry tools, or `netscript plugin doctor --resource <resource>`."

The gap pre-dates this slice (S8 already wrapped the three introspection tools), and it is outside
#1136's single acceptance checkbox, so it does not block. But #1136 is the issue that makes
introspection-as-evidence explicit, and shipping the refusal-text half while leaving both published
lists stale means an agent reading the docs still will not know an introspection call authorizes
`record_drift`.

Asymmetry worth the supervisor's attention: `docs/site/reference/mcp/index.md` is hand-authored (Lume
front matter, not generated) and can be fixed here at zero generated-asset cost. `README.md` cannot —
it is embedded verbatim in `packages/mcp/src/publish-assets.generated.ts` and would require
`.llm/tools/generate-publish-assets.ts`, which the plan's deferred scope explicitly excludes ("Any
dependency, version, generated asset, or `deno.lock` change").

Recommendation: update the site doc in this slice; record the README + generated-asset regeneration as
an explicit deferral in `drift.md` rather than leaving it undocumented.

**F2 — nit. Refusal message reads awkwardly.**

`record-drift-flow.ts:19-21` now produces `... call the MCP "doctor" or telemetry tools or API
introspection tools for resource "x"` — a double `or` where a comma series would read better. Note the
constraint before changing it: `drift-evidence_test.ts:34` pins the substring `MCP "doctor" or
telemetry tools`, so a reflow must update that assertion too. Cosmetic; no action required.

**F3 — observation, no action.** The negative overlaps two pre-existing tests (`invalid MCP tool
output replaces stale green evidence...`, `throwing MCP tool flow replaces stale green evidence...`)
which already cover post-validation settlement — but via injected internal flows. #1136 explicitly
demands the public-surface variant, so the new test earns its place. The 4,000-property fixture costs
39ms; not a runtime concern.

**F4 — minor, forward-looking. The `MemoryEvidence` double is resource-blind.**

`MemoryEvidence.read()` (test file line 13, pre-existing helper) ignores its `resource` argument and
returns a single slot. Both new tests therefore cannot observe a resource-keying regression: if
`withReceipt`'s derivation broke and wrote under `project` instead of `catalog`, `read('catalog')`
would still hand back the receipt. The specific claims here still hold because both tests assert
`receipt.resource` directly, and real keying is covered by `an actual MCP doctor call writes a
diagnostic receipt` against `FilesystemDiagnosticEvidence`. No action for F4a — but this helper will
silently pass key-collision bugs, which is precisely the failure mode F4b's
`(resource, evidenceKind, operation)` keys introduce. The F4b slice should key the double before
relying on it.

## Pre-sign-off requirements (supervisor, not code)

1. `worklog.md` still reads "Gate results: Pending S1 implementation" and "Reconcile notes: S0 pending
   commit/push/PR opening". S1 gate evidence must be recorded before the sign-off commit.
2. Stage only `packages/mcp/src/application/flows/record-drift-flow.ts`,
   `packages/mcp/tests/drift-evidence_test.ts`, and run artifacts. Leave `deno.lock` unstaged.
3. Action F1 (site doc now; README/generated-asset deferral recorded in `drift.md`).

## Evidence

All commands run read-only from the repo root or `packages/mcp`; no production code or test was
edited by this review.

| Gate | Command | Result |
| --- | --- | --- |
| Focused F4a | `deno test --allow-env --allow-net --allow-run --allow-read --allow-write tests/drift-evidence_test.ts` | `ok \| 11 passed \| 0 failed (101ms)`; both new tests pass — `a public introspection receipt satisfies the shared drift gate` (940µs), `a public introspection output rejection cannot leave green evidence` (39ms) |
| Regression | `deno task test` (packages/mcp) | `ok \| 109 passed \| 0 failed (3s)` |
| Type check | `deno check --unstable-kv mod.ts cli.ts openapi-projection.ts tests/drift-evidence_test.ts` | clean, 4 files |
| Lint | `deno lint` (packages/mcp) | `Checked 98 files`, 0 problems |
| Format | `deno fmt --check` on both changed files | `Checked 2 files`, 0 diffs |
| Quality | `deno task quality:scan` | `{"ok":true,"findings":[]}`, 7 pre-existing allowances, none in `packages/mcp` |
| Doctrine | `deno task arch:check` | exit 0; zero `FAIL=` rows repo-wide |
| JSR surface | `deno publish --dry-run --allow-dirty` | `Success Dry run complete`; no slow types |
| S8 ordering | read `src/application/runner/mcp-server.ts:107-148` | success settles at 143 after both `validateSchema` calls and `truncateResult`; failures settle at 111 / 118 / 131 before the error return |
| Self-authorization | read `cli.ts:150-232` | `record_drift` (213) is the only registration not wrapped in `withReceipt` |
| Public port | `mod.ts:171`, `cli.ts:77` | `ServiceEndpointDirectoryPort` is a real public export |
| Lock provenance | `git diff --numstat -- deno.lock`; `plugins/sagas/deno.json:29`; `plugins/sagas/src/runtime/saga-delivery.ts:1` | `1 0 deno.lock`; added line is `plugins/sagas` → `jsr:@netscript/queue@0.0.4`, already declared and imported at HEAD |
| Issue scope | `gh issue view 1136` | single acceptance checkbox (gate + no pre-validation receipt from the shipped path); F4b explicitly deferred |
| Wrapper fault | `.llm/tools/run-deno-lint.ts` / `run-deno-fmt.ts --root packages/mcp` | both abort: `Failed to parse "workspace" configuration ... invalid type: string "packages/*"` — pre-existing, unrelated to this diff |
