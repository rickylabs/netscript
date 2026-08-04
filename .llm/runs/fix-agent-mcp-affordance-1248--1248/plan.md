# Plan

1. Inject terminal detection and guidance output at the command boundary.
2. Return before server startup only for interactive stdin; preserve piped stdio behavior.
3. Test interactive guidance, both editor snippets, and silent server dispatch.
4. Update help and client-configuration documentation; run targeted CLI gates.

Per D6, no local PLAN-EVAL is spawned.

