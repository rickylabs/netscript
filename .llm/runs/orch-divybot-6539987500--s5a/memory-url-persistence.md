# 2026-10-31 — URL theme installation and native proof

Use the token engine's figmaSources adapter, then stage generated web files and
all editable sources through S2. Set tokens.config.json sourceRoot; capture that
config in fresh-ui.lock.json (the lock is not components.lock.json). Transferring
previous theme-owned overlapping baselines to a new URL preserves strict local
edit detection while allowing a second URL to replace managed sources. Keep
semantic overrides. Refuse custom roots before physical writes.

The actual one-command proof is
packages/cli/src/public/features/ui/apply/url-theme-command_test.ts. It serves the
modified Scheme/Theme item on loopback, runs local init --preset, actual ui:apply,
tokens build and generated workspace deno task check, then verifies bad schema
preserves lock/CSS. It passed in about65 seconds. Four real-engine URL service
tests take about120 seconds; 27 init/preset regressions take about10 seconds.
Public init uses deriveDefaultAppName when --app-name is omitted. Splitting the
feature flow leaves its presentation file at55 lines, below the150-line cap.

Issue2418 already carries milestone0.0.9; PR2504 mirrors it without labels.
