# 2026-10-31 — Generated Aspire quality ordering

Aspire helpers import `.aspire/modules/aspire.mts`, created by `aspire restore`. Deno-only CI test shards do not install/restore Aspire. The ordinary consumer regression checks userland/registries and lints every helper without starting services. The opt-in runtime proof restores Aspire and then checks all helpers against the actual SDK before startup. A missing SDK is not a product type regression; do not add fake SDK declarations to the acceptance consumer.

`NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` is the shared settings/KV context with a lazy database accessor; it is not a SQL connection binding. No-DB assertions ban actual database URL/provider/environment/model contributions. Detached runner omits this generic host context entirely.
