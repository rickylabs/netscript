/** Compose native bsdiff artifacts and an exact-string signed manifest. */

import { basename, join } from '@std/path';
import type { ProcessPort } from '../../../../../../kernel/ports/process-port.ts';
import {
  NATIVE_RELEASE_MANIFEST_VERSION,
  type NativeReleasePayload,
  NativeReleaseError,
  type SignedReleaseEnvelope,
} from './native-release-contract.ts';
import type {
  NativeReleaseRoute,
  PromoteReleaseRequest,
  PromoteReleaseResult,
} from './release-store.ts';

/** Previous runtime input used to produce one native patch. */
export interface PreviousRuntimeInput {
  /** Version currently installed by a client. */
  readonly version: string;
  /** Runtime library path for that version. */
  readonly runtimePath: string;
}

/** Native release preparation input. */
export interface PrepareNativeReleaseInput {
  /** Route receiving the release. */
  readonly route: NativeReleaseRoute;
  /** New application/runtime version. */
  readonly version: string;
  /** Strictly increasing authoring sequence. */
  readonly sequence: number;
  /** New runtime library used as bsdiff's target. */
  readonly currentRuntimePath: string;
  /** Previous runtime versions used as bsdiff sources. */
  readonly previousRuntimes: readonly PreviousRuntimeInput[];
}

/** Dependencies isolating patch, signing, and promotion effects. */
export interface PrepareNativeReleaseDependencies {
  /** Produce qbsdiff-compatible bytes for one old/new runtime pair. */
  readonly createPatch: (oldPath: string, newPath: string) => Promise<Uint8Array>;
  /** Sign an exact trusted JSON string. */
  readonly sign: (signed: string) => Promise<SignedReleaseEnvelope>;
  /** Promote artifacts under strict private high-water rules. */
  readonly promote: (request: PromoteReleaseRequest) => Promise<PromoteReleaseResult>;
}

/** Completed native release preparation. */
export interface PreparedNativeRelease extends PromoteReleaseResult {
  /** Trusted payload preserved inside the signed envelope. */
  readonly payload: NativeReleasePayload;
  /** Exact envelope promoted to `latest.json`. */
  readonly envelope: SignedReleaseEnvelope;
}

function safeVersion(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
    throw new NativeReleaseError('invalid-input', `Unsafe release version "${value}".`);
  }
  return value;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)));
  return [...digest].map((value) => value.toString(16).padStart(2, '0')).join('');
}

/** Prepare and promote one native release. */
export async function prepareNativeRelease(
  input: PrepareNativeReleaseInput,
  dependencies: PrepareNativeReleaseDependencies,
): Promise<PreparedNativeRelease> {
  const version = safeVersion(input.version);
  if (input.previousRuntimes.length === 0) {
    throw new NativeReleaseError('invalid-input', 'At least one --from runtime is required.');
  }
  const patches: Record<string, { name: string; sha256: string }> = {};
  const artifacts: { name: string; bytes: Uint8Array }[] = [];

  for (const previous of input.previousRuntimes) {
    const fromVersion = safeVersion(previous.version);
    if (patches[fromVersion] !== undefined) {
      throw new NativeReleaseError('invalid-input', `Duplicate previous version "${fromVersion}".`);
    }
    let bytes: Uint8Array;
    try {
      bytes = await dependencies.createPatch(previous.runtimePath, input.currentRuntimePath);
    } catch (error) {
      if (error instanceof NativeReleaseError) throw error;
      throw new NativeReleaseError('patch-failed', `Unable to create patch from ${fromVersion}.`);
    }
    const sha256 = await sha256Hex(bytes);
    const name = `${fromVersion}-to-${version}-${sha256.slice(0, 16)}.bsdiff`;
    patches[fromVersion] = { name, sha256 };
    artifacts.push({ name, bytes });
  }

  const payload: NativeReleasePayload = {
    manifestVersion: NATIVE_RELEASE_MANIFEST_VERSION,
    sequence: input.sequence,
    version,
    patches,
  };
  const envelope = await dependencies.sign(JSON.stringify(payload));
  const promoted = await dependencies.promote({
    route: input.route,
    sequence: input.sequence,
    artifacts,
    envelope,
  });
  return { ...promoted, payload, envelope };
}

/** Invoke external bsdiff and return its complete patch bytes. */
export async function createBsdiffPatch(
  process: ProcessPort,
  oldPath: string,
  newPath: string,
): Promise<Uint8Array> {
  const temporaryDirectory = await Deno.makeTempDir({ prefix: 'netscript-bsdiff-' });
  const outputPath = join(temporaryDirectory, `${basename(oldPath)}.bsdiff`);
  try {
    let result;
    try {
      result = await process.exec('bsdiff', [oldPath, newPath, outputPath]);
    } catch {
      throw new NativeReleaseError(
        'patch-failed',
        'The external bsdiff executable is required to prepare native releases.',
      );
    }
    if (result.code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || `exit code ${result.code}`;
      throw new NativeReleaseError('patch-failed', `bsdiff failed: ${detail}`);
    }
    return await Deno.readFile(outputPath);
  } finally {
    await Deno.remove(temporaryDirectory, { recursive: true }).catch(() => undefined);
  }
}
