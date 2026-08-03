CHANGES_REQUESTED

# S2 opposite-family review — P2 no-DB measurement and DB failure

- Reviewer: Claude Fable 5, separate native session (advisory `review_codex` slice review, not
  IMPL-EVAL).
- Scope: stable uncommitted S2 diff only. This session edited no implementation/evidence file, ran
  no AppHost or scaffold, and contacted no GitHub surface. One read-only verification command was
  run against the already-existing scratch copy of the fetched spec
  (`.llm/tmp/openapi-mcp-wave0-proofs/p2-no-db-live-spec.json`); nothing was mutated.
- Inputs read: `plan.md` (D3/D7/D8/D10/D12), `plan-eval.md`, seed `rfc.md` §4/§9,
  `research.md` (#1127–#1129/#1123 re-baseline), `briefs/S2-no-db-rescope.md`,
  `reviews/S1-fable-rereview.md` (APPROVED), `proofs/P2-verdict.md`,
  `proofs/experiments/p2-measure-live-spec.ts`, `proofs/evidence/P2-no-db.json`,
  `proofs/evidence/P2-db-failure.json`, `proofs/evidence/P2-runtime.json`,
  `proofs/evidence/P2-attempts.md`, `proofs/evidence/P1-runtime.json` (carried DB failure),
  `worklog.md`, `context-pack.md`, `drift.md`, and
  `packages/mcp/src/application/runner/truncation.ts`.

## Verdict-shape determination

**The explicit combined P2 `FAIL` is the only truthful D7/D12 outcome.** D7 requires measured
evidence for *both* the DB and no-DB scaffolds. The DB branch has no attributable live spec: the
generated SQLite service exited 1 for lack of `--allow-ffi` (attributed in `P1-runtime.json`), the
supervisor's brief forbade rerunning/patching/wrapping it, and the unattributed P1 HTTP 200 is
explicitly excluded (`P2-db-failure.json:17`, `P2-attempts.md:16-17`). A partial PASS would launder
a missing required branch; `NOT_RUN` is barred by the plan's skip-as-FAIL rule and RFC §4 S-17
("a skipped proof must be indistinguishable from a failed one, not from a passed one"). The verdict
correctly issues neither a #1128-acceptance claim nor an IMPL-EVAL disposition.

## Confirmed sound (adversarially checked)

- **No P1-200 reuse.** The DB-side carry-forward is only the normalized failure record; the
  ambiguous P1 HTTP 200 is expressly excluded in `P2-db-failure.json`, `P2-attempts.md`, and the
  verdict.
- **Attribution of the no-DB spec.** One owned fresh scaffold; pre-fetch Aspire state
  `Running`/`Healthy` at `http://localhost:43127`; the port-43127 listener bound to DCP proxy
  PID 80298 inside the captured owned tree (CLI 79779 → AppHost 79849 → service 80461); baseline
  showed no pre-existing 43127 listener; fetch timestamp (21:20:47Z) precedes measurement
  (21:21:55Z) and capture (21:22:04Z). This satisfies the attribution bar S1's M1 established. The
  two failed detached starts produced no fetch and are preserved, not smoothed over.
- **Measured, not inferred (byte/limit claims).** I recomputed independently: the compact-UTF-8
  spec byte count (3657) and SHA-256 (`8f8cf105…`) of the retained raw spec match both
  `P2-runtime.json` and `P2-no-db.json`; the `v1.health.list` discovery row is exactly 73 compact
  bytes by hand count. Source and locally dereferenced views are legitimately identical because the
  spec contains zero `$ref`s (local/external/unresolved all empty). Error views are `{}`/2 bytes
  because no operation declares a non-2xx response; `commonErrorEnvelopeObserved: false` is stated,
  not inferred — matching research finding 8 for the bare-`oc` no-DB contract.
- **D8 statement.** `maxItems=50`/`maxStringLength=2000` match
  `truncation.ts` (`DEFAULT_TRUNCATION_POLICY`), per-item limits are compared everywhere
  (max array 5, max string 34, zero violations), and the absent whole-result byte ceiling is
  stated explicitly rather than implied as protection.
- **Tool algorithms (except M1 below).** JSON-pointer resolution handles `~0`/`~1`; dereference has
  per-branch cycle guards and preserves `$ref` siblings; operation extraction filters to real HTTP
  methods; the 2xx/non-2xx split is a correct status-code regex; limits traversal counts every
  array/string with violation paths.
- **Normalization under D10.** Scratch paths are `<scratch-root>`-normalized; no credentials or
  foreign absolute paths appear. The retained owned PIDs and timestamps are load-bearing
  attribution/ordering evidence, which D10's "verdicts cite commands, timestamps" clause requires —
  they are not gratuitous volatile noise.
- **Fixed-port ownership, teardown, hygiene.** Baseline read-only inventory (2 foreign AppHosts,
  6 foreign/unproven containers, Aspire MCP processes) untouched; exact-path stop exit 0; zero
  owned processes/listeners/containers surviving; root `deno.lock` hash identical before/after;
  git status shows only run-dir changes — no product or template workaround was made.
- **Misreading risk.** No artifact can be honestly read as satisfying #1128: verdict, worklog gate
  tables, context-pack, and `P2-db-failure.json` all state the DB half is missing and map it to
  FAIL.

## Findings (ranked)

### M1 (major) — keyword evidence omits an actually-present OpenAPI keyword

`p2-measure-live-spec.ts:69-124` derives `recursivelyObservedKeywords` by filtering object keys
through a hardcoded `STANDARD_KEYWORDS` allowlist. That list omits real OpenAPI/JSON-Schema
keywords (`summary`, `tags`, `license`, `contact`, `const`, `prefixItems`, `$schema`, …). I
verified against the retained raw spec (SHA-256 matches the committed evidence): the spec contains
**`summary`**, which is absent from the committed keyword list in `P2-no-db.json`. The verdict's
claim that "the recursively observed OpenAPI/JSON-Schema keyword subset is recorded" is therefore
false for at least one present keyword — an A14/D7 evidence-fidelity defect, and consequential
because RFC §4 routes exactly this list into the Wave-1 S-5 validator-subset design; a silent
undercount there produces a validator that rejects legitimate generated specs. Secondary design
caveat: the scan is context-blind, so a schema *property* named like a keyword (e.g. a property
`title`) would be counted as an observed keyword — no confirmed false positive in this spec, but
the limitation is undocumented.

**Required action (no runtime rerun needed):** the raw spec survives at
`<scratch-root>/p2-no-db-live-spec.json` and hash-matches the evidence. (1) Fix the keyword
derivation — either scan all object keys and report unrecognized keys in a separate
`nonAllowlistedKeys` field, or complete the allowlist against the OpenAPI 3.1 / JSON Schema
2020-12 keyword sets — and note the context-blindness limitation; (2) re-run the script on the
retained spec and regenerate `P2-no-db.json`; (3) commit the normalized raw spec (3657 bytes,
credential-free) under `proofs/evidence/` so keyword completeness stays auditable after scratch
cleanup; (4) update the verdict sentence accordingly. None of this changes the combined `FAIL`.

### m1 (minor) — stale lint-ignore gate note

`worklog.md` static-gate row still reads "No lint-ignore directive in the P1 experiment"; S2 added
a second experiment file. I verified `p2-measure-live-spec.ts` contains no ignore directive, so the
fact holds — update the note to cover both files so the gate table matches its evidence.

### m2 (minor) — undrifted deviation from the plan's P2 command row

Plan validation row 4 names `p2-measure-spec.ts` with `--allow-read --allow-net`; the actual run
used `p2-measure-live-spec.ts` with `--no-lock --allow-read --allow-write` plus a separate bounded
`deno eval` fetch. The split (fetch separately, measure from file) is *better* — the measurement
tool needs no network — but it is a plan deviation and drift is explicit by Operating Rule 5. Add a
minor drift entry.

### m3 (info) — root-lock hash algorithm inconsistent across evidence

`P1-runtime.json` records a 40-hex root-lock digest; `P2-runtime.json` a 64-hex one. Both prove
no-change within their own run, but the algorithm should be named (or unified) so cross-slice
comparison is possible.

## May #1128's acceptance box be checked?

**No.** #1128 requires the spec-fidelity/size dry-run for both the DB-backed and no-database
scaffolds (D7; RFC §4 P2). Only the no-DB half is measured; the DB half is blocked by the
attributed generated `--allow-ffi` defect and was correctly not worked around. Until a healthy
DB-backed scaffold is measured after the rescoped product fix, checking the box would represent a
missing measurement as done — precisely the false-green state S-17 forbids. The truthful state is:
P2 verdict committed as explicit `FAIL`; issue remains open with the no-DB half's evidence linked
as partial progress (no closing keyword).

## Summary

The S2 draft is honest where it matters most: the combined `FAIL` is the only truthful verdict, the
DB branch is carried as an attributed failure rather than laundered, the no-DB measurement is
attributably owned, independently recomputed values check out, teardown/hygiene/lock evidence is
sound, and no product workaround occurred. `CHANGES_REQUESTED` rests on M1: the committed keyword
observation is provably incomplete (`summary` present in the hash-matched raw spec, absent from
evidence), and that list is a named input to Wave-1 validator design. M1 is fixable from the
retained raw spec without any new runtime run; m1–m3 are record-hygiene fixes. After amendment,
this reviewer expects re-review to be a fast APPROVED. This is advisory slice review, not
IMPL-EVAL.
