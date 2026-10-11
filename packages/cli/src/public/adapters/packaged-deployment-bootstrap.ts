/** Target-side bootstrap for the existing packaged Servy deployment carrier. */
import { join, resolve } from '@std/path';
import type { ProcessPort } from '../../kernel/ports/process-port.ts';
import type { DeploymentBootstrapPort } from '../ports/deployment-bootstrap-port.ts';
import { ensureInstallationSecretFile } from '../../kernel/adapters/secrets/installation-secret-file.ts';
import { updateXmlPaths } from '../../kernel/adapters/deploy/commands/install.ts';

/** Provision the shared file on the target; build artifacts never carry its contents. */
export class PackagedDeploymentBootstrap implements DeploymentBootstrapPort {
  constructor(
    private readonly process: ProcessPort,
    private readonly platform: 'windows' | 'posix' = Deno.build.os === 'windows'
      ? 'windows'
      : 'posix',
  ) {}

  async prepare(
    installDir: string,
    serviceNames: readonly string[],
    backendServiceNames: readonly string[] = serviceNames,
  ): Promise<void> {
    if (serviceNames.length === 0) return;
    const root = resolve(installDir);
    const directory = join(root, '.data', 'aspire-secrets');
    const configDir = join(root, 'config');
    if (backendServiceNames.length === 0) {
      await updateXmlPaths(configDir, root, [...serviceNames], false);
      return;
    }
    const accounts = new Set<string>();
    for (const name of backendServiceNames) {
      const xml = await Deno.readTextFile(join(configDir, `${name}.xml`));
      const account = xml.match(/<UserAccount>([^<]+)<\/UserAccount>/)?.[1];
      if (account) {
        accounts.add(account.replace(/&(amp|lt|gt|quot|apos);/g, (entity) => {
          return {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&apos;': "'",
          }[entity] ?? entity;
        }));
      }
    }
    try {
      if (this.platform === 'windows') {
        const data = join(root, '.data');
        await Deno.mkdir(data, { recursive: true, mode: 0o700 });
        const dataMetadata = await Deno.lstat(data);
        if (!dataMetadata.isDirectory || dataMetadata.isSymlink) throw new Error();
        await Deno.mkdir(directory, { recursive: true, mode: 0o700 });
        const metadata = await Deno.lstat(directory);
        if (!metadata.isDirectory || metadata.isSymlink) throw new Error();
        // Restrict the directory BEFORE publishing material. Replace the DACL entirely,
        // including explicit grants, rather than preserving pre-existing readers.
        await this.restrictWindowsAccess(directory, true, accounts);
      }
      const file = ensureInstallationSecretFile(root, { environment: {} });
      if (this.platform === 'windows') {
        await this.restrictWindowsAccess(file, false, accounts);
      }
    } catch {
      throw new Error(
        'Packaged installation credential bootstrap failed. Run installation as the backend owner and ensure the managed secret directory and file are restricted and writable. Windows access is limited to that owner, SYSTEM, and the configured backend service accounts.',
      );
    }
    // This is the existing relocation seam, now applied before service registration.
    await updateXmlPaths(configDir, root, [...serviceNames], false);
  }

  private async restrictWindowsAccess(
    path: string,
    directory: boolean,
    accounts: ReadonlySet<string>,
  ): Promise<void> {
    const literal = (value: string): string => `'${value.replaceAll("'", "''")}'`;
    const securityType = directory ? 'DirectorySecurity' : 'FileSecurity';
    const ruleArgs = directory ? ", 'ContainerInherit, ObjectInherit', 'None'" : '';
    const script = [
      "$ErrorActionPreference = 'Stop'",
      '$owner = [System.Security.Principal.WindowsIdentity]::GetCurrent().User',
      "$system = [System.Security.Principal.SecurityIdentifier]::new('S-1-5-18')",
      `$acl = [System.Security.AccessControl.${securityType}]::new()`,
      '$acl.SetOwner($owner)',
      '$acl.SetAccessRuleProtection($true, $false)',
      'foreach ($principal in @($owner, $system)) {',
      `  $rule = [System.Security.AccessControl.FileSystemAccessRule]::new($principal, 'FullControl'${ruleArgs}, 'Allow')`,
      '  $acl.AddAccessRule($rule)',
      '}',
      ...[...accounts].map((account) =>
        `$acl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new(${
          literal(account)
        }, 'ReadAndExecute'${ruleArgs}, 'Allow'))`
      ),
      `Set-Acl -LiteralPath ${literal(path)} -AclObject $acl`,
    ].join('\n');
    const result = await this.process.exec('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      script,
    ]);
    if (result.code !== 0) throw new Error();
  }
}
