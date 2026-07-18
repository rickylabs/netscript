/** Filesystem promotion for native releases with private strict high-water state. */

import { basename, dirname, isAbsolute, join, relative, resolve, SEPARATOR } from '@std/path';
import {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  type AutoUpdateArchitecture,
  type AutoUpdateOperatingSystem,
} from '@netscript/sdk/auto-update';
import { NativeReleaseError, type SignedReleaseEnvelope } from './native-release-contract.ts';

/** Route identity shared with the public SDK release client. */
export interface NativeReleaseRoute {
  /** Non-empty release channel. */
  readonly channel: string;
  /** SDK operating system. */
  readonly os: AutoUpdateOperatingSystem;
  /** SDK architecture. */
  readonly arch: AutoUpdateArchitecture;
}

/** Immutable artifact ready for promotion. */
export interface ReleaseArtifact {
  /** Safe route-relative filename. */
  readonly name: string;
  /** Complete artifact bytes. */
  readonly bytes: Uint8Array;
}

/** Atomic promotion request. */
export interface PromoteReleaseRequest {
  /** Release route whose private high-water is advanced. */
  readonly route: NativeReleaseRoute;
  /** Strictly increasing positive sequence. */
  readonly sequence: number;
  /** Immutable patches/installers written before promotion. */
  readonly artifacts: readonly ReleaseArtifact[];
  /** Signed native envelope written last as `latest.json`. */
  readonly envelope: SignedReleaseEnvelope;
}

/** Result of a completed filesystem promotion. */
export interface PromoteReleaseResult {
  /** Absolute public route directory. */
  readonly routeDirectory: string;
  /** Absolute promoted manifest path. */
  readonly manifestPath: string;
}

const PRIVATE_STATE_DIRECTORY = '.release-state';
const HIGH_WATER_FILE = 'high-water';
const LOCK_FILE = 'lock';
const LATEST_MANIFEST = 'latest.json';

function validateRoute(route: NativeReleaseRoute): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(route.channel)) {
    throw new NativeReleaseError('invalid-input', 'Release channel contains unsafe characters.');
  }
  if (!AUTO_UPDATE_OPERATING_SYSTEMS.includes(route.os)) {
    throw new NativeReleaseError('invalid-input', 'Release operating system is unsupported.');
  }
  if (!AUTO_UPDATE_ARCHITECTURES.includes(route.arch)) {
    throw new NativeReleaseError('invalid-input', 'Release architecture is unsupported.');
  }
}

function validateArtifactName(name: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name.startsWith('.')) {
    throw new NativeReleaseError('invalid-input', `Unsafe release artifact name "${name}".`);
  }
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function atomicWriteText(path: string, text: string): Promise<void> {
  const temporary = `${path}.tmp-${crypto.randomUUID()}`;
  try {
    await Deno.writeTextFile(temporary, text, { createNew: true });
    await Deno.rename(temporary, path);
  } finally {
    await Deno.remove(temporary).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

async function writeImmutable(path: string, bytes: Uint8Array): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  try {
    await Deno.writeFile(path, bytes, { createNew: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) throw error;
    const existing = await Deno.readFile(path);
    if (!equalBytes(existing, bytes)) {
      throw new NativeReleaseError(
        'artifact-conflict',
        `Immutable release artifact "${basename(path)}" already contains different bytes.`,
      );
    }
  }
}

/** Filesystem store implementing patch → high-water → manifest promotion order. */
export class DenoNativeReleaseStore {
  /** Create a store rooted at the private/public release directory. */
  constructor(private readonly releaseRoot: string) {}

  /** Promote a signed release while holding an exclusive per-route lock. */
  async promote(request: PromoteReleaseRequest): Promise<PromoteReleaseResult> {
    validateRoute(request.route);
    if (!Number.isSafeInteger(request.sequence) || request.sequence <= 0) {
      throw new NativeReleaseError('invalid-input', 'Release sequence must be a positive safe integer.');
    }
    for (const artifact of request.artifacts) validateArtifactName(artifact.name);

    const root = resolve(this.releaseRoot);
    const routeDirectory = resolve(
      root,
      request.route.channel,
      `${request.route.os}-${request.route.arch}`,
    );
    const routeRelative = relative(root, routeDirectory);
    if (
      isAbsolute(routeRelative) || routeRelative === '..' || routeRelative.startsWith(`..${SEPARATOR}`)
    ) {
      throw new NativeReleaseError('invalid-input', 'Release route escapes the configured root.');
    }
    const stateDirectory = join(routeDirectory, PRIVATE_STATE_DIRECTORY);
    const lockPath = join(stateDirectory, LOCK_FILE);
    await Deno.mkdir(stateDirectory, { recursive: true });
    const lockFile = await Deno.open(lockPath, { create: true, write: true });
    if (!(await lockFile.tryLock(true))) {
      lockFile.close();
      throw new NativeReleaseError('route-busy', 'Another release is being prepared for this route.');
    }

    try {
      const highWaterPath = join(stateDirectory, HIGH_WATER_FILE);
      let highWater = 0;
      try {
        const stored = (await Deno.readTextFile(highWaterPath)).trim();
        if (!/^\d+$/.test(stored)) {
          throw new NativeReleaseError('store-failed', 'Private release high-water is invalid.');
        }
        highWater = Number(stored);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
      if (!Number.isSafeInteger(highWater) || highWater < 0) {
        throw new NativeReleaseError('store-failed', 'Private release high-water is invalid.');
      }
      if (request.sequence <= highWater) {
        throw new NativeReleaseError(
          'sequence-rejected',
          `Release sequence ${request.sequence} must be greater than private high-water ${highWater}.`,
        );
      }

      for (const artifact of request.artifacts) {
        await writeImmutable(join(routeDirectory, artifact.name), artifact.bytes);
      }
      await atomicWriteText(highWaterPath, `${request.sequence}\n`);
      const manifestPath = join(routeDirectory, LATEST_MANIFEST);
      await atomicWriteText(manifestPath, JSON.stringify(request.envelope));
      return { routeDirectory, manifestPath };
    } catch (error) {
      if (error instanceof NativeReleaseError) throw error;
      throw new NativeReleaseError('store-failed', 'Unable to promote the native release.');
    } finally {
      lockFile.close();
    }
  }
}
