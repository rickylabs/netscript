# Research — fix-listener-readiness-diagnostics--0.0.7

## Re-baseline

- Carried-in source: `implement-brief.md` and the merged #1858 readiness work.
- Re-derived against `main` at `5ce87fb8b1aa2e174061c3542cf68920c1cb5af4` on 2026-09-02; branch setup commits only add the implementation brief.
- #1858's framed RESP probe and emitted-workspace compile/format tests are present at the baseline.
- The remaining hosted signature is evidence of an unpublished `postgres_listener` key, not evidence of a historical root cause.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The verifier repeatedly reads `aspire describe`, but its deadline error retains only the last selected-report message. It discards resource `state`, aggregate `healthStatus`, sibling key/status pairs, match status, and console logs. | `verify-listener-readiness.ts`; `listener-readiness-gates_test.ts` |
| 2 | `aspire logs <resource>` supports `--apphost`, `--tail`, `--format Json`, `--non-interactive`, and `--nologo`, so a one-shot bounded tail is available without a live runtime in this lane. | `aspire logs --help` on 2026-09-02 |
| 3 | The generated database callback awaits `getEndpoint('tcp')`, `endpoint.host()`, and `endpoint.port()` without a deadline before it invokes the socket check. An unresolved endpoint promise can therefore prevent Aspire from publishing the first health report. | `generate-register-infrastructure.ts:210-223` |
| 4 | The emitted `createListenerReadinessCheck` socket attempt is already bounded by `LISTENER_READINESS_TIMEOUT_MS = 2_000` and returns `Unhealthy` with structured failure data. | `_aspire-compat.ts.template:170-213`; health-check tests |
| 5 | H1 is credible from code because only endpoint allocation is unbounded. H2 and H3 remain possible hosted explanations and must be exposed by the final snapshot rather than guessed locally. | Findings 1, 3, 4 |
| 6 | PR #1952 defines readiness as reachability at the published consumer endpoint. Container logs are supporting diagnostics, not readiness authority; `{}` reports remain unknown. The bounded endpoint result must never manufacture an Unhealthy state—it only reports one when allocation actually exceeds its bound. | Supervisor addendum, 2026-09-02 |
| 7 | `packages/cli` is Archetype 6 with doctrine verdict **Keep**. The nested E2E workspace is package-owned harness code, not a separate published doctrine unit. | doctrine 06/09/10; `ARCHETYPE-6-cli-tooling.md` |
| 8 | Existing debt `scaffold-runtime-a8-f16-1333` forbids growing the runtime gate directory. This slice can remain within existing files. | `.llm/harness/debt/arch-debt.md` |
| 9 | The service overlay references `.claude/04-services.md` and `.claude/06-infrastructure.md`, but `.claude/` is absent at this baseline. | filesystem check on 2026-09-02 |

## Hypothesis disposition

| Hypothesis | Local disposition | Required hosted evidence |
| --- | --- | --- |
| H1 — callback never completes | Credible: endpoint resolution is unbounded while the socket probe is bounded. Ship the bounded resolver. | An `ENDPOINT_UNALLOCATED` report would confirm the observed failure class at a future incident. |
| H2 — resource not Running | Undecidable locally. | Deadline snapshot reports `state` and `healthStatus`. |
| H3 — stale/different AppHost | Undecidable locally. | Deadline snapshot reports whether any matching resource exists, plus its matched identity fields. |

## jsr-audit surface scan

- Surface scanned: N/A.
- Reason: the slice changes private E2E diagnostics and generated AppHost helper behavior. It does not touch `mod.ts`, exports, package metadata, or a published TypeScript API.
- Slow-type / surface risks: none introduced.

## Open questions

- Which hypothesis explains the next hosted failure? Safe to defer because the shipped snapshot is the measurement that distinguishes them; it must not be converted into a historical-causality claim.
- Will the Postgres tier pass twice consecutively at the same head? Supervisor-collected after push; it is not local proof.

