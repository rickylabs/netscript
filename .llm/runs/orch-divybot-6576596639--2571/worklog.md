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

## S2 integration

Independent AI implementation delivered canonical app-owned templates and20
stub-backed scenarios, including native private stream denial/authorized IO,
BFF session verification and replay after process restart. Parent now composes
the templates and ordinary AI/auth/UI install steps in the same setup recipe.

Initial Astra review inspected all36 screenshots and10references. Desktop and
most mobile screens met8/10; customer/product/detail tables at390px failed.
Repaired responsive labelled rows, line item geometry and shipping spacing;
removed sticky pagination obstruction. Refreshed review remains pending.

Packed production harness passed native packing of29 maintained packages and
the actual generated client/server production build with no source vendors.
The harness projects genuine package.json identity and compiled exports into
Deno metadata for the unchanged closure guard. Final integrated app rerun is
pending. Root check discovery found16tasks; only dirty carrier and surface
manifest freshness require regeneration/commit before final verification.

S2 independent source review returned FAIL_FIX: empty chat catch-up kept the
composer disabled; UUID-limited listing could omit a newest conversation; and
directory InstalledFrom metadata could skip its own manifest. AI repairs and a
mounted-browser negative/positive regression are delegated to the same narrow
implementation lane. Parent added eight directory-source variants across normal
and caller-owned service entrypoints; baseline was RED. The adapter now checks
the source directory itself, including workspace/local/file URL forms. It
retains legacy entrypoint fallback when no installed identity resolves.

CI now runs the documented showcase one-pass cleanup suite in the existing
SQLite runtime job and includes its report in the existing always-uploaded
artifact. Canonical scaffold.runtime remains a separate unchanged CI gate.

The installed-source directory controls are green for all eight normal/wrapper
variants. The existing public CLI consumer suite exposed an eager Vite import:
clean baseline passed but integration failed its FFI-restricted children. Moved
Vite route-manifest loading inside the selected preset emission; all53 registry
and public permission tests now pass without changing their permissions. The
final default197-file comparison is still byte-identical.

Packed consumer graph is now closed explicitly: every first-party alias must
point to a genuine compiled artifact or an exact JSR plugin identity. Source
vendors and the source-root marker are absent. Integrated client/server build
passed after that guard. No native provider runtime is bundled into Vite.

Visual subgate PASS: independent Astra approved all60combinations (15views,
light/dark,1440/390) at8/10or above. See visual-evaluation.md and browser-matrix.json.
Reference-page repairs compose the shared destructive Alert and full-width
DetailLayout main region. No required visual repairs remain in supplied states.

AI repairs from the same implementation lane are applied as a scoped diff;
parent reran21stub scenarios plus the mounted browser regression successfully.
The original empty-chat source went RED with disabled composer; repaired source
goes GREEN for first prompt, unused-thread reopen and native tool replay.
Metadata retains all64inverse-UUID-order control threads and owner isolation.
Accepted demo scaling constraint: O(n) owner metadata scan and one local KV host;
a production multi-host deployment needs shared ownership/index pagination.

Default-output proof now includes the generated agent bundle: all220files match
byte for byte when both public CLI binaries use exactly the same output path.
No path normalization or file exclusion was used. The earlier197/178controls
also remain green.

S2 repair source review closed all3implementation findings and found one new
CI evidence-directory setup omission. A cold-path negative reproduced NotFound
before scenarios. The test now creates its optional evidence directory
recursively before writing. Exact CI source+browser command with previously
nonexistent evidence/browser output paths is being verified. These are
nonterminal per-slice source/supervisor reviews; the mandatory formal leaf
IMPL-EVAL remains pending after integration and CI. No leaf terminal verdict
has been issued and no merge-readiness claim is made.

## S2 terminal — source PASS, visual PASS

The same independent Sol source supervisor confirmed the evidence-directory
repair and closed the S2 source slice. See source-review-s2.md. Same-session
Astra visual subgate approved all60combinations; see visual-evaluation.md.
Cold evidence path and mounted-browser tests pass. S2-local-evidence.json records
local scope and remaining gates. No final leaf IMPL-EVAL or merge claim.

Reconcile: source merge retains the AI lane history through its initial delivery,
with the scoped c0643b9 repair patch applied. Main advanced to59e6202; normal
integration follows in S3. No rebasing or force push.

S3 history reconcile: retained the scoped c0643b9 assistant repair commit as a
normal merge parent. Its reviewed product diff was already applied in S2; this
merge introduces no product changes and preserves the independently produced
implementation history. Parent-only recursive evidence-directory repair stays.

S3 main integration: merged59e6202 normally with no conflicts. Retained #2592
post-seed lifecycle, #2559 preset/theming/CLI quality ratchet, and #2573 docs
payload changes. Full carrier chain and Aspire surface manifest regenerated in
order, all exits0. CLI lint1284files and format1156files pass with zero dropped
files/refusals. Current-main default control includes agents:220/220identical
bytes, same destination, no normalization/exclusions. Incoming lock diffs only
add the root zod dependency inventory already present in origin/main; no package
version change or local cache/lock cleanup. The prior proof AppHost is stopped.

Next candidate gates are final-source root checks, fresh documented showcase and
packed build, CI runtime and formal leaf IMPL-EVAL.
