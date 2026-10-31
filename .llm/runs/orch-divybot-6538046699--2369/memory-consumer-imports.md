# Copied database script imports

Database scripts ship into generated consumer workspaces that do not inherit root import aliases. Use literal JSR imports (as sibling scripts already do) or package-owned mappings for every runtime import. The new SQL-sidecar helper initially used bare @std/path; CI no-Aspire and generated-handler lifecycle tests exposed it, and jsr:@std/path@1 fixes it without a dependency-version change.

Focused structured regression paths: packages/cli/e2e/tests/presentation/init-no-aspire-operable_test.ts (two tests) and packages/cli/e2e/tests/application/gates/service-handler-generated_test.ts (two tests), with --allow-all --unstable-kv. These exercise generated DB command portability without running scaffold.runtime locally.
