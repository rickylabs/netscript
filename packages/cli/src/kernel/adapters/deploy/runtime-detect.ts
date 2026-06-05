import { outputText } from '../../presentation/output/default-output.ts';
/**
 * @module commands/deploy/runtime-detect
 *
 * Detects runtime executable paths on the target machine at install time
 * and injects them into Servy XML environment variables.
 *
 * Windows services run under Local System, which does NOT inherit user-level
 * PATH entries. Runtimes like Deno (installed to ~/.deno/bin) and Python
 * (installed via proto/pyenv/user-level) are invisible to services.
 *
 * This module solves the problem by:
 * 1. Detecting full paths of deno, python, and dotnet at install time
 * 2. Injecting NETSCRIPT_DENO_PATH, NETSCRIPT_PYTHON_PATH, NETSCRIPT_DOTNET_PATH
 *    into the Servy XML <EnvironmentVariables> for worker-type services
 *
 * The task executor in packages/plugin-workers-core reads these env vars.
 */

import { gray, green, yellow } from '@std/fmt/colors';

/**
 * Runtime detection result — maps runtime name to its resolved absolute path.
 * null means the runtime was not found on this machine.
 */
export interface DetectedRuntimes {
  deno: string | null;
  python: string | null;
  dotnet: string | null;
}

/**
 * Detect runtime executable paths on the current machine.
 *
 * Uses `where` on Windows (or `which` on Unix) to find the full path
 * of each runtime. Returns the first match for each.
 */
export async function detectRuntimePaths(verbose: boolean): Promise<DetectedRuntimes> {
  outputText('🔍 Detecting runtime paths for Windows Service environment...');

  const result: DetectedRuntimes = {
    deno: null,
    python: null,
    dotnet: null,
  };

  // Detect Deno
  result.deno = await findExecutable(['deno'], verbose);

  // Detect Python — try multiple candidates (Windows installs vary)
  result.python = await findExecutable(['python', 'python3', 'py'], verbose);

  // Detect .NET
  result.dotnet = await findExecutable(['dotnet'], verbose);

  // Print summary
  const runtimes = [
    { name: 'Deno', envVar: 'NETSCRIPT_DENO_PATH', path: result.deno },
    { name: 'Python', envVar: 'NETSCRIPT_PYTHON_PATH', path: result.python },
    { name: '.NET', envVar: 'NETSCRIPT_DOTNET_PATH', path: result.dotnet },
  ];

  for (const rt of runtimes) {
    if (rt.path) {
      outputText(`   ${green('✓')} ${rt.name}: ${rt.path}`);
    } else {
      outputText(`   ${yellow('—')} ${rt.name}: not found (${rt.envVar} will not be set)`);
    }
  }
  outputText('');

  return result;
}

/**
 * Find the absolute path of an executable by trying candidate names.
 * Returns the first valid path found, or null.
 */
async function findExecutable(candidates: string[], verbose: boolean): Promise<string | null> {
  const isWindows = Deno.build.os === 'windows';
  const locateCmd = isWindows ? 'where' : 'which';

  for (const name of candidates) {
    try {
      const cmd = new Deno.Command(locateCmd, {
        args: [name],
        stdout: 'piped',
        stderr: 'piped',
      });
      const output = await cmd.output();

      if (output.success) {
        const stdout = new TextDecoder().decode(output.stdout).trim();
        // `where` on Windows may return multiple lines — take the first
        const firstPath = stdout.split(/\r?\n/)[0]?.trim();
        if (firstPath) {
          if (verbose) {
            outputText(gray(`     ${locateCmd} ${name} → ${firstPath}`));
          }
          return firstPath;
        }
      }
    } catch {
      // Command failed — try next candidate
    }
  }

  return null;
}

/**
 * Inject detected runtime paths into a Servy XML's <EnvironmentVariables>.
 *
 * Only injects for services that need runtime task execution (workers, sagas, triggers).
 * Existing env vars are preserved — new runtime vars are appended.
 *
 * @param xmlContent - Raw XML content of the Servy config
 * @param runtimes - Detected runtime paths
 * @param serviceName - Name of the service (for filtering)
 * @returns Updated XML content with runtime env vars injected
 */
export function injectRuntimeEnvVars(
  xmlContent: string,
  runtimes: DetectedRuntimes,
  serviceName: string,
): string {
  // Only inject into worker-type services that spawn runtime tasks
  const workerServices = [
    'workers-combined',
    'workers-worker',
    'workers-scheduler',
    'sagas-combined',
    'trigger-processor',
  ];

  if (!workerServices.some((ws) => serviceName === ws || serviceName.startsWith('workers-'))) {
    return xmlContent;
  }

  // Build the env vars to inject
  const newVars: Record<string, string> = {};
  if (runtimes.deno) {
    newVars['NETSCRIPT_DENO_PATH'] = runtimes.deno;
  }
  if (runtimes.python) {
    newVars['NETSCRIPT_PYTHON_PATH'] = runtimes.python;
  }
  if (runtimes.dotnet) {
    newVars['NETSCRIPT_DOTNET_PATH'] = runtimes.dotnet;
  }

  if (Object.keys(newVars).length === 0) {
    return xmlContent;
  }

  // Format as semicolon-delimited KEY=value pairs
  const newEnvString = Object.entries(newVars)
    .map(([k, v]) => `${k}=${v}`)
    .join(';');

  // Find existing <EnvironmentVariables> and append
  const envMatch = xmlContent.match(
    /<EnvironmentVariables>([^<]*)<\/EnvironmentVariables>/,
  );

  if (envMatch) {
    const existingVars = envMatch[1];
    // Check if vars are already present (idempotent)
    const alreadyPresent = Object.keys(newVars).every((key) => existingVars.includes(`${key}=`));
    if (alreadyPresent) {
      return xmlContent;
    }

    // Append new vars to existing
    const separator = existingVars.endsWith(';') ? '' : ';';
    const updatedVars = `${existingVars}${separator}${newEnvString}`;
    return xmlContent.replace(
      /<EnvironmentVariables>[^<]*<\/EnvironmentVariables>/,
      `<EnvironmentVariables>${updatedVars}</EnvironmentVariables>`,
    );
  } else {
    // No existing env vars — insert before </ServiceDto>
    return xmlContent.replace(
      '</ServiceDto>',
      `  <EnvironmentVariables>${newEnvString}</EnvironmentVariables>\n</ServiceDto>`,
    );
  }
}
