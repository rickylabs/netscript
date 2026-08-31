use harness

# PLAN-EVAL — #1349 [sdk-client S3] typed oRPC client-contribution seam, **cycle 2 of 2**

You are a **separate evaluator session**. You adjudicate a plan; you do not implement, commit, push,
or comment on GitHub, and you do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, checked out at the revised plan head |
| Plan head | `fcc0f29b1` (cycle 1 was `4b520ea44`) |
| Branch | `feat/sdk-client-contribution-seam` |
| Run dir | `.llm/runs/feat-sdk-client-contribution-seam--1349/` |
| Issue | rickylabs/netscript **#1349**, epic **#1348**, governed by RFC 0001 Stage 2 |

## SKILL

`netscript-harness`, `netscript-doctrine` (`packages/sdk`), `netscript-tools`.

## This is cycle 2 — the eval loop limit

Cycle 1 returned **`FAIL_PLAN`**. Its verdict is committed at `plan-eval.md` in the run dir; read it
first, then `plan.md`, `research.md`, `worklog.md`, and `supervisor.md`.

**Cycle 2 is the last cycle before escalation.** If this plan still fails, say so plainly and name
exactly what must change — do not soften a `FAIL_PLAN` into a pass to close the loop, and do not
invent new scope to justify one.

## Read the two normative artifacts yourself

Cycle 1's root cause was that the plan adjudicated issue prose without opening these. Verify the
revision against them directly rather than trusting its citations:

1. `rfcs/0001-sdk-client-contributions.md` — **Status: Accepted**, normative.
2. `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` — the RFC's **committed**
   compile-only proof.

## What to adjudicate — the cycle-1 findings, each verified as closed or not

- **F-1** LD-3 re-derived from the RFC's fixed shapes, and **all five** superseded issue rows swept
  (cycle 1 caught only 2 of 5: §1's `link?: ClientLinkPort` escape hatch, §2's
  `BaseServiceClientContext` rename, §7's environment check were the misses). Confirm `link?:` is
  killed — leaving it makes #1349 pre-empt #451.
- **F-2 / F-3** LD-6 and LD-7 rewritten. The RFC forbids descriptor dependency fields and environment
  flags; desktop rejection is proven by an **excess-property check on
  `CreateDesktopServiceClientOptions`**, not a descriptor flag. Both acceptance lines must now read as
  shape-invalidity (`SDK_CONTRIBUTION_INVALID` / `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`).
- **F-4** Slice-1 ceiling widened to `ports/query-factory.ts`, `ports/service-query-utils.ts`, the key
  algebra + local failure taxonomy, and the query-side generics.
- **F-5** slices 2–3 defined against the RFC's named files.
- **F-6** risk register plus the RFC-mandated absence / zero-oRPC / fixture / `arch:check` /
  `quality:scan` gates.
- **F-7** the issue's Docs/consumer proof allocated to a named slice.
- **F-8** `supervisor.md` and `worklog.md` exist.

Also confirm the two upgrades cycle 1 asked for: **LD-5** restated as a direct RFC citation
(`ClientTransportPolicyPort` owns retry/dedupe/trace/fetch), and **LD-9** recorded as **confirmed**
rather than assumed. And confirm `TError` is retained in the third `ServiceClientMethod` slot — #1350
forbids erasing the error channel.

## The gate question

Answer explicitly: **is Slice 1 now implementable from this plan as written?** Cycle 1's answer was
no. Judge the revision on whether an implementer could execute Slice 1 without re-deriving design.

Write `plan-eval.md` (replacing the cycle-1 file is expected — the cycle-1 verdict is preserved in
git history at `1ada3e1c9`). Emit exactly one verdict line: `PASS` or `FAIL_PLAN`.
