# Research — beta5-impl--supervisor / 346-deploy

## Re-baseline

- Carried-in source: GitHub issue #346, viewed with `gh issue view 346 --repo rickylabs/netscript --json title,body`.
- Re-derived against checkout: `37e6818c4f7871d7d6f051c90e9734ec45fb4566` on 2026-07-06.
- Scope note: the issue body says `STABLE · Phase 3b · milestone 0.0.1-stable`; the slice prompt says beta.5. This artifact records the issue-body conflict for supervisor review while implementing only the explicit S10 acceptance surface.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The deploy feature already has an Archetype-7 target adapter seam: `DeployTargetPort`, `DeployTargetRegistry`, Docker/Compose Aspire adapter, Deno Deploy adapter, and a thin `deploy <target>` router. | `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`; `packages/cli/src/kernel/application/registries/deploy-target-registry.ts`; `packages/cli/src/public/features/deploy/target/target-deploy-command.ts` |
| 2 | `aspire publish`, `aspire deploy`, and `aspire destroy` exist locally and support `--apphost` plus `--output-path`; PR #491 adversarial review clarified that `--environment` is a deployment profile, not a platform selector. | `aspire publish --help`; `aspire deploy --help`; `aspire destroy --help`; PR #491 adversarial review |
| 3 | Aspire docs confirm TypeScript AppHost Kubernetes support: `builder.addKubernetesEnvironment('k8s')`, `publishAsKubernetesService(...)`, Helm chart publishing, and `helm`/`kubectl` apply flows. | `aspire docs get deploy-to-kubernetes-clusters`; `aspire docs get kubernetes-integration` |
| 4 | Aspire docs confirm AKS deployment through `builder.addAzureKubernetesEnvironment('aks')`, Azure CLI auth, subscription/location configuration, and Helm/Kubernetes apply behavior. | `aspire docs get deploy-to-azure-kubernetes-service-aks` |
| 5 | Aspire docs search did not return a target-specific ACA or App Service integration page in this environment; the safe implementation is an AppHost-validation adapter that refuses a mismatched AppHost before delegating to Aspire. | `aspire docs search "Azure Container Apps deploy Aspire ACA"`; `aspire docs search "Azure App Service deploy Aspire"` |
| 6 | Config currently recognizes windows/linux/docker/compose/deno-deploy only, so S10 target keys need schema/type additions. | `packages/config/src/domain/schemas/deploy-schema.ts`; `packages/config/src/domain/config-section-types.ts` |

## jsr-audit surface scan

- Surface scanned: package export maps are unchanged; this slice adds internal CLI/config types and docs only.
- Slow-type / surface risks: no new exported package entrypoint or `mod.ts` change. Full package checks/doc-lint/publish dry-run still planned because `packages/cli` and `packages/config` internals changed.

## Open questions

- Whether the issue should remain in beta.5 or stable: issue body and prompt disagree.
- Whether Cloud Run later needs explicit `region`, `project`, or service-name config beyond `registry`/`imageName`.
