# DP-9 — Aspire pipeline composition: keep-or-delegate per seam

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`, **r4** —
> the owner-directed pre-filing composition pass (PR #891 review comment, 2026-07-19). The
> family architecture (DP-0…DP-8, plan.md) stands as ratified; this addendum decides, per
> deployment-pipeline seam, whether the plugin **delegates to Aspire's shipped deployment
> stack** or **owns the seam** — and why. Evidence: aspire.dev deployment docs (TypeScript tab,
> `?aspire-lang=typescript`) + microsoft/aspire#18696 (merged) / #18759 (open); doctrine steer:
> Aspire is a first-class citizen; the non-Aspire fallback is deferred and must not shape the
> core.

## 0. Ground truth that binds this addendum

1. **Two Aspire verbs, one rule** — `aspire publish` = "a one-way handoff out of Aspire"
   (target artifacts, parameters unresolved); `aspire deploy` = "Aspire stays in control …
   resolve parameter values, and apply the deployment in one operation". Crucially:
   **"`aspire deploy` does not consume previously published assets."** Aspire has no
   internal publish-artifact → deploy hand-off; its documented CI shape is registry-tagged
   images (`aspire do push`) + emitted files carried by upload-artifact + an external applier.
2. **The pipeline model is the extensibility surface** — a step DAG with well-known steps
   (`Build`, `Push`, `Publish`, `Deploy` + prereqs), driven by `aspire do <step>`, discoverable
   without executing via `--list-steps`. **Aspire 13.0 replaced the callback-annotation system**
   (`PublishingCallbackAnnotation`/`DeployingCallbackAnnotation` are listed as *removed* on the
   pipelines page even though the custom-deployments page still teaches them) — do **not**
   design against the annotation names.
3. **TS-availability split** — language-agnostic CLI (publish/deploy/do/destroy,
   `--environment`, `--output-path`, `--list-steps`, `--clear-cache`), parameters/secrets
   (`addParameter({secret:true})`, `Parameters__*`), compute-environment registration, and
   **application-level `builder.pipeline.addStep(name, fn, {requiredBy/dependsOn})`** are all
   available from a TypeScript AppHost. **C#-only today:** custom resource types, resource-level
   `WithPipelineStepFactory`/`PipelineStep`, `IResourceContainerImageBuilder`,
   `PipelineActivityReporter`, `appsettings.{env}.json` overlays ("Custom resource types and
   callback-based deployment extensibility aren't yet available in the TypeScript AppHost
   SDK").
4. **No Deno publish helper** — the JS-apps deployment page covers Vite/Next/Svelte/Node
   helpers with auto-generated Dockerfiles; a generic executable (how NetScript's Deno services
   register) has **no documented publish path**. This gap is real and is exactly what
   `deploy-container` fills.
5. **Deployment state caching** — `~/.aspire/deployments/{AppHostSha}/{environment}.json`
   stores *prompted provisioning/parameter values* per app × environment; `--clear-cache`
   deletes it; it may contain secrets in plaintext (CI caching needs access control). It is a
   provisioning-answers memory — **not** a build-artifact cache and **not** rollback history.

## 1. The delegation rule

**When the project graph declares an Aspire compute environment, the pipeline mechanics belong
to Aspire; NetScript owns what Aspire does not have** — the capability/topology verdict, the
artifact-manifest hand-off contract, deploy-time `status`/`logs`/`rollback`, the environments
*overlay file* (a documented TS gap), workflow *generation*, and the Deno container path. The
eight-op port is unchanged; what changes is **how the Aspire-lane ops are realized** (delegation
depth), codified per seam below.

## 2. Keep-or-delegate, per seam

| Seam (RFC) | Verdict | Realization |
| --- | --- | --- |
| `emit` (Aspire-managed targets) | **DELEGATE** mechanics, **KEEP** the manifest | `aspire publish --output-path` emits the per-environment artifacts (compose+`.env`, k8s, Bicep, Helm); `EmittedArtifactManifest` wraps them — file list + digests + registry image tags. Aspire has no manifest contract; ours formalizes the hand-off its CI example leaves to upload-artifact conventions |
| `up` / `down` (Aspire lane) | **DELEGATE** | `aspire deploy` / **`aspire destroy`** (the pipeline teardown command — replaces the r3 card's compose-down-only story where applicable) |
| `plan` | **COMPOSE** | The capability/topology verdict is ours (Aspire has nothing comparable); on Aspire targets `plan` additionally surfaces `aspire deploy --list-steps` (the built-in no-execution dry-run) as the pipeline-step section of the plan output. `plan` stays pure |
| `up --prebuilt` | **KEEP** | Aspire explicitly does not consume published assets in `deploy`; our manifest + digest-verified applier IS the missing contract. On Aspire targets `--prebuilt` = pre-pushed registry tags (`aspire do push`) + the emitted files applied by the platform applier — the documented Aspire CI shape, formalized |
| `status` / `logs` / `rollback` | **KEEP** | No deploy-time Aspire equivalent (the dashboard is dev-time telemetry); conventions + platform-native mechanisms per adapter card, unchanged |
| `secrets` | **COMPOSE** | On Aspire targets the reference model adopts Aspire's parameter convention — `addParameter({secret:true})` + `Parameters__<name>` env injection — instead of inventing a second channel; rotation/redaction lifecycle stays ours (Aspire only prompts/injects) |
| `--env` / environments overlay | **COMPOSE** | Selection **delegates**: NetScript `--env <name>` passes through as `aspire --environment <name>` (case-insensitive; align the default to Aspire's `production` on deploy/publish). The **overlay file stays ours**: `appsettings.{env}.json` overlays are C#-only — the RFC's `environments` config overlay fills a documented TS gap, it does not duplicate |
| Deployment state | **DELEGATE** (Aspire lane) | Per-env provisioning state lives in Aspire's cache (`{AppHostSha}/{env}.json`); the adapter surfaces `--clear-cache` and keeps the shipped CI guidance (never persist without access control — plaintext secrets). Orthogonal to our artifact manifest (build artifact ≠ prompted state) |
| OCI build (`deploy-container`) | **KEEP, converge later** | `ContainerBuildPort` stays: `IResourceContainerImageBuilder` is C#-only and no Deno/generic-executable publish helper exists — we fill the gap. Convergence path named: on Aspire-managed graphs prefer `aspire do build`/`aspire do push` as the build/push backend where the resource is one Aspire can build; revisit if upstream ships a Deno publish helper |
| CI workflows | **KEEP** (generator), **MODEL** on Aspire | Aspire documents an example workflow, it ships no generator. Our per-target workflow generation stays — and the Aspire-lane workflow adopts the documented shape verbatim: `aspire do push` (registry params via `Parameters__*` secrets) → `aspire publish --output-path` → upload-artifact → applier |
| Pipeline extensibility | **NEW integration point** | The TS-available `builder.pipeline.addStep(...)` lets the **generated NetScript AppHost helpers register deploy-plugin steps inside Aspire's own pipeline** — first candidate: a `netscript-capability-check` step `requiredBy: ["deploy"]`, so the capability compiler (L-3) also gates a raw `aspire deploy` invoked without the NetScript CLI. Resource-level factories/image-builder access would require a C#-side hosting integration (the #825 `NetScript.Aspire.Packaging` NuGet is the established vehicle) — **not v1**, recorded as the escape hatch |

Net effect on the r3 corpus: **no port, package, or board-shape change.** The Aspire adapter
card deepens its delegation; two core notes (secrets convention pass-through, `--env` mapping)
and one plugin note (AppHost pipeline-step registration) are added; the rest of the family
(deno/container/cloudflare/vercel/aws lanes) is untouched — those platforms are precisely where
Aspire's pipeline does not reach.

## 3. Radius — the tracked convergence (enterprise CI/CD)

- **microsoft/aspire#18696 (merged 2026-07-10):** `Aspire.Hosting.Radius` makes Radius a
  first-class **compute environment** — a peer of Kubernetes/DockerCompose/ACA, registered via
  `AddRadiusEnvironment`, run-mode inert, with the full verbs: `aspire publish` emits a native
  `app.bicep`; `aspire deploy` transparently runs `rad deploy`. In-code Azure/AWS providers with
  typed credential modes sourced from secret parameters (never inlined). Follow-ups add recipe
  parameters, secret stores, resource groups.
- **microsoft/aspire#18759 (open):** the same surface **projected into the TypeScript AppHost**
  via ATS — cloud-provider callbacks and typed Bicep-infrastructure customization from TS.
- **Radius model** (docs.radapp.io): server-side control plane — Applications, Resource Types,
  **Recipes** (Bicep/Terraform, per-Environment, swappable), Resource Groups; `rad deploy`
  executes recipes via the deployment engine; **credentials live in the Radius control plane**
  (`rad credential register azure|aws`), not the developer's shell.

**Position:** Radius enters the family as a **`deploy-aspire` target key (`radius`)** — not a
new adapter package — because upstream already routes it through the exact verbs the adapter
wraps. Gate: #18759 merged + released in the pinned Aspire CLI + the TS surface stable. Its
capability manifest rows come from what the bound Recipes provide (binding-scope, per L-2). The
control-plane credential model is a **strength** for the enterprise story (no cloud secrets in
CI at all) and slots into the `secrets`-op reference model unchanged. Tracking home: the
DPB-29 deferred-RFC card (scope widened) + a watch item on the aspire-adapter card.

## 4. Honest constraints (carried into docs and cards)

1. TS AppHost extensibility is application-level `pipeline.addStep` only; anything
   resource-level or the programmatic image builder needs the C#/ATS route (#825 vehicle) —
   never claimed for v1.
2. Aspire's own docs currently disagree about the callback annotations (13.0 pipeline migration
   vs the custom-deployments page); the adapter binds to the **CLI + pipeline-step surface
   only**, which is stable across both readings.
3. Deployment state cache may hold plaintext secrets — the CI guidance (access-controlled
   cache or re-prompt via `Parameters__*` env) ships with the Aspire-lane workflow template.
4. `aspire publish/deploy` default environment is **production** — the adapter aligns
   NetScript's default rather than fighting it.

## 5. Corpus amendments carried by this addendum (r4)

- **DP-2 §2/§6:** `--env` pass-through mapping + default alignment; `secrets` adopts the
  Aspire parameter convention on Aspire-managed targets; `plan` composes `--list-steps` there.
- **DP-3 §1 (deploy-aspire card):** `down` via `aspire destroy`; state-cache delegation +
  `--clear-cache`; pipeline-step integration; Radius watch row (#18696/#18759).
- **DP-4 §4:** scaffolder's generated AppHost helpers register the `netscript-capability-check`
  pipeline step.
- **DP-5 map:** Aspire row extended (pipeline steps + Radius); no other wrap change.
- **plan.md:** DPB-8 acceptance gains the pipeline-step + destroy + state-cache items; DPB-29
  scope gains the Radius graduation RFC; risk register: upstream doc/API churn on the pipeline
  surface (mitigated by CLI-only binding).
- **rfc.md / PR #891:** Addendum A summarizing this document.
