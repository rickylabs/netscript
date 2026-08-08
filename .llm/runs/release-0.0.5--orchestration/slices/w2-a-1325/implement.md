use harness

You are the W2-A implementation supervisor for the NetScript 0.0.5 stable release. You own exactly
one PR cluster: **#1325 — the generated triggers background runtime omits the Redis adapter and
crash-loops on the default Aspire cache.**

## SKILL

Activate and follow, in this order:

- `netscript-harness` (operating model, slice discipline, evaluator separation)
- `netscript-doctrine` (this touches `plugins/**` — identify the archetype, the public surface, the
  fitness gates, and the existing accepted debt **before** changing framework code; A5 plugin plus
  service/runtime overlay)
- `netscript-cli` (scaffold/plugin/generate/doctor command surface and the E2E suites)
- `aspire` (AppHost lifecycle, resource health, structured logs, OTEL, isolated start)
- `netscript-tools` (validation wrappers, gate evidence, leak-check/teardown, lock hygiene)
- `netscript-deno-toolchain` (`deno doc` before broad source reads; `deps:*` for any dependency
  question)
- `netscript-pr` (branch/PR/label/comment mechanics — you are opening a draft PR)
- `jsr-audit` (any change to a publishable plugin surface)

Read `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md` in full. It is part
of this brief.

## Identity

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Lane           | `light_implementation` — Codex · OpenAI · GPT-5.6 Sol · low               |
| Worktree       | `/home/codex/repos/ns005-w2a`                                             |
| Branch         | `fix/triggers-generated-kv-adapter-bootstrap`                             |
| Base           | `origin/main@c383b2e84`                                                   |
| Slice dir      | `.llm/runs/release-0.0.5--orchestration/slices/w2-a-1325/`                |
| Draft PR       | you open it, direct to `main`                                             |
| IMPL-EVAL      | Claude · Fable 5 · medium, separate session, launched by the orchestrator |
| Review pairing | `review_codex_light` → Opus 5 · high                                      |

## The defect

Read #1325 in full first (`gh issue view 1325 --repo rickylabs/netscript`) and re-verify every claim
against the current worktree — the issue was written at an earlier baseline.

The triggers runtime stub can emit a combined background process without registering the configured
KV adapter. The default Aspire Redis/Garnet path then crash-loops until a human adds an import by
hand. The sagas sibling has a fix, but there is **no cross-plugin invariant** stopping the next
KV-backed generated runtime from shipping without its provider bootstrap — so a point fix here is a
half-fix.

## Mission

1. Identify the canonical cache-provider selection and adapter-registration authority. Keep the
   convention-bearing provider contract in core; plugin code stays thin composition. Doctrine's
   thinness/parity law applies — cite the exact accepted debt in `plugins/triggers`
   (verification-shape, connector convergence) and do not deepen it.
2. Write a **RED-first** generated-output/runtime test that fails when the selected adapter
   bootstrap is absent. Do not pin a text-only import assertion: an emitted import that is still
   inert must fail the test.
3. Emit deterministic trigger glue for **both** Redis/Garnet and `CACHE_PROVIDER=denokv` with no
   manual edits and no regeneration-unsafe state. Reuse the saga seam or introduce one shared
   enumerated invariant — do not fork a second mechanism.
4. Install **every** KV-backed first-party background runtime in a generated project and prove each
   reaches real healthy state under the appropriate provider. Health JSON, resource endpoints, and
   structured logs are the evidence — process exit is not.
5. Use `aspire start --isolated`, exact `aspire wait`/resource evidence, and exact AppHost-scoped
   cleanup. Never stop or remove a foreign resource.
6. Gates: focused generator/plugin tests, `verify-plugin`, the scoped wrappers, `quality:gate`,
   `arch:check`, then the serialised one-pass `scaffold.runtime` (request the token first).

## Acceptance discipline

Open the draft PR with `Closes #1325` **only** when every acceptance box on the issue is truthfully
tickable from evidence you can point at. An emitted import or a unit mock does not satisfy this
issue: acceptance requires both backend selections and real generated background-resource health.

Report to the orchestrator when you are gate-complete, or as soon as you find the issue is not
implementable as scoped.
