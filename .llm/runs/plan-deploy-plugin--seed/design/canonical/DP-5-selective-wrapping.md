# DP-5 — Selective wrapping: Nitro, Aspire-native, own, and wrap targets

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.
> Applies the owner conformance rule (DP-0 L-1) and doctrine A7 (wrap-don't-reinvent) to every
> build/deploy surface. Evidence: `research/provider-deploy-surfaces.md`,
> `research/prior-run-distillation.md` §2/§5.

## 1. The decision rule, restated for wrapping

Wrap an upstream surface iff it is (a) the provider's first-class, maintained path, or a
well-written standard package; (b) callable behind a NetScript-owned port without leaking its
types into the public surface (AP-14); and (c) cheaper to maintain than owning the translation.
Prefer **invoking supported CLIs at the process boundary** over importing SDKs — the process
boundary is the thinnest possible wrap seam and keeps vendor weight out of the module graph
(DP-1 §5). Implement ourselves where the semantics are NetScript's value (conventions,
capability compiler, ports) — "own the semantics; rent the volatile provider translation."

## 2. The map

| Surface | Decision | Instrument | Rationale |
| --- | --- | --- | --- |
| Deploy semantics: ports, registry, capability compiler, conventions (activation/secrets/rollback/health/otel), binding transport | **Own, enterprise-grade** | `plugin-deploy-core` | This IS the product; no upstream owns these semantics (L-1). Already built target-agnostic in the CLI kernel — extraction, not invention. |
| Local/dev + self-host orchestration | **Aspire-native** | `@netscript/aspire` substrate + `deploy-aspire` shelling `aspire publish/deploy/destroy` | Aspire is where polyglot AppHost composition, dashboard, OTLP, and azure/k8s emission already work; reimplementing its publish pipeline fails the rule. Aspire stays the *composer/executor* — never enters the composition contract (same L-1 line as Nitro). |
| Deno Deploy | **Wrap** `deno deploy` CLI + `deno.json` deploy section | `deploy-deno` | First-party, Deno-native, token+org auth; wrapping deployctl-era surfaces is dead (Classic sunset 2026-07-20). |
| Cloudflare Workers | **Wrap** `wrangler` (invoke) + emit `wrangler.jsonc` + Web-standard entry | `deploy-cloudflare` (CF-PROBE) | Provider-owned Node tooling *callable from* Deno (adversarial F2 framing — honest, not "Deno-native"); the alternative (raw CF REST script upload) forfeits bindings/config/versions management wrangler owns. |
| Cloudflare Containers / Fly / koyeb / sevalla / coolify / dokploy / (cloud-run) | **Wrap platform REST APIs** over one owned container path | `deploy-container` + subpath clients | All are image+env platforms (L-6); the owned piece is Dockerfile/OCI emission + the generic platform port; each client is a thin JSON mapping. |
| Vercel | **Wrap Build Output API v3** (emit `.vercel/output`) + `vercel deploy --prebuilt` | `deploy-vercel` | The API exists precisely for framework authors ("framework-defined infrastructure") — the highest-quality wrap seam in the set. |
| AWS HTTP hosting | **Wrap Lambda Web Adapter** (container layer/binary) | `deploy-aws` (AWS-PROBE-HTTP) | AWS-official, portable image (Lambda/Fargate/EC2); scope-limited to HTTP by adversarial F1. |
| AWS IaC | **Wrap Pulumi Automation API** (optional subpath) | `deploy-aws/pulumi` | Apache-2.0, embeddable inline programs, no vendor account; the only cross-cutting IaC dependency that passes the rule. |
| Serverless Framework v4 | **Reject** | — | Login + license key; paid tier >$2M revenue — unacceptable in an open framework's deploy path. |
| SST ion | **Reference only** | — | MIT but components are welded to SST's runtime/resource-linking; study, don't depend. |
| OpenTofu | **Hold** | — | Only if a Terraform-shaped declarative lane is ever demanded; no current card. |
| Queue/KV/DB/saga provider primitives (SQS, CF Queues/KV/DO, DynamoDB, Upstash…) | **Leaf-owned wrapping, never deploy's** | future leaf adapter packages (`@netscript/queue-sqs`, `kv-cloudflare`, …), each behind its leaf port with a conformance card | R-GRAPH-4 / adversarial F3: activation semantics, ack models, and consistency are leaf feasibility questions. Deploy only transports bindings by name. |

## 3. Nitro: the conditional re-entry path (owner fork OF-7)

Position: **no Nitro dependency anywhere in the family.** Grounds (research §7): presets are
coupled to Nitro's rollup pipeline and not programmatically consumable without adopting the whole
Nitro build; its `deno_server` preset is Node-built ("build … using Node.js to run within Deno
Runtime") — against the goal frame; its runtime layers (storage/tasks/db0) were already excluded
from the composition contract (L-1). The presets remain a **reference corpus** (MIT): when
authoring an emitter (`.vercel/output`, `_worker.js` shapes), read the corresponding preset as
prior art and cite it in the adapter card.

Re-entry condition (kept precise so "sprinkle some nitro where it makes sense" stays possible):
if a target emerges where Nitro's preset demonstrably beats an owned emitter **under the L-1
conformance rule** (same suite, full native surface, cheaper to maintain), it enters as
`@netscript/deploy-nitro` — an `ArtifactEmitterPort` implementation that runs a full Nitro build
as a tool — competing per target, never hosting, never touching leaf ports. Candidates would be
long-tail presets we won't hand-write (netlify, firebase, zeabur…). This is exactly the rev1
HYBRID position, now scoped to an optional adapter package instead of the host role.

## 4. What "enterprise-grade, implement ourselves" concretely covers

The pieces where NetScript's quality bar is the differentiator and no wrap exists:

1. **Capability compiler + manifests** (DP-2 §4) — build-time rejection, backend-truthful
   discovery. No framework ships this; it is the credibility mechanism.
2. **Activation/rollback conventions** — health-gated symlink/dir-swap with retain history;
   platform-native rollback mapped per adapter, never silently absent (A13).
3. **Secrets reference model** — references + redaction end-to-end (config, artifacts, logs,
   telemetry, stream events); rotation with overlap windows (auth S9 pattern) as a follow-up
   card.
4. **Deploy event stream** — versioned audit envelope on `plugin-streams-core` (DP-4 §4).
5. **The conformance suite** (DP-3 §0) — target × capability × invariant matrix in CI; the
   family's acceptance instrument and the enforcement of L-1 for every future wrap-vs-own flip.
