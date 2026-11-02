# Worklog

## Owner overrides

"IMPL-EVAL: a separate read-only Codex `gpt-6.1-sol` session (Claude is paused)."
"Astra visual review (`gpt-6-astra`, separate read-only session)"
"Draft PR, **Refs #2571**. No labels, no session ids."
"Merge origin/main on conflicts, and push normally. **Never rebase or force-push.**"
These specific operator directives supersede generic dispatcher closure/readiness
boilerplate. Final canonical report uses the dispatcher file handoff.

## Design

1. Public surface: `init --from showcase`, generated `showcase:setup` task,
   Northwind orders/customers/products, order fulfilment and webhook walkthrough.
2. Vocabulary: Customer, Product, OrderLine, Order, fulfilment job, order-payment-
   shipping saga, delivery webhook, record activity, provider connection state.
3. Ports: existing filesystem/scaffolder/template/process ports; generated Prisma
   client; typed oRPC service and plugin contracts; worker progress; saga cascades;
   stream producer and activity reader. No new framework abstraction.
4. Constants: preset id, resource names, commerce statuses and workflow message
   types; existing pinned imports and service discovery. Money uses minor units.
5. Commit slices: S0 planning; S1 preset/commerce/setup and semantic regressions;
   S2 runtime/UI/documented acceptance; S3 carrier/gate/review evidence. See plan.
6. Deferred scope: AI chat/MCP only if the owner's time-box allowance is required;
   no release publication or merge. Default init output is preserved.
7. Contributor path: generated `showcase/README.md` links the contract, seed,
   fulfilment handler, saga and shared page extension points in one place.

PLAN-EVAL: N/A for this bounded app composition: the owner specifies the existing
contracts, merged components and acceptance recipe; no new package export,
framework abstraction or infrastructure protocol is selected. Mandatory separate
implementation evaluation and visual review remain required.

Bootstrap: issue and comments read; open partial PR #2577 verified; no full
showcase implementation exists. Matrix resolved at feature tier. Memory consulted.
All implementation and acceptance gates pending.

## S1 terminal — source PASS

Implemented opt-in composition, commerce schema/seed/contract, ordinary plugin
setup, durable fulfilment and T1 saga, webhook action and stream activity. The
canonical default scaffold is byte-identical in 197-file and 178-file controls.
Focused regression wrapper: 43 tests passed. Root structured check: 4210 files,
36 batches, zero failures. Quality/architecture gate passed.

The six-gate documented showcase recipe passed. Baseline rejected `--from
showcase`; a missing terminal shipping write also caused the walkthrough to fail,
and restoration passed. Read-only Sol supervisor source signoff: source-review-s1.md.
No merge-readiness claim: AI, final packed build, all root checks, CI and Astra
review remain pending. Reconcile: baseline #2594 is retained; default templates
are composed through the opt-in adapter. Plugin resource API names and explicit
saga correlation lessons are recorded alongside this worklog.
