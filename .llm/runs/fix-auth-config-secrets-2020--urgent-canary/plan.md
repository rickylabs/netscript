# Plan

## Locked decisions

Existing auth writer owns .env and appsettings; existing Aspire partition owns literal refusal. Keep credentials and provider settings solely in .env; tracked canonical NetScript.Plugins.auth.Environment contains NETSCRIPT_AUTH_BACKEND only. Reconciliation removes legacy upper/lower top-level auth environment/backend duplicates and plugin Env alias while preserving unrelated fields. Show reads canonical plugin selector after .env, then legacy backend fallback.

Render each auth assignment as a POSIX literal with single-quote escaping; reject NUL before any write. Frame generated multi-line assignments without executing input, replace every duplicate occurrence of keys being reconciled, preserve unrelated entries/comments. Backend reader accepts new quoted and old plain selector. Do not parse arbitrary shell programs or rewrite unrelated environment entries.

Use native Cliffy env bindings for OAuth secret/encryption key, WorkOS key/password and better-auth secret, keeping flag precedence. Docs use environment-provided credentials instead of argv examples, explain ignored .env, tracked selector and refusal, and explicitly instruct source/export for hostile shell literals before AppHost. Direct Deno env-file is supported for simple values; no arbitrary parser-grammar promise.

Aspire refuses declared credential-shaped keys (SECRET, PASSWORD, TOKEN, API_KEY, OAUTH_KEY, CREDENTIAL, including prefixed/separator variants) and never copies their values into literals/comments. PORT refusal and non-secret resource environment behavior unchanged. No external secret-manager policy or auth backend API changes.

## Design and slices

S1 auth persistence/quoting: auth-config.ts, consumed auth-env.ts and focused auth-config-security_test.ts; existing auth command tests corrected to assert safe tracked state and runtime environment consumer. Gates: actual POSIX source/export with hostile strings, duplicate/multiline rewrite, all provider variants, canonical fallback, meaningful source mutants and restored suite.
S2 generated/command credential seams: existing resolve-resource-environment.ts, auth-plugin-command.ts, focused generator refusal and native env-input cases in the security test, existing generator expected literal corrected. Actual provider-set + helper generation confirms no credential values in tracked output; full affected generator tests and native CLI parse. Every new test has isolated assertion-red mutation.
S3 auth how-to and generated carriers; source/docs formatting, accuracy/examples, export/prose/publish/asset freshness, CLI publish dry-run, canonical quality gates, full one-pass scaffold.runtime through capable CI. Independent IMPL-EVAL mandatory at exact source revision. Each commit below thirty files. Draft opened with bootstrap and updated at phases.

## Risks and gates

Credential migration: prune obsolete duplicate blocks so old leakage is not retained; selectors and unrelated config assertions. Hostile values: actual sh child exports byte-identical JSON environment into Deno, proves no substitution stderr/side effects; POSIX-only gate classified accordingly. NUL rejected transactionally before writes. Multi-line updates: repeated reconcile and duplicate fixture prove no orphan commands. Input safety: native parser bindings, no secrets in output/help examples. Generator false positives: credential-shaped key matrix plus allowed plain keys and unchanged endpoint refusal. No dependency additions or updates.

Required gates: source check/lint/fmt for auth and changed helper plus existing broader CLI check; focused/auth/generator test wrappers; all added-test red/restore mutations; existing generated consumer checks and actual shell-to-Deno environment child; docs accuracy/JSDoc fence integrity and source format; quality:gate; CLI publish dry-run; all generated carriers. Aspire helper output changes require full scaffold.runtime one-pass gate before merge readiness. Shared main critical advisory requires separate owner maintenance; do not bundle dependency changes or claim green CI. Published CLI E2E is post-publication authority, no publication authorized in this run.

## Open-decision sweep and deferred scope

No blocking design decision remains: owner explicitly chooses POSIX sourceability. Loader grammar limitation is documented and proved via exported process environment; generic deploy .env renderer and cross-platform shell programs outside scope. Secret manager integration, credential rotation workflows, release publication, other plugins and owner dependency maintenance deferred. No architecture debt introduced. If runtime capability/CI prevents acceptance, retain draft and exact evidence; no merge.
