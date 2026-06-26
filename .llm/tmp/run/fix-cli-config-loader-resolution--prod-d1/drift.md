# Drift — Fix prod CLI config-loader resolution

## 2026-06-27 — minor — local plugin group import

Scoped package check found `packages/cli/src/local/features/plugins/plugins-group.ts` still
importing the removed `pluginListCommand` symbol. This is not a scope expansion; it is the local
contributor command tree consuming the same public plugin list command factory. Added the concrete
file to S1 and routed it through `dependencies.loadConfig`.
