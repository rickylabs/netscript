interface SkillFile {
  path: string;
  text: string;
}

const args = new Set(Deno.args);
const check = args.has('--check');
const pretty = args.has('--pretty');
const sourceRoot = '.agents/skills';
const targetRoot = '.claude/skills';

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

function dirname(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '.' : path.slice(0, index);
}
