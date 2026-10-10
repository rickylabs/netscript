import { NETSCRIPT_ASPIRE_CLI_ENV } from '../../../constants/scaffold/scaffold-aspire.ts';

/** Resolve a declared Aspire executable without prompting for environment permission. */
export function resolveAspireExecutable(env?: Readonly<Record<string, string>>): string {
  const declared = env?.[NETSCRIPT_ASPIRE_CLI_ENV];
  if (declared) return declared;
  const permission = Deno.permissions.querySync({
    name: 'env',
    variable: NETSCRIPT_ASPIRE_CLI_ENV,
  });
  return (permission.state === 'granted' ? Deno.env.get(NETSCRIPT_ASPIRE_CLI_ENV) : undefined) ||
    'aspire';
}
