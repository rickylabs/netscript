# Drift Log: W2-A #1325 generated trigger KV bootstrap

## 2026-08-08 — dispatch identity supersedes stale preparation

- **What:** The active owner brief supplies a different branch, worktree, baseline boundary, and
  evaluator route than the prepared `supervisor.md`.
- **Source:** current owner brief and raw git verification.
- **Expected:** prepared branch `fix/triggers-kv-bootstrap-1325`, separate worktree, canary boundary,
  Qwen evaluator.
- **Actual:** `fix/triggers-generated-kv-adapter-bootstrap` in `/home/codex/repos/ns005-w2a` at
  `c383b2e84`, native Claude/Fable IMPL-EVAL.
- **Severity:** significant
- **Action:** accept owner override and update supervisor identity before implementation.
- **Evidence:** `supervisor.md`; `git branch --show-current`; `git rev-parse HEAD origin/main`.

## 2026-08-08 — referenced shared contract file absent

- **What:** `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md` does not exist
  in this baseline.
- **Source:** direct filesystem read and slice directory listing.
- **Expected:** file exists and is read in full.
- **Actual:** owner brief includes the contract in full inline; that copy is being followed.
- **Severity:** minor
- **Action:** accept inline authority; do not invent or backfill an orchestrator-owned shared file.
- **Evidence:** failed `sed` read; `rtk ls .../slices`.

## 2026-08-09 — Deno KV live-AppHost evidence narrowed to focused provider coverage

- **What:** Plan fitness-gate item 7 promised isolated generated AppHost health for both the
  Garnet/Redis and Deno KV provider selections.
- **Source:** separate-session IMPL-EVAL at `da8e20bf8` and its falsification run.
- **Expected:** both provider selections reach real generated background-resource health under a
  live AppHost.
- **Actual:** Garnet/Redis reached live AppHost health for workers, sagas, and triggers. The Deno KV
  selection is covered by the generated-workspace test with a real Deno KV set/get, not by a second
  live AppHost run.
- **Severity:** significant scope narrowing, accepted for this defect.
- **Why acceptable:** the evaluator removed the emitted Redis bootstrap and reproduced the Redis
  registration failure, while the Deno KV test still passed with that broken stub because Deno KV
  is built in and requires no adapter bootstrap. A live Deno KV AppHost therefore has no
  discriminating power for #1325. The focused Deno KV scenario instead proves the relevant second
  half: the new unconditional Redis registration import does not hijack provider selection, and
  `CACHE_PROVIDER=denokv` still selects and operates Deno KV.
- **Action:** retain the focused Deno KV provider-selection/operation proof and the live
  Garnet/Redis AppHost health proof; do not claim a live Deno KV AppHost run.
- **Evidence:** PR #1394 IMPL-EVAL comment `5228627533`; triggers generated-resource suite 10/10;
  `scaffold.runtime` raw exit 0 with `passed=76 failed=0` and all three KV runtime waits passing.
