# Plan

## SKILL

netscript-doctrine, netscript-harness, netscript-pr, netscript-tools, netscript-deno-toolchain and jsr-audit.

## Contract and locked decisions

Add optional AuthConfig.rateLimit and AuthConfigInput.rateLimit with native customRules: a record of endpoint paths/patterns to positive integer window (seconds) and max. Match provider field vocabulary; permit JSON data only, no disabling booleans, callbacks or unrelated provider options. Validate paths start with slash. Absence remains absence, with no forced enabled/global defaults.

AuthServiceAppsettings accepts auth.rateLimit and Auth.RateLimit, each using the same nested customRules shape. Lowercase wins when both styles supplied, matching existing appsettings precedence. Better-auth registry validates the section through AuthConfigSchema and forwards only configured customRules via the existing betterAuthOptions.rateLimit. Other backends remain unchanged.

No new production factory/test seam. A native Deno import-map test wrapper observes the provider constructed by the real registry, calls the original factory, and sends real production sign-in Fetch requests to prove configured throttling. This preserves the existing backend port and its non-interactive semantics.

## Slices

S1: bootstrap artifacts, red schema and real provider behavior regressions (under15files).
S2: schema/type first, registry forwarding, tests green and docs for native path patterns, seconds, production default and per-instance storage (under15files).
S3: generated docs/consumer refresh; scoped check/test/lint/fmt, quality:gate, doc lint/JSR audit, release:preflight, docs:accuracy; independent IMPL-EVAL; issue/body evidence and required head checks/thread gate (under20files).

No full scaffold.runtime: no scaffold output, Aspire helper generation or executable/runtime wiring changes; only auth config/provider options. No changes to auth service runtime (owned by independent PR2641), saga transports or Redis Streams. No lock/dependency changes.

## Risks

Changing absent defaults -> omit provider rateLimit entirely when not configured. Global override ineffective on sign-in -> customRules only and real production request test. Provider IP buckets shared per path -> subprocess isolation per contract case; fixture IPs only. Config casing drift -> test both appsettings styles. Validation bypass -> registry parses through shared schema.
