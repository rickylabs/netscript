import { AppEntrySchema } from '@netscript/aspire/config';
import { join } from '@std/path';
import { z } from 'zod';
import { readAuthServiceName } from '../../../../kernel/adapters/service/auth-policy.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { PluginDoctorCheck } from './doctor-plugin-use-case.ts';

const settingsSchema = z.object({
  NetScript: z.object({ Apps: z.record(z.string(), z.unknown()).optional() }).optional(),
});

/** Report configured browser ownership without certifying an authored auth implementation. */
export async function checkBrowserTopology(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<readonly PluginDoctorCheck[]> {
  if (!await readAuthServiceName(projectRoot, fs)) return [];
  const path = join(projectRoot, 'appsettings.json');
  if (!await fs.exists(path)) return [];
  const settings = settingsSchema.parse(JSON.parse(await fs.readFile(path)));
  return Object.entries(settings.NetScript?.Apps ?? {}).flatMap(([name, entry]) => {
    const app = AppEntrySchema.parse(entry);
    if (app.Type !== 'app') return [];
    const topology = app.Auth?.BrowserTopology ?? 'scaffold';
    return [{
      id: `browser-topology:${name}`,
      title: `Browser auth topology (${name})`,
      status: 'healthy' as const,
      message: topology === 'authored'
        ? 'authored — app-owned browser topology; authentication behavior is not verified.'
        : 'scaffold — generated browser topology.',
    }];
  });
}
