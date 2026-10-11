import { walk } from '@std/fs/walk';
import { deadline } from '@std/async/deadline';
import { appHostEvidence, resourceEvidence } from '../aspire-mcp/evidence.ts';
import { readAspireMcpEntryPoint } from '../aspire-mcp/entry-point.ts';
import { createStdioAspireMcpTransport } from '../aspire-mcp/stdio-transport.ts';

/** Fail without echoing credential material from any scanned surface. */
export function assertNoSecretBytes(label: string, text: string, secrets: readonly string[]): void {
  for (const [index, secret] of secrets.entries()) {
    if (secret.length < 8) throw new Error(`credential #${index} is too short to scan for`);
    if (text.includes(secret)) throw new Error(`${label} output contains credential #${index}`);
  }
}

/** Scan every resource's health evidence, including descriptions, exceptions and check data. */
export function assertHealthReportsHaveNoSecrets(
  topology: unknown,
  secrets: readonly string[],
): void {
  // #1726's named surfaces exclude aspire describe's resolved resource.environment projection.
  // That pre-existing connection-string exposure is #2259; restore the whole-snapshot scan there.
  const visit = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (
        key === 'healthReports' || key === 'healthChecks' ||
        key === 'healthCheckDescriptions' || key === 'healthCheckDescription'
      ) {
        assertNoSecretBytes('aspire describe health evidence', JSON.stringify(child), secrets);
      } else if (typeof child === 'object') {
        visit(child);
      }
    }
  };
  visit(topology);
}

/** Scan all generated helper files without persisting their contents. */
export async function assertGeneratedHelpersHaveNoSecrets(
  projectRoot: string,
  secrets: readonly string[],
): Promise<void> {
  for await (const file of walk(`${projectRoot}/aspire/.helpers`, { includeDirs: false })) {
    assertNoSecretBytes('generated helper', await Deno.readTextFile(file.path), secrets);
  }
}

/** Scan the complete MCP exchange before redaction or persistence can hide a leak. */
export function assertMcpTranscriptHasNoSecrets(
  transcript: readonly unknown[],
  secrets: readonly string[],
): void {
  assertNoSecretBytes('MCP list_resources', JSON.stringify(transcript), secrets);
}

/** Scan the live list_resources exchange in memory and close only the transport we started. */
export async function assertMcpResourcesHaveNoSecrets(
  projectRoot: string,
  appHost: string,
  secrets: readonly string[],
): Promise<void> {
  const transport = createStdioAspireMcpTransport(await readAspireMcpEntryPoint(projectRoot));
  try {
    await deadline(transport.initialize(), 30_000);
    const hosts = appHostEvidence(await deadline(transport.callTool('list_apphosts'), 30_000));
    const expected = await Deno.realPath(appHost);
    const paths = await Promise.all(hosts.inScope.map((path) => Deno.realPath(path)));
    if (!paths.includes(expected)) throw new Error('suite AppHost is missing from MCP scope');
    if (hosts.inScope.length > 1) {
      await deadline(transport.callTool('select_apphost', { appHostPath: expected }), 30_000);
    }
    const resources = await deadline(transport.callTool('list_resources'), 30_000);
    assertMcpTranscriptHasNoSecrets(transport.transcript(), secrets);
    if (!resourceEvidence(resources).names.includes('postgres')) {
      throw new Error('MCP list_resources omitted postgres');
    }
  } catch {
    assertMcpTranscriptHasNoSecrets(transport.transcript(), secrets);
    throw new Error('MCP credential scan failed; raw diagnostics withheld');
  } finally {
    await transport.close();
  }
}
