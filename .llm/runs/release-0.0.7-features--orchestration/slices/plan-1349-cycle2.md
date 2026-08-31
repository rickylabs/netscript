use harness

# SLICE — #1349 plan revision, cycle 2 (plan text only, no product code)

PLAN-EVAL cycle 1 returned **`FAIL_PLAN`** at plan head `4b520ea44`. The verdict is committed at
`.llm/runs/feat-sdk-client-contribution-seam--1349/plan-eval.md`. Your job is the cycle-2 revision.
**You write plan text only — no file under `packages/` or `plugins/` may change.**

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1349` |
| Branch | `feat/sdk-client-contribution-seam` |
| Run dir | `.llm/runs/feat-sdk-client-contribution-seam--1349/` |
| Issue | #1349, part of epic #1348, governed by RFC 0001 Stage 2 |

## SKILL

`netscript-harness`, `netscript-doctrine` (`packages/sdk`), `netscript-tools`.

## Read these two first — the cycle-1 plan never opened them, and that is the root cause

1. `rfcs/0001-sdk-client-contributions.md` — **Status: Accepted.** This is what the issue amendment's
   precedence clause actually routes to, and it is normative.
2. `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` — the RFC's **committed
   compile-only proof**. It already pins the algebra and already proves desktop rejection.

Then read `plan-eval.md` in full, then `research.md` and `plan.md`.

## What to produce

Rewrite `plan.md` in place so it is re-derived from those two artifacts rather than from the issue's
prose. Address **every** finding F-1 … F-8; the verdict states the cycle-2 fix is **plan-text only,
with no scope movement**, so do not widen or narrow the issue.

The three substantive corrections the evaluator requires:

- **F-1** re-derive LD-3 from the RFC's fixed shapes. LD-1/LD-2 stand, but the cycle-1 sweep caught
  only 2 of 5 contradictory rows — §1's `link?: ClientLinkPort` escape hatch, §2's
  `BaseServiceClientContext` rename, and §7's environment check are the same class and were adopted
  unexamined. Note the tripwire: **kill `link?:`** or #1349 pre-empts #451.
- **F-2/F-3** LD-6 and LD-7 are **wrong and self-refuting**. The RFC forbids dependency fields and
  environment flags on descriptors (no `before`/`after`/`requires`/`priority`; order-independence is
  on the *not-open* list). Desktop rejection is already proven by an **excess-property check on
  `CreateDesktopServiceClientOptions`** — there is no descriptor flag. Restate both acceptance lines
  as shape-invalidity (`SDK_CONTRIBUTION_INVALID` / `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`).
- **F-4** the Slice-1 ceiling is half-missing: add `ports/query-factory.ts`,
  `ports/service-query-utils.ts`, the amendment's own key algebra plus local failure taxonomy, and the
  query-side generics that acceptance item "Client/query context generics" requires.

Also: **F-5** finish the Slice 2/3 definitions against the RFC's named files; **F-6** add the risk
register and the RFC-mandated absence / zero-oRPC / fixture / `arch:check` / `quality:scan` gates;
**F-7** allocate the issue's Docs/consumer proof to a named slice; **F-8** create the missing
`supervisor.md` and `worklog.md` in the run dir.

Two more the evaluator asks you to *upgrade rather than change*: restate **LD-5** as a direct RFC
citation (`ClientTransportPolicyPort` owns retry/dedupe/trace/fetch — "no private fast lane" means
everything traverses the port pipeline), and record **LD-9** as **confirmed, not assumed** (the RFC
says server-plugin reachability is a service-preset problem; the ports are client-only, and
`NetScriptProcedureMeta` already exists on `main`, so there is no contracts-package creep).

Keep `TError` in the third `ServiceClientMethod` slot — the RFC sketch drops it, but #1350 forbids
erasing the error channel.

## Definition of done

- `plan.md` rewritten; every one of F-1 … F-8 addressed and traceable.
- `supervisor.md` and `worklog.md` created (F-8).
- **Zero** changes under `packages/` or `plugins/`; `deno.lock` untouched.
- One commit, pushed via explicit refspec, and a short summary of what changed per finding.
- Do **not** open a PR, change labels, or dispatch an evaluator — the supervisor re-runs PLAN-EVAL.

If any finding turns out to require a scope change rather than plan text, **stop and report it** —
the evaluator explicitly judged a cycle-2 `PASS` reachable without scope movement, so a scope demand
is a signal to escalate, not to absorb.
