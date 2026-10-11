import { join } from '@std/path';

/** Filesystem edge for proving a complete legacy skill mirror redundant before removal. */
export interface ClaudeSkillMirrorFileSystem {
  /** Inspect an entry without following symbolic links. */
  entryKind(path: string): Promise<'file' | 'directory' | 'other' | undefined>;
  /** Enumerate one directory without traversing its children. */
  entries(path: string): AsyncIterable<Deno.DirEntry>;
  /** Compare regular files byte-for-byte with bounded buffers. */
  filesEqual(left: string, right: string): Promise<boolean>;
  /** Remove a directory whose complete contents have been proven redundant. */
  removeDirectory(path: string): Promise<void>;
}

/** Remove only complete identical trees for known installed skills, reporting retained divergence. */
export async function cleanClaudeSkillMirrors(
  projectRoot: string,
  skillNames: readonly string[],
  fs: ClaudeSkillMirrorFileSystem,
  changedFiles: string[],
): Promise<string[]> {
  const messages: string[] = [];
  // Never traverse a linked host or canonical ancestor to infer ownership.
  for (const path of ['.claude', '.claude/skills', '.agents', '.agents/skills']) {
    const kind = await fs.entryKind(join(projectRoot, path));
    if (kind === undefined) return messages;
    if (kind !== 'directory') {
      return [`Preserved legacy Claude skills: ${path} is not a regular directory.`];
    }
  }
  for (const name of skillNames) {
    if (name === 'repo-skills') continue;
    const mirror = join(projectRoot, '.claude', 'skills', name);
    if (await fs.entryKind(mirror) === undefined) continue;
    const canonical = join(projectRoot, '.agents', 'skills', name);
    const differences: string[] = [];
    await compareTree(fs, mirror, canonical, `.claude/skills/${name}`, differences);
    // A matching empty directory alone does not prove an installed skill's ownership.
    if (await fs.entryKind(join(canonical, 'SKILL.md')) !== 'file') {
      differences.push(`.claude/skills/${name}/SKILL.md (no canonical skill)`);
    }
    if (differences.length > 0) {
      messages.push(
        ...differences.sort().map((path) =>
          `Preserved legacy skill directory .claude/skills/${name}: divergent ${path}.`
        ),
      );
    } else {
      await fs.removeDirectory(mirror);
      changedFiles.push(mirror);
    }
  }
  return messages;
}

async function compareTree(
  fs: ClaudeSkillMirrorFileSystem,
  mirror: string,
  canonical: string,
  relativePath: string,
  differences: string[],
): Promise<void> {
  const mirrorKind = await fs.entryKind(mirror);
  const canonicalKind = await fs.entryKind(canonical);
  if (mirrorKind !== canonicalKind || mirrorKind === 'other' || mirrorKind === undefined) {
    await reportMirrorTree(fs, mirror, relativePath, differences);
    return;
  }
  if (mirrorKind === 'file') {
    if (!await fs.filesEqual(mirror, canonical)) differences.push(relativePath);
    return;
  }
  for await (const entry of fs.entries(mirror)) {
    await compareTree(
      fs,
      join(mirror, entry.name),
      join(canonical, entry.name),
      `${relativePath}/${entry.name}`,
      differences,
    );
  }
  for await (const entry of fs.entries(canonical)) {
    if (await fs.entryKind(join(mirror, entry.name)) === undefined) {
      differences.push(`${relativePath}/${entry.name} (missing from mirror)`);
    }
  }
}

async function reportMirrorTree(
  fs: ClaudeSkillMirrorFileSystem,
  path: string,
  relativePath: string,
  differences: string[],
): Promise<void> {
  if (await fs.entryKind(path) === 'directory') {
    let empty = true;
    for await (const entry of fs.entries(path)) {
      empty = false;
      await reportMirrorTree(
        fs,
        join(path, entry.name),
        `${relativePath}/${entry.name}`,
        differences,
      );
    }
    if (!empty) return;
  }
  differences.push(relativePath);
}
