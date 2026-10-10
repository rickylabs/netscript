/**
 * Wrong-credential readiness fixture (#1726).
 *
 * The real PostgreSQL server keeps its real password, so every other runtime gate is unaffected.
 * A test-only probe resource carries one extra check built by the shipped
 * `createPostgresCredentialReadinessCheck` factory against the same live endpoint with a
 * deliberately wrong password: the listener accepts the socket, the server rejects the login.
 */

/** Test-only credential check attached to the probe resource, never to the real database. */
export const TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY = 'test_only_postgres_auth_rejected';
/** Aspire resource that carries the wrong-credential check. */
export const CREDENTIAL_FAULT_PROBE_RESOURCE = 'credential-fault-probe';
/** Project-relative directory of the probe's long-lived Deno task. */
export const CREDENTIAL_FAULT_PROBE_DIR = '.netscript/e2e/credential-fault-probe';
/** Project-relative state file that records the fixture's wrong password for leak checks. */
export const CREDENTIAL_FAULT_STATE_FILE = '.netscript/e2e/credential-fault.json';
/** Real credential check whose attachment marks the injection point. */
export const POSTGRES_AUTH_HEALTH_KEY = 'postgres_auth';

/** Recorded fixture state. */
export interface CredentialFaultState {
  readonly wrongPassword: string;
}

const POSTGRES_AUTH_ATTACHMENT_PATTERN =
  /^([ \t]*)await[ \t]+([A-Za-z_$][\w$]*)\.withHealthCheck\((["'])postgres_auth\3\);[ \t]*$/gmu;

/**
 * Register the wrong-credential check and its probe resource right after the generated
 * `postgres_auth` attachment, reusing that attachment's server binding.
 */
export function injectCredentialFaultHealthCheck(source: string, wrongPassword: string): string {
  if (source.includes(TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY)) {
    throw new Error('test-only credential fault check was already registered');
  }
  if (!/^[0-9a-f]{16,}$/u.test(wrongPassword)) {
    throw new Error('credential fault password must be a lowercase hex token');
  }
  const attachments = [...source.matchAll(POSTGRES_AUTH_ATTACHMENT_PATTERN)];
  if (attachments.length !== 1) {
    throw new Error(
      `generated register-infrastructure helper must attach ${POSTGRES_AUTH_HEALTH_KEY} once; ` +
        `found ${attachments.length}`,
    );
  }
  const [statement, indentation, serverBinding] = attachments[0];
  const end = (attachments[0].index ?? 0) + statement.length;
  const block = [
    `${indentation}// #1726 E2E: live listener, deliberately wrong password, separate probe resource.`,
    `${indentation}builder.addHealthCheck('${TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY}', createPostgresCredentialReadinessCheck({ endpoint: () => ${serverBinding}.getEndpoint('tcp'), password: '${wrongPassword}' }));`,
    `${indentation}const credential_fault_probe = builder.addExecutable('${CREDENTIAL_FAULT_PROBE_RESOURCE}', 'deno', \`\${appHostDir}/${CREDENTIAL_FAULT_PROBE_DIR}\`, ['task', 'start']);`,
    `${indentation}await credential_fault_probe.withHealthCheck('${TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY}');`,
  ].join('\n');
  return `${source.slice(0, end)}\n${block}${source.slice(end)}`;
}

/** Create a fresh wrong password; 32 hex characters, never derived from the real one. */
export function createCredentialFaultPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Write the probe task and the state file, then splice the check into the generated helper. */
export async function prepareCredentialFaultFixture(
  projectRoot: string,
  registerInfrastructure: string,
): Promise<string> {
  const wrongPassword = createCredentialFaultPassword();
  const probeDir = `${projectRoot}/${CREDENTIAL_FAULT_PROBE_DIR}`;
  await Deno.mkdir(probeDir, { recursive: true });
  await Deno.writeTextFile(
    `${probeDir}/main.ts`,
    '// Active event-loop work keeps the probe Running while Aspire reevaluates its check.\n' +
      '// An unresolved promise alone lets Deno exit before PostgreSQL is ready.\n' +
      'setInterval(() => {}, 60_000);\n',
  );
  await Deno.writeTextFile(
    `${probeDir}/deno.json`,
    `${JSON.stringify({ tasks: { start: 'deno run main.ts' } }, null, 2)}\n`,
  );
  const state: CredentialFaultState = { wrongPassword };
  await Deno.writeTextFile(
    `${projectRoot}/${CREDENTIAL_FAULT_STATE_FILE}`,
    `${JSON.stringify(state, null, 2)}\n`,
  );
  return injectCredentialFaultHealthCheck(registerInfrastructure, wrongPassword);
}
