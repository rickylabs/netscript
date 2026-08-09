# Context Pack: #1379

Branch `fix/gate-fresh-ui-package` at base `2e7c845ad`. Research and planning select
frozen-private-lock: refresh the existing private lock once, then enforce native Deno `--frozen`,
scoped type-check/lint, and a clean-tree CI invariant. No product API or Fresh UI source changes.

Owner controls mandatory IMPL-EVAL, CI, and merge. No runtime token exists and no Aspire/container
work is in scope.

S1 implementation is gate-green before commit: package-scoped check/lint/fmt, real frozen-lock
regression, root check/lint/fmt, quality scan, and doctrine aggregate all exit 0. Type, lint, and
lock mutations each exit 1 with distinct diagnostics. The remaining mechanical proof is to run the
exact workflow commands from the committed clean head and post the empty-status receipt.
