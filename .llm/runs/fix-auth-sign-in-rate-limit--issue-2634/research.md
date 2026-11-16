# Research

Read issue #2634 in full. AuthConfigSchema drops unknown rateLimit input; registry passes only Prisma/provider/secret to createNetscriptBetterAuth. Existing betterAuthOptions already forwards provider-native options. Installed better-auth1.7.14 primary source confirms production-only default enabled, sign-in special rule3 requests/10seconds per IP and normalized path, special rules replace global max/window, customRules run after special rules. Storage defaults to provider in-memory buckets unless secondary storage exists.

Plugin better-auth backend is non-interactive; its provider owns sign-in routes. This fix configures that provider and does not add interactive unified-auth endpoints. Existing lower auth and upper Auth appsettings styles are supported.

Read doctrine public-surface/composition, harness Archetype2 Integration plus contract and service/docs concerns, skills netscript-doctrine/harness/pr/tools/deno-toolchain/jsr-audit, relevant package exports/README and provider tests. Inspected public AuthConfig through deno doc and resolved installed provider through deno why. No dependency change needed.
