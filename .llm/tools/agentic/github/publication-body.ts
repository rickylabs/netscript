/** Session-owned staging for text that is about to cross the GitHub publication boundary. */

export const PUBLICATION_BODY_ROOT = '.llm/tmp/agentic/gh-pr';
const BODY_FILE = 'body.md';
const METADATA_FILE = 'metadata.json';
const SCHEMA_VERSION = '1.0';

export interface PublicationBodyArtifact {
  readonly sessionId: string;
  readonly directory: string;
  readonly bodyPath: string;
  readonly metadataPath: string;
  readonly fingerprint: string;
}

interface PublicationBodyMetadata {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly ownerSession: string;
  readonly bodyFile: typeof BODY_FILE;
  readonly fingerprint: string;
}

function assertSessionId(sessionId: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  ) {
    throw new Error('publication session id must be a UUID');
  }
}

async function fingerprint(content: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseMetadata(raw: string): PublicationBodyMetadata {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('publication body metadata is invalid JSON');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('publication body metadata is invalid');
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = ['bodyFile', 'fingerprint', 'ownerSession', 'schemaVersion'];
  if (
    JSON.stringify(keys) !== JSON.stringify(expected) ||
    record.schemaVersion !== SCHEMA_VERSION ||
    record.bodyFile !== BODY_FILE ||
    typeof record.ownerSession !== 'string' ||
    typeof record.fingerprint !== 'string'
  ) {
    throw new Error('publication body metadata contract is invalid');
  }
  return record as unknown as PublicationBodyMetadata;
}

/** Writes one collision-free body and ownership record for the current invocation. */
export async function stagePublicationBody(
  content: string,
  sessionId: string = crypto.randomUUID(),
  root: string = PUBLICATION_BODY_ROOT,
): Promise<PublicationBodyArtifact> {
  assertSessionId(sessionId);
  await Deno.mkdir(root, { recursive: true, mode: 0o700 });
  await Deno.chmod(root, 0o700);
  const directory = `${root.replace(/\/$/, '')}/${sessionId}`;
  await Deno.mkdir(directory, { mode: 0o700 });
  const bodyPath = `${directory}/${BODY_FILE}`;
  const metadataPath = `${directory}/${METADATA_FILE}`;
  const bodyFingerprint = await fingerprint(content);
  const metadata: PublicationBodyMetadata = {
    schemaVersion: SCHEMA_VERSION,
    ownerSession: sessionId,
    bodyFile: BODY_FILE,
    fingerprint: bodyFingerprint,
  };
  await Deno.writeTextFile(bodyPath, content, { createNew: true, mode: 0o600 });
  await Deno.writeTextFile(metadataPath, `${JSON.stringify(metadata)}\n`, {
    createNew: true,
    mode: 0o600,
  });
  return {
    sessionId,
    directory,
    bodyPath,
    metadataPath,
    fingerprint: bodyFingerprint,
  };
}

/** Re-reads and verifies owner plus content fingerprint immediately before publication. */
export async function readOwnedPublicationBody(
  artifact: PublicationBodyArtifact,
  currentSession: string,
): Promise<string> {
  assertSessionId(currentSession);
  if (artifact.sessionId !== currentSession) {
    throw new Error('refusing publication body owned by another session');
  }
  const metadata = parseMetadata(await Deno.readTextFile(artifact.metadataPath));
  if (metadata.ownerSession !== currentSession) {
    throw new Error('refusing publication body with mismatched owner metadata');
  }
  const body = await Deno.readTextFile(artifact.bodyPath);
  const observedFingerprint = await fingerprint(body);
  if (
    observedFingerprint !== artifact.fingerprint ||
    observedFingerprint !== metadata.fingerprint
  ) {
    throw new Error('refusing publication body changed after session staging');
  }
  return body;
}
