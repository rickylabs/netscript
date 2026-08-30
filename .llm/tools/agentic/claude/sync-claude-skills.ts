import { dirname } from '@std/path';

interface SkillFile {
  path: string;
  text: string;
}

const args = new Set(Deno.args);
const check = args.has('--check');
const pretty = args.has('--pretty');
const canonicalAspireRoot = 'skills/aspire';
const sourceRoot = '.agents/skills';
const targetRoot = '.claude/skills';

const aspireStale = await syncCanonicalAspire(check);
if (aspireStale.length > 0 && check) {
  reportCanonicalAspire('FAIL', aspireStale);
  Deno.exit(1);
}
if (aspireStale.length > 0) reportCanonicalAspire('SYNCED', aspireStale);

const sourceSkills = await collectSkills(sourceRoot);
const targetSkills = await collectExistingTarget(targetRoot);
const planned = new Map<string, string>();

for (const skill of sourceSkills) {
  const relativeSkillPath = skill.path.slice(`${sourceRoot}/`.length);
  planned.set(`${targetRoot}/${relativeSkillPath}`, skill.text);
}

const stale = diffMaps(planned, targetSkills);

if (check) {
  if (stale.length > 0) {
    report('FAIL', stale);
    Deno.exit(1);
  }
  report('OK', stale);
  Deno.exit(0);
}

await Deno.mkdir(targetRoot, { recursive: true });
await removeGeneratedTarget(targetRoot);
for (const [path, text] of planned) {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}
report('SYNCED', stale);

function report(status: string, staleFiles: string[]): void {
  const payload = {
    gate: 'agentic:sync-claude',
    status,
    sourceRoot,
    targetRoot,
    skills: new Set(sourceSkills.map((file) => file.path.split('/')[2])).size,
    files: planned.size,
    staleFiles,
  };
  if (pretty) {
    console.log(
      `${payload.gate} ${status}: ${payload.skills} skill(s), ${payload.files} mirrored file(s)`,
    );
    for (const file of staleFiles) {
      console.log(`  stale: ${file}`);
    }
  } else {
    console.log(JSON.stringify(payload));
  }
}

async function collectSkills(root: string): Promise<SkillFile[]> {
  const files: SkillFile[] = [];
  for await (const skillDir of Deno.readDir(root)) {
    if (!skillDir.isDirectory) {
      continue;
    }
    const skillRoot = `${root}/${skillDir.name}`;
    try {
      const skill = await Deno.stat(`${skillRoot}/SKILL.md`);
      if (!skill.isFile) {
        continue;
      }
    } catch {
      continue;
    }
    for await (const path of walk(skillRoot)) {
      files.push({ path, text: await Deno.readTextFile(path) });
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

async function collectExistingTarget(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  try {
    const stat = await Deno.stat(root);
    if (!stat.isDirectory) {
      return files;
    }
  } catch {
    return files;
  }
  for await (const path of walk(root)) {
    files.set(path, await Deno.readTextFile(path));
  }
  return files;
}

async function* walk(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walk(path);
    } else if (entry.isFile) {
      yield path.replaceAll('\\', '/');
    }
  }
}

function diffMaps(expected: Map<string, string>, actual: Map<string, string>): string[] {
  const staleFiles = new Set<string>();
  for (const [path, text] of expected) {
    if (actual.get(path) !== text) {
      staleFiles.add(path);
    }
  }
  for (const path of actual.keys()) {
    if (!expected.has(path)) {
      staleFiles.add(path);
    }
  }
  return [...staleFiles].sort();
}

async function removeGeneratedTarget(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

async function syncCanonicalAspire(checkOnly: boolean): Promise<string[]> {
  const target = `${sourceRoot}/aspire`;
  const sourceFiles = await collectFiles(canonicalAspireRoot);
  const targetFiles = await collectExistingTarget(target);
  const planned = new Map<string, string>();
  for (const file of sourceFiles) {
    const relative = file.path.slice(`${canonicalAspireRoot}/`.length);
    planned.set(`${target}/${relative}`, file.text);
  }
  const stale = diffMaps(planned, targetFiles);
  if (checkOnly || stale.length === 0) return stale;
  await removeGeneratedTarget(target);
  for (const [path, text] of planned) {
    await Deno.mkdir(dirname(path), { recursive: true });
    await Deno.writeTextFile(path, text);
  }
  return stale;
}

function reportCanonicalAspire(status: string, staleFiles: string[]): void {
  const payload = {
    gate: 'agentic:sync-claude:canonical-aspire',
    status,
    sourceRoot: canonicalAspireRoot,
    targetRoot: `${sourceRoot}/aspire`,
    staleFiles,
  };
  if (!pretty) {
    console.log(JSON.stringify(payload));
    return;
  }
  console.log(`${payload.gate} ${status}: ${staleFiles.length} stale file(s)`);
  for (const file of staleFiles) console.log(`  stale: ${file}`);
}

async function collectFiles(root: string): Promise<SkillFile[]> {
  const files: SkillFile[] = [];
  for await (const path of walk(root)) {
    files.push({ path, text: await Deno.readTextFile(path) });
  }
  files.sort((left, right) => left.path.localeCompare(right.path));
  return files;
}
