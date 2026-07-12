import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import {
  generateAuthSecret,
  setAuthBackend,
  setAuthProvider,
  showAuthBackend,
} from './auth-config.ts';
import { AUTH_SECRET_KINDS, type AuthSecretKind, type AuthSessionHttpPort } from './auth-types.ts';

/** Dependencies for the public `plugin auth` command group. */
export interface AuthPluginCommandDependencies {
  readonly fs: FileSystemPort;
  readonly resolveProjectRoot: ProjectRootResolver;
  readonly sessions: AuthSessionHttpPort;
  /** Regenerate Aspire helpers after persisted auth configuration changes. */
  readonly regenerateAspire?: (projectRoot: string) => Promise<void>;
  readonly print?: (message: string) => void;
}

/** Create the public auth configuration and session command group. */
export function createAuthPluginCommand(
  dependencies: AuthPluginCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;

  const backend = new Command().name('backend').description('Select the active auth backend')
    .command('set', new Command().arguments('<backend:string>')
      .option('--project-root <path:string>', 'Project root directory')
      .action(async (options: { projectRoot?: string }, value: string) => {
        const projectRoot = await requireProjectRoot(dependencies.resolveProjectRoot, options.projectRoot);
        print(await setAuthBackend(projectRoot, value, dependencies.fs));
        await dependencies.regenerateAspire?.(projectRoot);
      }))
    .command('show', new Command().option('--project-root <path:string>', 'Project root directory')
      .action(async (options: { projectRoot?: string }) => {
        const projectRoot = await requireProjectRoot(dependencies.resolveProjectRoot, options.projectRoot);
        print(await showAuthBackend(projectRoot, dependencies.fs));
      }));

  const provider = new Command().name('provider').description('Configure an auth provider')
    .command('set', new Command()
      .option('--preset <preset:string>', 'Provider preset', { required: true })
      .option('--client-id <value:string>', 'OAuth or WorkOS client id')
      .option('--client-secret <value:string>', 'OAuth client secret')
      .option('--redirect-uri <value:string>', 'OAuth callback URI')
      .option('--issuer <value:string>', 'OIDC issuer for tenant presets')
      .option('--api-key <value:string>', 'WorkOS API key')
      .option('--cookie-password <value:string>', 'WorkOS cookie password')
      .option('--secret <value:string>', 'better-auth secret')
      .option('--kv-oauth-key <value:string>', 'Generated KV OAuth encryption key')
      .option('--project-root <path:string>', 'Project root directory')
      .action(async (options: Record<string, string | undefined>) => {
        const projectRoot = await requireProjectRoot(dependencies.resolveProjectRoot, options.projectRoot);
        const preset = await setAuthProvider({
          projectRoot,
          preset: options.preset ?? '',
          clientId: options.clientId,
          clientSecret: options.clientSecret,
          redirectUri: options.redirectUri,
          issuer: options.issuer,
          apiKey: options.apiKey,
          cookiePassword: options.cookiePassword,
          secret: options.secret,
          kvOAuthKey: options.kvOauthKey,
        }, dependencies.fs);
        await dependencies.regenerateAspire?.(projectRoot);
        print(`Configured ${preset}.`);
      }));

  const secret = new Command().name('secret').description('Generate auth secret material')
    .command('generate', new Command().arguments('[kind:string]')
      .action((_options: unknown, value = 'kv-oauth-key') => {
        if (!AUTH_SECRET_KINDS.includes(value as AuthSecretKind)) {
          throw new Error(`Invalid auth secret kind "${value}".`);
        }
        print(generateAuthSecret(value as AuthSecretKind));
      }));

  const session = new Command().name('session').description('Inspect or revoke auth sessions')
    .command('list', new Command()
      .option('--stream-url <url:string>', 'Auth durable stream URL', {
        default: 'http://localhost:4437/auth/sessions',
      })
      .action(async (options: { streamUrl: string }) => {
        const active = (await dependencies.sessions.list(options.streamUrl))
          .filter((item) => item.state === 'active');
        print('Session\tUser\tProvider\tState\tExpires');
        for (const item of active) {
          print(`${item.id}\t${item.userId ?? item.subject ?? '-'}\t${item.providerId ?? '-'}\t${item.state}\t${item.expiresAt ?? '-'}`);
        }
      }))
    .command('revoke', new Command().arguments('<id:string>')
      .option('--auth-url <url:string>', 'Auth REST base URL', {
        default: 'http://localhost:8094/api/v1/auth',
      })
      .action(async (options: { authUrl: string }, id: string) => {
        print(`Revoked ${await dependencies.sessions.revoke(options.authUrl, id)}.`);
      }));

  return new Command().name('auth').description('Configure auth and manage sessions')
    .action(function () { this.showHelp(); })
    .command('backend', backend)
    .command('provider', provider)
    .command('secret', secret)
    .command('session', session);
}
