# Worklog — docs/site/index.vto (Phase 1 landing)

B2 accuracy floor: one row per code proof. Every API symbol, CLI command, and flag shown on the page is verified below against the real surface.

| Proof | Verification command / file read | Symbol / claim | Found | Note |
| --- | --- | --- | --- | --- |
| Hero tab 1: `defineService` signature | `deno doc --filter defineService packages/service/mod.ts` | `async function defineService<T extends ServiceRouter>(router: T, options: DefineServiceOptions): Promise<RunningService>` | yes | Layer 3 one-liner preset; confirms `defineService(router, {...})` shape and that it returns a `RunningService` exposing `.stop()`. |
| Hero tab 1: snippet body | `packages/service/README.md` (Quick example) | `import { defineService } from '@netscript/service'; const service = await defineService(router, { name: 'users', port: 3000 }); await service.stop();` | yes | Lifted verbatim from README quick-example; only added comment annotations. JSR import realistic. |
| Hero tab 1: annotation claim | `packages/service/README.md` (Quick example preamble) | "enables CORS, request logging, OpenAPI JSON, Scalar docs, RPC, service info, and health endpoints" | yes | README states the preset enables exactly these; the "replaces ~40 lines of Hono setup" annotation paraphrases this without inventing API. |
| Hero tab 2: install command | `docs/site/tutorials/getting-started.md` line 32 (canonical, already shipped) | `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin` | yes | Matches the install command already in use in the tutorials; `bin/` entrypoint confirmed present at `packages/cli/bin/netscript.ts`. |
| Hero tab 2: init command | `packages/cli/src/public/features/init/init-command.ts` line 44 | `.name('init')` / `.description('Scaffold a new NetScript workspace')` | yes | `netscript init <name>` is a real public command taking `[name:string]`. |
| Hero tab 2: `--no-aspire` flag | `packages/cli/src/public/features/init/init-command.ts` line 52 | `.option('--no-aspire', 'Skip Aspire orchestration layer')` | yes | Confirms the locked Aspire opt-out claim; mapped to `noAspire` in the handler. |
| CLI surface (no invented exports) | `packages/cli/deno.json` exports map | `.`, `./scaffolding`, `./testing` | yes | `bin/` is not a named JSR export, so install uses the `jsr:@netscript/cli/bin` path form (matches getting-started), not a library import. |

Notes:
- No source change required; the hero snippet compiles against the verified public surface (`sourceBlocker=false`).
- Locked copy (hero tagline, sub-headline, Alpha note, Aspire foregrounding, GitHub+JSR-only links, warm "we", no body emoji) applied exactly per decisions 08.
