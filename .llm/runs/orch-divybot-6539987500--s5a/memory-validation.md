# 2026-10-31 — Baseline and gate recipes

Baseline release:preflight passes all four policies (zero import attributes,
file-url or self-import findings). Baseline docs:accuracy passes: 111/111 direct
commands, 176 recursive paths, 208 source pages, 203 shipped corpus files.
Root CI skips drafts: `ready_for_review` schedules the complete required set;
the external READY report still requires exact-head green checks.
The code name registry is tokens/role-manifest.json; apply the four explicit
name-migrations before comparing original WEB names. Never regenerate names
from a new value export. The existing public token engine accepts source JSON
and compiles through Fresh UI; no new CLI compiler is needed.
