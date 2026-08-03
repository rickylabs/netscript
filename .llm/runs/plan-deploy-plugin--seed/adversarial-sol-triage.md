# Triage — Sol xhigh adversarial findings (SF-1…SF-16)

Supervisor (Fable 5, generator session resumed) triage of `adversarial-sol.md` (commit
`9ed2eeab`). Verdict adopted: the corpus is a sound baseline; all sixteen findings are
**ACCEPTED** — the reviewer verified claims against the shipped file graph with line citations,
and every amendment is adoptable without breaking the ratified concept. Fixes land as corpus
revision **r2** (this commit series). Where an amendment is adopted with a variation, the
disposition says so.

| Finding | Sev | Disposition | Landed in |
| --- | --- | --- | --- |
| SF-1 `DEFAULT_DEPLOY_TARGETS` in core = dependency inversion | BLOCKER | **ACCEPT** — core owns only the empty duplicate-rejecting registry + port + key/error types; adapters export factories/descriptors; composition roots supply entries; W1 keeps the compat constant in the CLI composition root; debt retirement made conditional | DP-2 §1/§6, DP-6 M-2 |
| SF-2 W1 is not a behavior-free move | BLOCKER | **ACCEPT** — W1 recut into ordered refactor-then-extract sub-slices; `runtime-overrides.ts` stays with bare-metal/leaf owners; build extraction moves to W2 (`deploy-baremetal`), adapter-neutral compile emitter graduates to core only after ports exist | DP-2 intro, DP-6 M-3/M-4, plan §5 |
| SF-3 Installer manifest sketch protocol-invalid | BLOCKER | **ACCEPT** — complete manifest (required metadata, permission string arrays); `officialSource` generalized with a `sourceKind: 'tooling'` variant; protocol change added to the host-extension slices with parse/copy/compat fixtures | DP-4 §3/§5 |
| SF-4 `cli-command` axis lacks discovery-to-startup path; shadow exception unsafe | BLOCKER | **ACCEPT** — host-owned reserved `deploy` shell (owns `desktop`, install hint, shared help); contributions are mount-children `{mount,id,loader}` that never shadow top-level commands; async CLI bootstrap; duplicate `(mount,id)` fails before parsing; manifest-loader (not AST-walker) feeds the registry; `verify-plugin` gains cliCommands/doctorChecks expectations | DP-4 §5/§6/§7, plan OF-3 |
| SF-5 `plan` cannot be both preview and emission | MAJOR | **ACCEPT** — eight-op lifecycle: `plan` pure (serializable `DeploymentPlan`), `emit` materializes content-addressed artifacts + provenance, `up --prebuilt <manifest>`, plain `up` = convenience composition | DP-2 §2, plan LD-3, DP-3 refs |
| SF-6 Flat closed capability vocabulary couples core to leaves | MAJOR | **ACCEPT** — structural `CapabilityRef` (namespaced, versioned) + `BindingRequirement` + `WorkloadConstraint`; core owns structures + a small runtime-trait vocabulary only; R-GRAPH-1 reworded ("core imports no leaf package; leaves contribute descriptors through structural contracts") | DP-2 §4/§5, DP-1 §2 |
| SF-7 Manifest rows unsupported / mode-collapsed | MAJOR | **ACCEPT** — per-target-**variant** manifests; `CapabilityVerdict {level(+unverified), scope, evidence}`; aspire queue/exclusive-writer claims withdrawn until conformance cells; bare-metal rows enumerated; Deno KV atomicity judged by the atomic conformance suite (the adapter implements CAS); `lossless` requires a live-platform cell | DP-3 §0–§7 |
| SF-8 Macro-service split promised without a topology contract | MAJOR | **ACCEPT** — `DeploymentCell`/`DeploymentTopologyPlan` added; v1 cells user-declared in `deploy/targets.ts`; compiler returns `suggestedCells` but rejects, never partitions silently; CF/AWS stories narrowed to one compute variant until the topology slice lands | DP-2 §5, DP-8, plan §5 |
| SF-9 Legacy verb aliasing collapses non-equivalent semantics | MAJOR | **ACCEPT** — OF-5 flipped: legacy flat commands remain first-class compat handlers owned by `deploy-baremetal` through the next semver-major; only `build → plan+emit`, `status`, `logs` are direct aliases; state-transition tests required | DP-2 §2, DP-6 M-11, plan OF-5 |
| SF-10 Config/plugin bootstrap cycle; unknown targets silently stripped | BLOCKER | **ACCEPT** — two-phase config loader (bootstrap parse without stripping → resolve plugin/adapter schema loaders → compose target schema registry → full parse; unknown target ⇒ `DeployTargetAdapterMissingError`); frozen legacy union exported for the compat window; DP-7 depends on this slice | DP-2 §6, DP-6 M-5, plan §5 |
| SF-11 `deploy-container` exception = adapter-to-adapter dependency | MAJOR | **ACCEPT** — exception deleted; CF/AWS accept an injected core-owned `ContainerBuildPort`; composition roots inject `deploy-container`'s implementation; new import gate: no `deploy-*` imports another `deploy-*` | DP-1 §2, DP-3 §5/§7 |
| SF-12 Peer-install composition + permission model unspecified | MAJOR | **ACCEPT** — plugin depends only on core; `DeployTargetContribution {key, targetLoader, schemaLoader, permissions}` descriptors written by `target add` into the generated registry; doctor + launcher report the per-target permission profile (no aggregate all-provider permission claim) | DP-4 §1–§3, DP-1 §2 |
| SF-13 "Duplicate-guarded / closed-on-key preserved" is false | MAJOR | **ACCEPT** — duplicate rejection marked NEW; `DeployTargetCollisionError`; composition-root-only `replaceForCompatibility` for the W1 shim, removed after | DP-2 §6, DP-6 M-2 |
| SF-14 Doctor union + deploy flag repeat the closed-host pattern | MAJOR | **ACCEPT** — `DoctorCheckContribution {id, loader}` registry (data, duplicate-guarded) instead of union widening; `capabilities.contributionAxes` instead of `contributesDeployTargets` | DP-4 §2/§3/§5, plan LD-9 |
| SF-15 Board hides oversized W1/host work; dependency gaps | MAJOR | **ACCEPT** — board recut to 28 children (+epic = 29): DP-1 split ×4, host extensions ×3, container ×2, AWS ×2, +1 compatibility-gate issue; dependencies corrected (plugin composition ← adapters+schema loader; Story-0 E2E ← target-add CLI; CF ← OCI slice; mounts ← async bootstrap) | plan §5 |
| SF-16 Zero-app-code-diff gate too broad | MINOR | **ACCEPT** — gate scoped to a canonical fixture within the declared runtime profile; `plan` performs dependency/API compatibility analysis with file-level diagnostics; runtime-profile contract (deno-native / web-standard / node-compat) published per adapter | DP-7 §3, DP-8 |

## Quick wins — all applied

Typo fix (DP-2 §6); "eight-op" naming reconciled everywhere; explicit config-key ↔ registry-key ↔
CLI-target mapping note; Story 0 single flow (`target add` explicit; no preinstalled default
target); runtime-config wording ("checked at each CLI/CI invocation"); manifest `schemaVersion` +
adapter/tool versions + probe date + evidence id; doctor distinguishes
`unsupported | unverified | adapter-not-installed | credential-unavailable`; secret-reference
tests must prove absence in plans/manifests/telemetry/events/argv/errors; OF-2 graduation rule
expanded (auth/lifecycle/error-semantics/release-cadence divergence also graduates a client).
