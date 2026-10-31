// Ignored qualification primitives: pinned Deno 2.9.7 module-loading vs --deny-read semantics.
// Each child: cleared env, scratch profile/temp roots, task DENO_DIR, 10s watchdog, captured output.
const repo = new URL('../../../', import.meta.url);
const pluginRoot = new URL('plugins/workers/', repo).pathname.replace(/^\/([A-Za-z]):/, '$1:');
const ctl = new URL('./ctl/', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:');
const denoDir = Deno.env.get('DENO_DIR');
if (!denoDir) throw new Error('DENO_DIR must be the task-owned cache');
const scratch = await Deno.makeTempDir({ prefix: 'u1-s1c-ctl-' });
const DENY = ['--cached-only', '--deny-read', '--deny-env', '--deny-net', '--deny-write', '--deny-run', '--deny-sys', '--deny-ffi'];
const env: Record<string, string> = {
  DENO_DIR: denoDir, HOME: scratch, USERPROFILE: scratch, LOCALAPPDATA: scratch, TMP: scratch, TEMP: scratch,
  TMPDIR: scratch, XDG_CACHE_HOME: scratch, XDG_CONFIG_HOME: scratch, XDG_DATA_HOME: scratch, XDG_STATE_HOME: scratch,
};
const sr = Deno.env.get('SystemRoot');
if (sr) env.SystemRoot = sr;

const cases: ReadonlyArray<{ id: string; cwd: string; code: string; expect: string }> = [
  { id: 'P1 static local import under --deny-read', cwd: ctl, code: 'import "./inert.ts";', expect: 'exit 0, silent' },
  { id: 'N1 dynamic local import under --deny-read', cwd: ctl, code: 'await import("./inert.ts");', expect: 'NotCapable (read)' },
  { id: 'N2 runtime readTextFile at import under --deny-read', cwd: ctl, code: 'import "./reads.ts";', expect: 'NotCapable (read)' },
  { id: 'N3 env read under --deny-env', cwd: ctl, code: 'Deno.env.get("PORT");', expect: 'NotCapable (env)' },
  { id: 'N4 listen under --deny-net', cwd: ctl, code: 'Deno.listen({ hostname: "127.0.0.1", port: 0 });', expect: 'NotCapable (net)' },
  { id: 'P2 workspace bare resolution under --deny-read (no load)', cwd: pluginRoot, code: 'console.log(import.meta.resolve("@netscript/workers/services"));', expect: 'resolved file URL' },
  { id: 'P3 cached jsr static import under --deny-read', cwd: pluginRoot, code: 'import "@std/path";', expect: 'exit 0, silent' },
  { id: 'P4 workspace member static import under --deny-read', cwd: pluginRoot, code: 'import "@netscript/service/auth";', expect: 'exit 0, silent' },
  { id: 'R1 public ./service subpath (expected RED before S2)', cwd: pluginRoot, code: 'import "@netscript/workers/service";', expect: 'resolution error' },
  { id: 'N5 missing-subpath import.meta.resolve', cwd: pluginRoot, code: 'try { console.log(import.meta.resolve("@netscript/workers/service")); } catch (e) { console.log("THROWS", e.name, e.message); }', expect: 'throws or unresolved' },
];
const results = [];
for (const c of cases) {
  const child = new Deno.Command(Deno.execPath(), {
    args: ['eval', ...DENY, c.code], cwd: c.cwd, clearEnv: true, env, stdin: 'null', stdout: 'piped', stderr: 'piped',
  }).spawn();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; try { child.kill(); } catch { /* exited */ } }, 10_000);
  let out;
  try { out = await child.output(); } finally { clearTimeout(timer); }
  const dec = new TextDecoder();
  results.push({ id: c.id, expect: c.expect, code: out.code, timedOut, stdout: dec.decode(out.stdout).trim(), stderr: dec.decode(out.stderr).trim().split('\n').slice(0, 3).join('\n') });
}
await Deno.remove(scratch, { recursive: true });
const receipt = { deno: Deno.version.deno, denoDir, args: DENY, results };
console.log(JSON.stringify(receipt, null, 2));
