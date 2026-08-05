# Context Pack — fix-plugin-linking-seam-1189--1189

- Target: `canary/0.0.5-canary.13`; PR must not target main.
- Issue #1189 is authority; eight acceptance boxes and full runtime/OTEL protocol apply.
- Decisive proof is a fixture third-party plugin; official plugins are compatibility only.
- Plan: optional top-level manifest `linking`, explicit producer/consumer identifiers, generic scan,
  one reconciler across plugins/background/services/apps.
- D6: no local PLAN-EVAL; orchestrator pre-merge gate owns final evaluation.
- Lock: preserve only inherited `jsr:@netscript/queue@0.0.4` row; never stage it.
