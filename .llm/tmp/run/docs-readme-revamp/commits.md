# Commits — PR2 package README revamp (PR #117)

C1 authoring landed as 6 per-family commits (31 READMEs rewritten from scratch via the Claude
authoring+critique+revise workflow; `docs/**/*.md` publish glob removed from the 24 `deno.json`
files that carried it). Rebased onto remote (PLAN-EVAL PASS + OpenHands traces), pushed
fast-forward `bb0b4844..9c497795`.

- 4cefa05c: docs(readme): revamp foundation package READMEs; drop docs publish glob
- fc6b28eb: docs(readme): revamp data package READMEs; drop docs publish glob
- bdd245ae: docs(readme): revamp plugin-core package READMEs; drop docs publish glob
- dbd2e080: docs(readme): revamp plugins package READMEs; drop docs publish glob
- dfdb1a2e: docs(readme): revamp auth-backends package READMEs; drop docs publish glob
- 9c497795: docs(readme): revamp app-surface package READMEs; drop docs publish glob

Family map: foundation = contracts/config/logger/sdk/runtime-config/telemetry/kv;
data = database/prisma-adapter-mysql/queue; plugin-core = plugin + 5 plugin-*-core;
plugins = plugins/{auth,sagas,streams,triggers,workers}; auth-backends = auth-{better-auth,kv-oauth,workos};
app-surface = cli/aspire/service/fresh/fresh-ui/watchers/cron.

Gates run before commit: `deno fmt --check` on all 31 READMEs (exit 0 after one fmt pass —
repo config is single-quote + prose-wrap 80), `deno fmt --check` on the 24 edited `deno.json`
(exit 0), strict `ConvertFrom-Json` parse on all 24 edited `deno.json` (all OK).
