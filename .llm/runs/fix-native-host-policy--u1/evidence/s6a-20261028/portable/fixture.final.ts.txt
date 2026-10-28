/**
 * Bounded runtime children for streams factory qualification. Native addons are trusted
 * native code; these explicit Deno grants are test authority, not process confinement. No product
 * import or test registration occurs here. The S4 denied-all fixture remains unchanged.
 * @module
 */
import { assert } from 'jsr:@std/assert@^1';
import { DELIMITER, dirname, fromFileUrl, join } from 'jsr:@std/path@^1';

const CHILD_DEADLINE_MS = 30_000;
const SETTLE_GRACE_MS = 2_000;
const CHILD_OUTPUT_CAP = 32 * 1024;

export interface ChildRun {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface RuntimeOptions {
  readonly cwd: string;
  readonly preferredPorts: readonly number[];
  readonly denyAllocator?: boolean;
  readonly denyFfi?: boolean;
}

interface Sandbox extends AsyncDisposable {
  readonly scratch: string;
  readonly addonPaths: readonly string[];
  run(source: string, options: RuntimeOptions): Promise<ChildRun>;
}

/** Uses Deno's actual cache and upstream's pinned native resolver, never guessed cache paths. */
export async function createRuntimeSandbox(label: string): Promise<Sandbox> {
  if (!/^[a-z-]+$/.test(label)) throw new Error('Invalid evidence label');
  const evidenceRoot = Deno.env.get('NETSCRIPT_S6A_EVIDENCE_DIR');
  const evidence = evidenceRoot === undefined ? undefined : join(evidenceRoot, label);
  if (evidence !== undefined) await Deno.mkdir(evidence, { recursive: true });
  async function record(name: string, value: unknown): Promise<void> {
    if (evidence !== undefined) {
      await Deno.writeTextFile(join(evidence, name + '.json'), JSON.stringify(value, null, 2), {
        createNew: true,
      });
    }
  }
  const cwd = fromFileUrl(new URL('../../../../', import.meta.url));
  const info = await runChild(['info', '--json'], cwd);
  await record('cache-info', { ...info, explicitDenoDir: Deno.env.has('DENO_DIR') });
  assert(info.code === 0, info.stderr);
  const cache: unknown = JSON.parse(info.stdout);
  assert(typeof cache === 'object' && cache !== null && 'denoDir' in cache && 'npmCache' in cache);
  assert(typeof cache.denoDir === 'string' && cache.denoDir.length > 0);
  assert(typeof cache.npmCache === 'string' && cache.npmCache.length > 0);
  const toolchain = dirname(Deno.execPath());
  const scratch = await Deno.makeTempDir({ prefix: 'streams-service-runtime-' });
  const ownedPath = await Deno.realPath(scratch);
  const env: Record<string, string> = { DENO_DIR: cache.denoDir, NO_COLOR: '1' };
  const profileKeys = 'HOME USERPROFILE APPDATA LOCALAPPDATA TMP TEMP TMPDIR ' +
    'XDG_CACHE_HOME XDG_CONFIG_HOME XDG_DATA_HOME XDG_STATE_HOME';
  for (const name of profileKeys.split(' ')) env[name] = scratch;
  const systemRoot = Deno.build.os === 'windows' ? Deno.env.get('SystemRoot') : undefined;
  if (systemRoot !== undefined) env.SystemRoot = systemRoot;
  env.PATH = [toolchain, ...(systemRoot ? [join(systemRoot, 'System32'), systemRoot] : [])].join(
    DELIMITER,
  );
  env.PATHEXT = '.COM;.EXE;.BAT;.CMD';
  let sequence = 0;
  const reads = [
    scratch,
    cache.npmCache,
    toolchain,
    ...(Deno.build.os === 'linux' ? ['/proc/self/exe', '/usr/bin/ldd'] : []),
  ];
  const base = ['run', '--check', '--frozen', '--cached-only', '--ext=ts'];
  base.push('--allow-env', `--allow-read=${reads.join(',')}`, '--allow-sys', '--deny-run');
  async function cleanup(): Promise<void> {
    if (await Deno.realPath(scratch) !== ownedPath) {
      throw new Error('Owned scratch identity changed');
    }
    const entries = Array.from(Deno.readDirSync(scratch), (entry) => entry.name);
    await Deno.remove(scratch, { recursive: true });
    await record('cleanup', { scratch, ownedPath, entries, removed: true });
  }
  let addons: unknown;
  let addonPaths: string[];
  try {
    const args = [...base, '--deny-net', '--deny-ffi', '-'];
    await record('discovery-input', { args, cwd, clearEnv: true, env, source: NATIVE_DISCOVERY });
    const result = await runChild(args, cwd, env, NATIVE_DISCOVERY);
    await record('discovery-result', result);
    assert(result.code === 0, result.stderr);
    addons = JSON.parse(result.stdout);
    assert(Array.isArray(addons) && addons.length === 2);
    addonPaths = addons.map((addon: unknown) => {
      assert(typeof addon === 'object' && addon !== null && 'path' in addon);
      assert(typeof addon.path === 'string' && addon.path.length > 0);
      return addon.path;
    });
  } catch (error) {
    try {
      await cleanup();
    } catch (secondary) {
      throw new AggregateError([error, secondary]);
    }
    throw error;
  }
  return {
    scratch,
    addonPaths,
    async run(source, options) {
      for (const port of options.preferredPorts) {
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('Preferred upstream ports must be owned positive port numbers');
        }
      }
      const net = [
        '127.0.0.1',
        ...(options.denyAllocator
          ? []
          : ['0.0.0.0:0', ...options.preferredPorts.map((port) => `0.0.0.0:${port}`)]),
      ];
      const args = [
        ...base,
        `--allow-net=${net.join(',')}`,
        `--allow-write=${scratch}`,
        options.denyFfi ? '--deny-ffi' : `--allow-ffi=${addonPaths.join(',')}`,
        '-',
      ];
      const name = `child-${++sequence}`;
      await record(name + '-input', {
        args,
        cwd: options.cwd,
        clearEnv: true,
        env,
        addons,
        source,
      });
      try {
        const result = await runChild(args, options.cwd, env, source);
        await record(name + '-result', result);
        return result;
      } catch (error) {
        await record(name + '-failure', { error: describe(error) });
        throw error;
      }
    },
    [Symbol.asyncDispose]: cleanup,
  };
}

/** Retains the actual child handle; deadline/pipe failures terminate only that owned process. */
async function runChild(
  args: string[],
  cwd: string,
  env?: Record<string, string>,
  source?: string,
): Promise<ChildRun> {
  const child = new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    env,
    clearEnv: env !== undefined,
    stdin: source === undefined ? 'null' : 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const startedAt = new Date().toISOString();
  const problems: string[] = [];
  let exited = false;
  const abort = (problem: string): void => {
    problems.push(problem);
    if (exited) return;
    try {
      child.kill();
    } catch (error) {
      problems.push(`kill failed: ${describe(error)}`);
    }
  };
  const watchdog = setTimeout(() => abort(`exceeded ${CHILD_DEADLINE_MS}ms`), CHILD_DEADLINE_MS);
  const settled = Promise.all([
    child.status.then((status) => {
      exited = true;
      return status.code;
    }),
    readCapped(child.stdout).catch((error): string => {
      abort(`stdout: ${describe(error)}`);
      return '';
    }),
    readCapped(child.stderr).catch((error): string => {
      abort(`stderr: ${describe(error)}`);
      return '';
    }),
    source === undefined ? Promise.resolve() : new Blob([source]).stream().pipeTo(child.stdin)
      .catch((error) => abort(`stdin: ${describe(error)}`)),
  ]);
  let grace: ReturnType<typeof setTimeout> | undefined;
  const unsettled = new Promise<undefined>((resolve) => {
    grace = setTimeout(resolve, CHILD_DEADLINE_MS + SETTLE_GRACE_MS, undefined);
  });
  try {
    const outcome = await Promise.race([settled, unsettled]);
    if (outcome === undefined) {
      throw new Error(
        `Child pid ${child.pid} did not settle within ${CHILD_DEADLINE_MS + SETTLE_GRACE_MS}ms: ` +
          problems.join('; '),
      );
    }
    const [code, stdout, stderr] = outcome;
    const result = {
      code,
      stdout,
      stderr,
      pid: child.pid,
      startedAt,
      finishedAt: new Date().toISOString(),
      statusSettled: true,
      pipesSettled: true,
      stdinSettled: true,
    };
    if (problems.length > 0) {
      throw new Error(`${problems.join('; ')}\n${JSON.stringify(result)}`);
    }
    return result;
  } finally {
    clearTimeout(watchdog);
    clearTimeout(grace);
  }
}

async function readCapped(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  for await (const chunk of stream) {
    bytes += chunk.byteLength;
    if (bytes > CHILD_OUTPUT_CAP) throw new Error(`exceeded ${CHILD_OUTPUT_CAP} bytes`);
    text += decoder.decode(chunk, { stream: true });
  }
  return text + decoder.decode();
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Resolve only: upstream owns ABI/libc selection; manifests bound the permitted native owner. */
const NATIVE_DISCOVERY = `import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import process from 'node:process';
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const require = createRequire(import.meta.resolve('@durable-streams/server'));
const entries = [require.resolve('lmdb'),
  createRequire(require.resolve('msgpackr')).resolve('msgpackr-extract')];
const addons = [];
for (const [index, entry] of entries.entries()) {
  const name = index === 0 ? 'lmdb' : 'msgpackr-extract';
  const version = index === 0 ? '3.5.7' : '3.0.4';
  const directory = index === 0 ? dirname(dirname(entry)) : dirname(entry);
  const manifest: unknown = JSON.parse(await Deno.readTextFile(join(directory, 'package.json')));
  assert(typeof manifest === 'object' && manifest !== null && 'name' in manifest &&
    'version' in manifest && manifest.name === name && manifest.version === version &&
    'optionalDependencies' in manifest, 'Native package identity changed');
  const optional = manifest.optionalDependencies;
  const packageName = '@' + name + '/' + name + '-' + process.platform + '-' + process.arch;
  assert(typeof optional === 'object' && optional !== null && packageName in optional &&
    Reflect.get(optional, packageName) === version, 'Pinned optional dependency changed');
  const nativeRequire = createRequire(entry);
  const packagePath = nativeRequire.resolve(packageName + '/package.json');
  const platformManifest: unknown = JSON.parse(await Deno.readTextFile(packagePath));
  assert(typeof platformManifest === 'object' && platformManifest !== null &&
    'name' in platformManifest && platformManifest.name === packageName &&
    'version' in platformManifest && platformManifest.version === version &&
    'os' in platformManifest && Array.isArray(platformManifest.os) &&
    platformManifest.os.includes(process.platform) && 'cpu' in platformManifest &&
    Array.isArray(platformManifest.cpu) && platformManifest.cpu.includes(process.arch),
    'Native platform manifest mismatch');
  const loader: unknown = nativeRequire('node-gyp-build-optional-packages');
  assert(typeof loader === 'function', 'Native loader is not callable');
  const resolve: unknown = Reflect.get(loader, 'resolve');
  assert(typeof resolve === 'function', 'Native resolver is absent');
  const selected: unknown = resolve(directory);
  assert(typeof selected === 'string', 'Native resolver returned a non-path');
  const owner = await Deno.realPath(dirname(packagePath)), path = await Deno.realPath(selected);
  const within = relative(owner, path);
  assert(within !== '' && !isAbsolute(within) && within !== '..' &&
    !within.startsWith('..' + sep) && (await Deno.stat(path)).isFile, 'Native addon escaped owner');
  const bytes = await Deno.readFile(path);
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    (byte) => byte.toString(16).padStart(2, '0')).join('');
  addons.push({ path, owner, bytes: bytes.length, sha256, manifest, platformManifest });
}
console.log(JSON.stringify(addons));`;
