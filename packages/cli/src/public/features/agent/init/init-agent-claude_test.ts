import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { basename, join, relative } from '@std/path';
import { DenoAgentInitFileSystem } from './agent-init-file-system.ts';
import { ASPIRE_WORKFLOW_SKILLS, type AspireAgentInitializer } from './aspire-agent-initializer.ts';
import { initAgent } from './init-agent.ts';

const NO_ASPIRE: AspireAgentInitializer = {
  initialize: () => Promise.resolve({ ok: false, reason: 'not installed in this fixture' }),
};

Deno.test('#2008 fresh Claude init writes exactly one discovery bridge and creates CLAUDE.md', async () => {
  const root = await Deno.makeTempDir();
  try {
    const dependencies = { fs: new DenoAgentInitFileSystem(), aspireAgentInitializer: NO_ASPIRE };
    const first = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    const skillsRoot = join(root, '.claude/skills');
    const files = [];
    for await (const entry of walk(skillsRoot, { includeDirs: false })) {
      files.push(relative(skillsRoot, entry.path));
    }
    assertEquals(files, [join('repo-skills', 'SKILL.md')]);
    const bridge = await Deno.readTextFile(join(skillsRoot, files[0]));
    for (
      const expected of [
        'name: repo-skills',
        `# ${basename(root)} repository skills`,
        '.agents/skills/<name>/SKILL.md',
        'resolve its relative references from that skill directory',
        'Do not search for or create',
        'this bridge is the only Claude-local repository skill',
      ]
    ) assertStringIncludes(bridge, expected);
    assertEquals(await Deno.readTextFile(join(root, 'CLAUDE.md')), '@AGENTS.md\n');
    assert(first.changedFiles.includes(join(root, 'CLAUDE.md')));
    assertEquals(
      (await initAgent({ projectRoot: root, host: 'claude' }, dependencies)).changedFiles,
      [],
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('#2008 CLAUDE.md import merge preserves existing bytes and is idempotent', async () => {
  const root = await Deno.makeTempDir();
  try {
    const dependencies = { fs: new DenoAgentInitFileSystem(), aspireAgentInitializer: NO_ASPIRE };
    for (
      const original of [
        '# Local instructions\n\nKeep trailing spaces.  \n',
        '# Local instructions without a final newline',
        '# Windows instructions\r\n\r\nKeep me.\r\n',
        '@OTHER.md\n@AGENTS.md.backup\n',
        '```markdown\n@AGENTS.md\n```\n',
        '~~~~markdown\r\n@AGENTS.md\r\n~~~~\r\n',
      ]
    ) {
      const path = join(root, 'CLAUDE.md');
      await Deno.writeTextFile(path, original);
      const first = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
      const newline = original.includes('\r\n') ? '\r\n' : '\n';
      const expected = `@AGENTS.md${newline}${newline}${original}`;
      assertEquals(await Deno.readTextFile(path), expected);
      assert(first.changedFiles.includes(path));
      const second = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
      assertEquals(await Deno.readTextFile(path), expected);
      assertEquals(second.changedFiles, []);
    }
    for (const original of ['@AGENTS.md\n# Keep me\n', '# Keep me\r\n\r\n@AGENTS.md\r\n']) {
      const path = join(root, 'CLAUDE.md');
      await Deno.writeTextFile(path, original);
      const result = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
      assertEquals(await Deno.readTextFile(path), original);
      assertFalse(result.changedFiles.includes(path));
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('#2008 canonical Aspire workflows alone skip delegation without creating mirrors', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    for (const skill of ASPIRE_WORKFLOW_SKILLS) {
      await fs.writeText(join(root, '.agents/skills', skill, 'SKILL.md'), `# ${skill}\n`);
    }
    let calls = 0;
    const first = await initAgent({ projectRoot: root, host: 'claude' }, {
      fs,
      aspireAgentInitializer: {
        initialize() {
          calls++;
          return Promise.resolve({ ok: true });
        },
      },
    });
    assertEquals(calls, 0);
    assertEquals(first.messages, []);
    for (const skill of ASPIRE_WORKFLOW_SKILLS) {
      assertFalse(await fs.exists(join(root, '.claude/skills', skill)));
    }
    assert(await fs.exists(join(root, '.claude/skills/repo-skills/SKILL.md')));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('#2008 non-Claude host leaves CLAUDE.md and foreign Claude skills untouched', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const claude = join(root, 'CLAUDE.md');
    const foreignSkill = join(root, '.claude/skills/custom/SKILL.md');
    await fs.writeText(claude, '# Custom instructions\n');
    await fs.writeText(foreignSkill, '# Custom skill\n');
    await initAgent({ projectRoot: root, host: 'vscode' }, {
      fs,
      aspireAgentInitializer: NO_ASPIRE,
    });
    assertEquals(await fs.readText(claude), '# Custom instructions\n');
    assertEquals(await fs.readText(foreignSkill), '# Custom skill\n');
    assertFalse(await fs.exists(join(root, '.claude/skills/repo-skills/SKILL.md')));
    await initAgent({ projectRoot: root, host: 'claude' }, {
      fs,
      aspireAgentInitializer: NO_ASPIRE,
    });
    assertEquals(await fs.readText(foreignSkill), '# Custom skill\n');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
