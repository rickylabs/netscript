# Adversarial triage — dispositions for `adversarial-sol.md` (stage 2, Codex GPT-5.6 Sol · xhigh)

**Verdict: 25/25 accepted** (2 accepted-with-scope). No finding rejected. Integration lands as
rev 2 of `plan.md`, `design/canonical/00–06`, `design/examples/*`, and `rfc.md`. "Where" names
the primary integration point; several findings touch multiple docs.

| # | Sev | Disposition | Integration (rev 2) | Where |
| --- | --- | --- | --- | --- |
| S-1 | blocker | accept | Exact policy carrier defined: `.netscript/agent-mcp.json`, schema-validated at composition; absent → disabled default; unreadable/malformed/partial → disabled **plus surfaced warning**; end-to-end fixture set (valid-enable reaches choke point; absent/malformed/`{}`/partial all deny) becomes a Wave-3 gate | 04 §3 |
| S-2 | blocker | accept | Canonical-identity law: resolve to one unique spec operation first (exact dotted id, else exact `METHOD path`); **ambiguity refuses**; every policy predicate + `confirm` evaluates only the canonical dotted id; deny-wins test crosses aliases | 04 §3, 03 §2 |
| S-3 | major | accept | `confirm` demoted: named deliberate-action friction, **not credited as a security control**; safety rests on policy alone; no-auto-retry note added to the injection posture | 04 §3, §5 |
| S-4 | blocker | accept | Loopback guarantee narrowed and made honest: manifest/appsettings URLs must carry literal loopback hosts; DNS names resolved via `Deno.resolveDns` then pinned (fetch by resolved IP) or refused; overrides labeled operator-trusted and **plan.md's "no network beyond localhost" scoped accordingly**; socket-binding depth stays a named debt with the narrowed claim | 02 §security, plan.md |
| S-5 | blocker | accept | Validation named as real work: an OpenAPI-3.1-subset validator covering what oRPC emits (refs, unions, string constraints, type arrays); tool input becomes location-aware (`params: {path, query, headers}`), `body` accepts any JSON type; proof set includes required headers, same-name cross-location params, unions, non-object bodies; the existing `domain/schema.ts` evaluator is explicitly **not** the validator | 04 §2 |
| S-6 | major | accept | Spec prose declared untrusted at the model boundary; server-side tests assert injected instructions in descriptions never alter tool behavior; residual model-side risk documented rather than claimed away | 04 §5 |
| S-7 | blocker | accept | Option (a) **un-locked**: helper body demonstrably runs before allocation (reviewer's template + Aspire lifecycle evidence adopted); [P1] reframed — must positively demonstrate a run-mode post-allocation callback resolving host-perspective URLs, else F1(b) activates; D3 wording updated | 02 §producer, plan.md D3 |
| S-8 | blocker | accept | Manifest identity binding: adds `projectRoot` + a per-run `runId` (not PID-only); freshness = identity match, not PID+clock; before report/invoke, the fetched service is cross-checked against the binding (service-info name match); wrong-root/copied-worktree cases become refusals | 02 §staleness |
| S-9 | blocker | accept | Directory contract rewritten: every consulted source yields `used | absent | failed(reason)`; outcomes survive into `list_api_services` output (`sources` block); failed read is never rendered as healthy absence | 02 §port, 01 |
| S-10 | major | accept | Deterministic precedence (override > run-manifest > appsettings) with per-service conflict surfacing; source union gains `aspire-cli`; CLI-fallback failure states representable — "contract does not change" claim withdrawn in favor of "contract already contains the fallback's states" | 02 §port |
| S-11 | major | accept | Read-path fetches get bounded timeout + abort + per-service isolation + concurrency bound; one hanging spec ⇒ row-level failure, never a hung directory | 02 §fetch |
| S-12 | major | accept | One status mapping: connection-refused ⇒ `not_running`; connected-but-error/timeout/parse ⇒ `spec_unavailable`; example table corrected to match | 02, examples |
| S-13 | blocker | accept | Truncation arithmetic fixed: flows self-cap below the central truncator's bounds and compute `truncated` **after** all caps; implementation requirement recorded against `truncation.ts` (metadata recomputed after central caps; whole-result byte bound); "~1 line per operation" replaced by measured [P2] budget | 01 |
| S-14 | major | accept | "HEAD-style" dropped: `operations` count derives from a parsed bounded GET or is absent — never defaulted | 01 |
| S-15 | blocker | accept | Receipt commit moves **after** output validation; thrown/validation failures record a failed attempt (no stale green); named as a `withReceipt`/runner integration change, prerequisite to any F4 use | 01 §registry, 05 |
| S-16 | major | accept | F4(b) re-costed: requires per-evidence-class receipts keyed (resource, evidenceKind, operation) — new machinery, not configuration; fork text updated so the owner decides with true costs | 05 §2F, plan.md F4 |
| S-17 | blocker | accept | Wave-0 proofs emit committed artifacts (`proofs/P<n>-verdict.md` with measured result + verdict); first dependent slice carries a hard prerequisite failing on missing/stale/negative artifact | plan.md |
| S-18 | major | accept | Activation surface A corrected: `.mcp.json` pins exact release versions — existing projects reach the tools via documented `agent init` re-run + host restart, with a fixture starting from prior-release host files; "zero new install" claim scoped to new scaffolds | 05 §2A |
| S-19 | major | accept | Errors view derived from each operation's **actual** declared responses; common-envelope compaction only when detected present (no-database in-memory template is the reachable counterexample) | 03 §3 |
| S-20 | major | accept | Archetype reclassified: the `packages/mcp` change is ARCHETYPE-2 (integration behind ports/adapters), full matrix column applies — no hand-picked gate subset; plan + doctrine-fit updated | plan.md, 06 §2–3 |
| S-21 | major | accept-with-scope | The "no provider variance" residue claim withdrawn; the endpoint-source axis is named per doctrine 07 (typed identifier, factory at composition); verdict **re-argued on the axis and unchanged** — all variants are first-party adapters of one core port with no external provider, so core retains them; the plugin question would genuinely reopen on a first external endpoint provider | 06 §1 |
| S-22 | minor | accept | Rung 3 replaced with deterministic humanized-operationId (prior-art shape); the "reads as a sentence" schema-description rung removed | 03 §4 |
| S-23 | major | accept | Example re-labeled explicitly hypothetical throughout; the 202/poll causal chain presented as *one plausible mechanism*, not the recovered incident; the "25 minutes → three calls" claim reduced to what the evidence supports | examples/silent-hang-replay |
| S-24 | major | accept | `curlExample` differentiates `executable` vs `credential-required`; no-auth never inferred from absent OpenAPI security metadata (global auth middleware is invisible to the generator — reviewer's citation adopted) | 01, 04 §4 |
| S-25 | minor | accept | Opt-out gets its typed seam: `introspection.excludeServices` in the same validated `.netscript/agent-mcp.json` carrier; excluded services render as `excluded` rows, spec never fetched (tested) | 01, 02 |

## Cross-cutting notes

- **The reviewer's A/B/C required surfaces all produced blockers** (A → S-1/S-2/S-3; B →
  S-9/S-13/S-14/S-15/S-16/S-17; C → S-7/S-8/S-10), vindicating the orchestrator learnings the
  brief carried. The defended-checks table (A2 method-from-spec, meta-tool-vs-cache, thinness of
  the projection, #1090 routing) is retained as-is — those defenses stand.
- **No finding overturns the two headline decisions** — extend-core-no-plugin (S-21 narrows the
  argument, not the verdict) and the meta-tool triad (explicitly defended) — but S-7 converts
  D3 from "chosen mechanism" to "P1-arbitrated mechanism," which is a real status change carried
  into the RFC.
- Findings S-13/S-15/S-16 require changes to **existing** `packages/mcp` machinery
  (`truncation.ts`, `withReceipt`, evidence store), not just new code; these are added to the
  wave plan as named slices so they cannot be silently absorbed.
