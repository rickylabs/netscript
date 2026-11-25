# Supervisor Record — RFC A (`plan/rfc-orpc-router-client-pipeline-2671`)

- **Run ID:** `plan-rfc-orpc-router-client-pipeline-2671--rfc`
- **Issue:** `https://github.com/rickylabs/netscript/issues/2671`
- **Branch:** `plan/rfc-orpc-router-client-pipeline-2671`
- **Base commit:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (`main`)
- **Primary deliverable:** `rfcs/0000-orpc-router-client-pipeline.md`
- **Status:** Draft evaluation RFC ready for round-1 review (Fable 5.2; subsequent rounds: Gemini Hydrogen).

## Route & Lane Assignment

| Role | Assigned model / lane | Notes |
| --- | --- | --- |
| Author / research lane | Neon | Drafts RFC A + empirical probes against locked `@orpc/*@1.15.5`; zero edits to `packages/`, `plugins/`, `docs/site/`, `.github/`, or `deno.lock`. |
| Round-1 reviewer | Fable 5.2 | Single initial review pass covering architecture, security parity, #2659 comparison, and generic downstream consumer impact. |
| Subsequent review rounds | Gemini Hydrogen | Follow-up review passes after round-1 revision. |

## Scope Boundaries

- **In scope:** `rfcs/0000-orpc-router-client-pipeline.md` and `.llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/*` (including runnable `--frozen` probes and captured JSON results).
- **Out of scope:** Implementation edits under `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`; merging PRs; referencing any private consumer repository.
- **Public privacy compliance:** All downstream consumer impact is stated generically ("downstream applications"); zero private project prefixes, personal names, hostnames, or local machine paths appear in committed files.

## Deliverable Checklist

- [x] Complete Hono middleware & service primitive inventory (`transport-only` / `procedure-level` / `split`)
- [x] Request-less oRPC context + RFC 0001 client contribution projection design
- [x] Procedure-based contract authorization preserving all 6 HTTP/in-process security invariants
- [x] Explicit matrix of in-process guarantees vs deliberate omissions and safety rationale
- [x] Empirical overhead benchmark (HTTP loopback vs #2659 fetch-link vs `createRouterClient`) with silent-logger apples-to-apples controls
- [x] Empirical parity probe (5/5 tests passing with `--frozen`: authn/authz/internal-audience/defined-errors/anti-forging, shared post-auth rate limit + single-authn proof, OTel tracing + ALS detachment, `AbortSignal` + bare `call()` + auth-before-validation, Zod output cloning vs schema-less aliasing)
- [x] Explicit comparison against PR #2659 and recommendation (**Option 3 — Stage into Coexistence**)
- [x] Mandatory `## Downstream consumers` section
- [x] Scoped internal doc-link check + privacy/closing-keyword scans + DCO commit
