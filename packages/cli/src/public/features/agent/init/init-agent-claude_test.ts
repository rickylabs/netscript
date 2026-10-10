import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { basename, join, relative } from '@std/path';
import { DenoAgentInitFileSystem } from './agent-init-file-system.ts';
import { ASPIRE_WORKFLOW_SKILLS, type AspireAgentInitializer } from './aspire-agent-initializer.ts';
import { initAgent } from './init-agent.ts';

const CLAUDE_ROUTE =
  'On Claude Code, address NetScript skills by name through the `repo-skills` bridge; its instructions permit reading the requested canonical skill and its bundled references.';

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
        'this command installs only the `repo-skills` discovery bridge',
        'Existing legacy copies and custom skills may remain',
      ]
    ) assertStringIncludes(bridge, expected);
    assertEquals(await Deno.readTextFile(join(root, 'CLAUDE.md')), `@AGENTS.md\n${CLAUDE_ROUTE}\n`);
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
      const expected = `@AGENTS.md${newline}${CLAUDE_ROUTE}${newline}${newline}${original}`;
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
      const newline = original.includes('\r\n') ? '\r\n' : '\n';
      const expected = original.replace(
        `@AGENTS.md${newline}`,
        `@AGENTS.md${newline}${CLAUDE_ROUTE}${newline}`,
      );
      assertEquals(await Deno.readTextFile(path), expected);
      assert(result.changedFiles.includes(path));
      assertEquals(
        (await initAgent({ projectRoot: root, host: 'claude' }, dependencies)).changedFiles,
        [],
      );
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

Deno.test('#2008 review: combined Claude guidance permits a coherent named-skill route', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    // Upgrade the import-only output of the first bridge implementation.
    await fs.writeText(join(root, 'CLAUDE.md'), '@AGENTS.md\n# Project instructions\n');
    await initAgent({ projectRoot: root, host: 'claude' }, {
      fs,
      aspireAgentInitializer: NO_ASPIRE,
    });
    const claude = await fs.readText(join(root, 'CLAUDE.md')) ?? '';
    const agents = await fs.readText(join(root, 'AGENTS.md')) ?? '';
    const bridge = await fs.readText(join(root, '.claude/skills/repo-skills/SKILL.md')) ?? '';
    assertStringIncludes(claude, `@AGENTS.md\n${CLAUDE_ROUTE}\n# Project instructions\n`);
    assertStringIncludes(agents, 'Skills are addressed by their registered name.');
    assertStringIncludes(
      agents,
      'On Claude Code, call the `repo-skills` bridge with the requested skill name',
    );
    assertStringIncludes(
      agents,
      'the bridge permits loading its canonical file and bundled references',
    );
    assertFalse(agents.includes('do not read its file directly'));
    assertStringIncludes(bridge, 'name: repo-skills');
    assertStringIncludes(bridge, 'read `.agents/skills/<name>/SKILL.md` completely before');
    const description = bridge.split('\n').find((line) => line.startsWith('description:')) ?? '';
    for (
      const name of [
        'netscript',
        'netscript-build',
        'netscript-operate',
        'aspire',
        'deno',
        ...ASPIRE_WORKFLOW_SKILLS,
      ]
    ) {
      assertStringIncludes(description, name);
      assertStringIncludes(agents, `\`${name}\``);
    }
    assertStringIncludes(bridge, 'resolve its relative references from that skill directory');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('#2008 review: legacy NetScript and Aspire directories warn without mutation', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const legacy = ['netscript-build', 'aspire-orchestration'];
    for (const name of legacy) {
      await fs.writeText(join(root, '.claude/skills', name, 'SKILL.md'), `# Legacy ${name}\n`);
      await fs.writeText(
        join(root, '.claude/skills', name, 'references/custom.md'),
        'Keep this reference.\n',
      );
    }
    await fs.writeText(join(root, '.claude/skills/custom/SKILL.md'), '# Foreign skill\n');
    for (const name of ASPIRE_WORKFLOW_SKILLS) {
      await fs.writeText(join(root, '.agents/skills', name, 'SKILL.md'), `# ${name}\n`);
    }
    const dependencies = { fs, aspireAgentInitializer: NO_ASPIRE };
    for (let iteration = 0; iteration < 2; iteration++) {
      const result = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
      assertEquals(
        result.messages,
        legacy.map((name) =>
          `Legacy .claude/skills/${name} is no longer refreshed; use the canonical .agents/skills/${name} through repo-skills. The legacy directory was preserved.`
        ),
      );
      for (const name of legacy) {
        assertEquals(
          await fs.readText(join(root, '.claude/skills', name, 'SKILL.md')),
          `# Legacy ${name}\n`,
        );
        assertEquals(
          await fs.readText(join(root, '.claude/skills', name, 'references/custom.md')),
          'Keep this reference.\n',
        );
      }
      assertEquals(
        await fs.readText(join(root, '.claude/skills/custom/SKILL.md')),
        '# Foreign skill\n',
      );
      if (iteration > 0) assertEquals(result.changedFiles, []);
    }
    const otherHost = await initAgent({ projectRoot: root, host: 'vscode' }, dependencies);
    assertEquals(otherHost.messages, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
