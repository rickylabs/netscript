/**
 * @module
 *
 * Resolves the HTTP endpoint a generated project publishes for one of its apps.
 *
 * The suite must never guess this port. `appsettings.json` is the same input the
 * Aspire helper generator reads when it emits `withHttpEndpoint({ port })`, so
 * reading it here keeps the probe and the AppHost on one number by construction —
 * including when a project is scaffolded with a non-default app port.
 */

import { join } from '@std/path';
import { SCAFFOLD_FILES } from '../../../../../src/kernel/constants/scaffold/scaffold-files.ts';

/** The single field of `appsettings.json` this module reads. */
interface AppSettingsAppsShape {
  readonly NetScript?: {
    readonly Apps?: Record<string, { readonly Port?: unknown } | undefined>;
  };
}

/**
 * Reads the port a generated project publishes for `appName`.
 *
 * @param projectRoot - Root of the generated project.
 * @param appName - App key under `NetScript.Apps`.
 * @throws If `appsettings.json` is unreadable, or declares no numeric port for the app.
 */
export function readGeneratedAppPort(projectRoot: string, appName: string): number {
  const settingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  let raw: string;
  try {
    raw = Deno.readTextFileSync(settingsPath);
  } catch (error) {
    throw new Error(
      `Cannot resolve the "${appName}" app port: ${settingsPath} is unreadable (${
        error instanceof Error ? error.message : String(error)
      }).`,
    );
  }

  let parsed: AppSettingsAppsShape;
  try {
    parsed = JSON.parse(raw) as AppSettingsAppsShape;
  } catch (error) {
    throw new Error(
      `Cannot resolve the "${appName}" app port: ${settingsPath} is not valid JSON (${
        error instanceof Error ? error.message : String(error)
      }).`,
    );
  }

  const port = parsed.NetScript?.Apps?.[appName]?.Port;
  if (typeof port !== 'number' || !Number.isInteger(port) || port <= 0) {
    throw new Error(
      `Cannot resolve the "${appName}" app port: ${settingsPath} declares NetScript.Apps.${appName}.Port as ${
        JSON.stringify(port)
      }.`,
    );
  }
  return port;
}

/**
 * Builds the home-page URL of a generated app from the project's own settings.
 *
 * @param projectRoot - Root of the generated project.
 * @param appName - App key under `NetScript.Apps`.
 */
export function generatedAppHomeUrl(projectRoot: string, appName: string): string {
  return `http://127.0.0.1:${readGeneratedAppPort(projectRoot, appName)}/`;
}
