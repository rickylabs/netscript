import { failDeployCommand } from '../deploy-exit.ts';
import { outputText } from '../../../presentation/output/default-output.ts';
/**
 * @module commands/deploy/admin-command
 *
 * Administrator privilege helpers for deploy commands.
 */

import { yellow } from '@std/fmt/colors';
import { isAdmin } from '../../runtime/platform/deno-platform.ts';

/** Check for admin privileges and print a warning if not elevated. */
export async function checkAdmin(
  operation: string,
  exitOnFail: boolean = false,
): Promise<boolean> {
  const admin = await isAdmin();
  if (!admin) {
    outputText('');
    outputText(yellow('WARNING: Not running as Administrator'));
    outputText('');
    outputText('   Windows Services require elevated privileges to ' + operation + '.');
    outputText('   Please run this command from an Administrator terminal:');
    outputText('');
    outputText("   1. Right-click PowerShell -> 'Run as Administrator'");
    outputText(`   2. Re-run the ${operation} command`);
    outputText('');

    if (exitOnFail) {
      failDeployCommand('Deploy command failed.');
    }
  }
  return admin;
}
