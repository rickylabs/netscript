# IMPL-EVAL — PR #747 (code-quality gate + typed CLI + capability seam)

**Verdict: PASS** (after one FAIL_FIX cycle).

## Evaluator
- Generator: WSL Codex GPT-5.6 (fix slice `019f5556`) + orchestrator hardening (tooling/harness).
- Evaluator: local Claude Opus 4.8, opposite-family per lane-policy ("review of GPT implementation
  → Opus 4.8 high"). **OpenHands was the requested vehicle but failed at the agent stage on both
  open models** (qwen3.7-max, kimi-k2.6 — runner docker/nftables + agent-call failure, verdict
  NONE); that is an OpenHands/OpenRouter infra failure, not a task verdict. Per the openhands-handoff
  routing policy, a local opposite-family evaluator is the correct IMPL-EVAL for a local run, so the
  Opus eval is the legitimate substitute. Separate session from the generator; adversarial.

## Verdict trail
1. **First pass: FAIL_FIX** — 4/5 claims VERIFIED; one durable scanner bypass: host-side plugin
   identity via same-file const/array indirection (`const target='auth'; plugin.name===target`)
   evaded the literal-only rule. Two other attempted bypasses confirmed defended-in-depth
   (`deno fmt` collapses multi-line casts; `deno lint` catches bare `any`).
2. **Remediation** (`794977d9`): `collectPluginNameIdents` taint tracking; rule now flags
   equality/predicate against tainted idents + tainted-array `.includes(name)`; regression test.
3. **Re-confirmation: PASS** — 3 fresh adversarial indirection variants all FIRE; two negative
   controls (`'auth-backend'` capability id; a non-plugin `const other=userArg`) do NOT fire (no
   false positives); tests 5/5; real surface 0 findings / 19 reasoned allowances; diff scanner-only
   so the four already-verified claims stand.

## Verified claims
1. `any` eliminated — typed `CliffyCommand = Command['cmd']` (proven not-`any` via `IsAny` probe);
   casts removed; `deno.lock` unchanged; no new `deno-lint-ignore`.
2. Capability seam — `doctorChecks` / `supportsMcpScaffold` on the manifest; no host-side plugin-name
   identity branch remains; a real seam, not a rename.
3. Scanner sound — all four rules incl. predicate/indirection/file-wide/spaced-cast; no false
   positives; unit tests green.
4. Gate both surfaces — `quality:gate` referenced required in run-loop/tooling/netscript-tools; PR
   CI job hard-blocking; repo-drift job observational until #746.
5. RED→GREEN honest — scanner fires on the base tree (131→0 not vacuous).

Merge authorized on this PASS + green PR CI (owner authorization; quality PR to main, hard stop-line
untouched). Whole-repo pre-existing cleanup → #746.
