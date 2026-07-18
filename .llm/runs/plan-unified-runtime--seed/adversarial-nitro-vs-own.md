# Adversarial findings — Nitro versus own-layer analysis pair

## 1. [BLOCKER] The AWS citation proves an HTTP sidecar and raw-event tunnel, not a native AWS provider family

**Claim.** Rev2 flips AWS from Nitro to an “owned AWS family” because Lambda Web Adapter allegedly preserves native event/product breadth and extends naturally to SQS, DynamoDB, Step Functions, and other leaf bindings (`research/nitro-vs-own-rev2.md:37,85-93,150-161`).

**Evidence.** The cited AWS repository's Deno example compiles the application to a single binary, runs it under the `java11` Lambda runtime for SnapStart, and explicitly has “no runtime hooks”; its non-HTTP feature merely POSTs the raw Lambda event JSON to a local `/events` HTTP endpoint. That transport does not implement SQS polling configuration, `ReportBatchItemFailures`, per-record ack/nack, visibility-timeout behavior, idempotency, resource provisioning, or any `MessageQueue`/saga port. The committed extract collapses “supports non-HTTP triggers” into “native event/product breadth” (`evidence/nitro-vs-own-rev2-live-2026-07-18.md:19-25,54-65`), while the shipped queue contract requires delivery count, async ack/nack, requeue/dead-letter metadata, long-running `listen`, graceful `stop`, concurrency, visibility timeout, and abort (`packages/queue/ports/message-queue.ts:39-77,86-132,172-205`). AWS itself requires explicit partial-batch response configuration and response shaping for SQS failures.

**Suggested disposition.** Reject the AWS flip as unproved. Split HTTP hosting from AWS event/resource adapters, require a concrete SQS conformance design and live probe, and estimate each independently before choosing Nitro versus native tooling.

## 2. [MAJOR] “Official Cloudflare tooling is Deno-compatible” is being mistaken for a cheap Deno-native build path

**Claim.** Rev2 calls the Cloudflare wrapper thinner than Nitro and prices HTTP/deploy at 2–4 weeks because Wrangler can point at TypeScript and Vite/Miniflare supply build, preview, and target semantics (`research/nitro-vs-own-rev2.md:35,40-44,52-55`).

**Evidence.** The Deno tutorial proves that a Deno project can invoke the npm Wrangler package; it does not remove Wrangler's Node/esbuild toolchain. The recommended Cloudflare Vite plugin is itself a Vite/npm integration—the same broad build family rev2 treats as a Nitro cost—and its programmatic configuration omits settings from `wrangler types` and resource CLI commands. Miniflare is explicitly a simulator supporting “most” features, not a production-fidelity oracle: remote Durable Objects and Workflows are unavailable, static assets and metadata differ locally, some platform limits are production-only, and Cloudflare recommends remote/live testing for network-specific behavior. The evidence extract only records the positive surface (`evidence/nitro-vs-own-rev2-live-2026-07-18.md:12-18`) and omits these load-bearing limitations.

**Suggested disposition.** Recast this as “provider-owned Node tooling callable from Deno,” not Deno-native. Add toolchain/runtime dependency, unsupported-binding, remote-binding, and live-smoke costs before comparing it with Nitro's already-Vite-based emitter.

## 3. [BLOCKER] Provider primitives do not satisfy NetScript's queue and saga contracts at the depth claimed

**Claim.** Rev2 says Cloudflare Queues are close to `MessageQueue`, Durable Objects are plausible saga/worker primitives, and the provider-suite depth is sufficient to flip Cloudflare to an owned adapter family (`research/nitro-vs-own-rev2.md:67-81`).

**Evidence.** A Cloudflare push consumer is an invocation-time `queue(batch)` handler, whereas `MessageQueue.listen()` is a caller-owned long-running loop with graceful drain/stop and `AbortSignal`; a pull consumer adds leases and REST acknowledgement, which is a different operational path requiring credentials and polling ownership. Batch retry also redelivers successful records unless they are individually acknowledged. Workers KV is eventually consistent and explicitly unsuitable for atomic operations/transactions; `KvStore.atomic()` is optional, but the adapter therefore cannot support CAS-dependent consumers and must be rejected by capability. Durable Object storage is private to one object instance, while `SagaStorePort` requires optimistic state saves, transition history, and a cross-instance correlation index (`packages/plugin-sagas-core/src/ports/saga-store-port.ts:22-48`), and T2 additionally reserves atomic state/outbox behavior. Rev2 acknowledges isolated guardrails but still uses the suite's breadth as the architectural flip and prices the first leaf as a small mapping exercise.

**Suggested disposition.** Treat each provider primitive as a separate feasibility card with an explicit activation model and capability subset. Do not use product-count breadth as evidence that a provider family satisfies NetScript's ports.

## 4. [MAJOR] The revised estimates are arithmetic assertions without a work breakdown and exclude work required by their own acceptance rule

**Claim.** Wrapping reduces Cloudflare HTTP to 2–4 weeks, a Cloudflare leaf to 1–2 weeks, AWS HTTP to 2–4 weeks, an AWS leaf to 1.5–3 weeks, and experimental Vercel to 1–3 weeks (`research/nitro-vs-own-rev2.md:46-65`).

**Evidence.** No estimate is tied to tasks, comparable delivery history, staffing assumptions, or uncertainty ranges for Deno/npm resolution, config/schema generation, credentials/IAM, provisioning, local-vs-live fixtures, failure recovery, and publish gates. Provider accounts and production soak are explicitly excluded at `:48-50`, yet the final decision rule requires native binding/event/config coverage and identical target conformance (`:181-187`), which cannot be established without provisioned live targets. The AWS estimate also counts Lambda Web Adapter's envelope translation as if it supplied leaf semantics (Finding 1), and the Cloudflare leaf estimate compresses the activation and durability gaps in Finding 3 into “semantic mapping.”

**Suggested disposition.** Replace point ranges with a task-level estimate and confidence grade; include account/IaC/live-conformance work or explicitly price it as a mandatory separate lane. Until then, do not use the estimates to choose architecture.

## 5. [MAJOR] `@netscript/deploy` is specified as both a neutral core and a cross-domain composition god-object

**Claim.** Rev2 proposes extracting a callable deploy core while keeping leaf semantics in leaf packages and preserving a one-way dependency `leaf ports <- provider adapters <- deploy <- CLI` (`research/nitro-vs-own-rev2.md:100-146`).

**Evidence.** Its proposed public surface makes deploy own physical topology, leaf bindings, capability requirements, artifact emission, resource resolution, provisioning, event activation routing, and adapter registration (`:130-141`). `ResourceBindingResolverPort` must understand KV/queue/database resource shapes, and `ActivationRouterPort` must retain queue/stream delivery semantics; those are exactly the leaf concerns the next paragraph says deploy must not absorb. If deploy composes leaf-owned provider adapters, it must import every leaf contract and selected provider package; if leaf packages import deploy declarations, the stated dependency direction cycles. Shipping adapters from each leaf also multiplies provider SDK/tool dependencies and JSR subpath/export gates across KV, queue, database, workers, sagas, triggers, and streams, but rev2 provides no package graph or publish-surface budget. This conflicts with doctrine's small published-surface rule and its prohibition on god interfaces/premature abstraction (`docs/architecture/doctrine/02-public-surface.md`; `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md` AP-3/AP-9).

**Suggested disposition.** Require an explicit package/import graph and adapter-registration ownership before accepting `@netscript/deploy`. Keep provider contributions outside the neutral core and prove that deploy can compose them without importing leaf implementations or provider SDKs.

## 6. [BLOCKER] The UR delta table is not a filable branch and contradicts the canonical issue bodies it claims largely survive

**Claim.** Rev2 says UR-0/UR-1/UR-3/UR-4 “survive in intent,” replaces UR-2's Nitro ownership, generalizes UR-5/UR-6, expands UR-11, and rewrites UR-12 (`research/nitro-vs-own-rev2.md:163-179`).

**Evidence.** The canonical DAG and bodies are Nitro-specific across those supposedly surviving cards: UR-0 blocks and delegates close to the Nitro host (`design/canonical/UR-0.md:10,18-24,42-44,61-62`); UR-2 is titled “Nitro owns listener/lifecycle” and makes Nitro the sole listener (`design/canonical/UR-2.md:3,18-33`); UR-3 depends on UR-2 and assigns routing/assets to Nitro (`design/canonical/UR-3.md:9,22-24,37-41`); UR-4 gates H3 matching and Nitro error behavior (`design/canonical/UR-4.md:24-29,44-48`); UR-5 drains on Nitro close (`design/canonical/UR-5.md:34-35`); UR-6 requires pinned Nitro and names Nitro preset cells (`design/canonical/UR-6.md:22-29,41-54`); and UR-12 requires the Nitro-pinned suite (`design/canonical/UR-12.md:19-27`). Replacing UR-2 changes downstream bodies, dependencies, titles, acceptance, briefs, and the filing manifest—not just four rows. Rev2 supplies none of the exact alternate canonical artifacts, labels, DAG transforms, or an owner fork, so filing “under” this table would either file the old Nitro board or improvise a different board after ratification.

**Suggested disposition.** Do not file from this delta table. Treat provider-native HYBRID as a new owner fork requiring a complete canonical branch (all affected bodies, DAG, labels, milestones, briefs, slot map, and manifest) plus another adversarial/PLAN-EVAL pass.

## 7. [MINOR] The Vercel maintenance evidence supports “experimental,” but not the quoted delivery estimate

**Claim.** Rev2 cautiously retains Nitro as the Vercel default while pricing a `vercel-deno` challenger at 1–3 weeks (`research/nitro-vs-own-rev2.md:34,58,157-158`).

**Evidence.** The live repository is current but extremely small (20 commits, 11 stars, zero forks, no releases, no open issues/PRs at review time); its README requires a community runtime version in `vercel.json`, installs Deno separately for builds via a remote shell script, uses different Deno behavior under `vercel dev`, and positions the runtime for simple functions rather than full applications. The committed extract records most of these facts (`evidence/nitro-vs-own-rev2-live-2026-07-18.md:5-11`) but no production-scale compatibility or maintenance history supports a 1–3 week conformance challenger.

**Suggested disposition.** Keep it research-only and remove the delivery range until a minimal NetScript build/deploy probe measures the builder and runtime gaps.
