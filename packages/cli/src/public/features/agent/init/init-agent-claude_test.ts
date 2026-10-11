import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { copy, walk } from '@std/fs';
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

Deno.test('#2008 review: divergent legacy NetScript and Aspire directories report without mutation', async () => {
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
      for (const name of legacy) {
        assert(
          result.messages.some((message) => message.includes(`.claude/skills/${name}/SKILL.md`)),
        );
        assert(
          result.messages.some((message) =>
            message.includes(`.claude/skills/${name}/references/custom.md`)
          ),
        );
      }
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

Deno.test('#2008 cleanup: complete owned mirrors are removed and reruns keep bridge and import stable', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const dependencies = { fs, aspireAgentInitializer: NO_ASPIRE };
    await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    const skillsRoot = join(root, '.claude/skills');
    const bridgePath = join(skillsRoot, 'repo-skills/SKILL.md');
    const bridge = await fs.readText(bridgePath);
    const guidance = await fs.readText(join(root, 'CLAUDE.md'));
    // Recreate the old installer layout, including reference subtrees and binary assets.
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
      const canonical = join(root, '.agents/skills', name);
      if (ASPIRE_WORKFLOW_SKILLS.includes(name)) {
        await fs.writeText(join(canonical, 'SKILL.md'), `# ${name}\n`);
      }
      await fs.writeText(join(canonical, 'references/nested/example.md'), '# Reference\n');
      const binary = new Uint8Array(150_001).fill(255);
      await Deno.writeFile(join(canonical, 'references/nested/asset.bin'), binary);
      await Deno.mkdir(join(canonical, 'references/empty'), { recursive: true });
      await Deno.mkdir(skillsRoot, { recursive: true });
      await copy(canonical, join(skillsRoot, name));
    }
    const first = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    assertEquals(first.messages, []);
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
      assertFalse(await fs.exists(join(skillsRoot, name)));
      assert(first.changedFiles.includes(join(skillsRoot, name)));
    }
    const files = [];
    for await (const entry of walk(skillsRoot, { includeDirs: false })) {
      files.push(relative(skillsRoot, entry.path));
    }
    assertEquals(files, [join('repo-skills', 'SKILL.md')]);
    assertEquals(await fs.readText(bridgePath), bridge);
    assertEquals(await fs.readText(join(root, 'CLAUDE.md')), guidance);
    const second = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    assertEquals(second.changedFiles, []);
    assertEquals(second.messages, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('#2008 cleanup: nested extra missing and divergent files preserve whole trees and report paths', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const dependencies = { fs, aspireAgentInitializer: NO_ASPIRE };
    await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    const names = ['netscript', 'netscript-build', 'netscript-operate', 'deno'];
    for (const name of names) {
      const canonical = join(root, '.agents/skills', name);
      await fs.writeText(join(canonical, 'references/nested/keep.md'), '# Canonical\n');
      await copy(canonical, join(root, '.claude/skills', name));
    }
    await fs.writeText(
      join(root, '.claude/skills/netscript/references/nested/keep.md'),
      '# Edited\n',
    );
    await fs.writeText(
      join(root, '.claude/skills/netscript-build/extra/nested/custom.md'),
      '# Extra\n',
    );
    await Deno.remove(join(root, '.claude/skills/netscript-operate/references/nested/keep.md'));
    await Deno.mkdir(join(root, '.claude/skills/deno/extra-empty'));
    // Even a byte-identical foreign canonical counterpart is outside our ownership allowlist.
    await fs.writeText(join(root, '.agents/skills/custom/SKILL.md'), '# Foreign\n');
    await copy(join(root, '.agents/skills/custom'), join(root, '.claude/skills/custom'));
    const before = new Map<string, Uint8Array>();
    for await (const entry of walk(join(root, '.claude/skills'), { includeDirs: false })) {
      before.set(entry.path, await Deno.readFile(entry.path));
    }
    for (let iteration = 0; iteration < 2; iteration++) {
      const result = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
      for (
        const path of [
          'netscript/references/nested/keep.md',
          'netscript-build/extra/nested/custom.md',
          'netscript-operate/references/nested/keep.md',
          'deno/extra-empty',
        ]
      ) {
        assert(result.messages.some((message) => message.includes(`.claude/skills/${path}`)), path);
      }
      assertFalse(result.messages.some((message) => message.includes('/custom/')));
      assertEquals(result.changedFiles, []);
      for (const [path, content] of before) assertEquals(await Deno.readFile(path), content);
      for (const name of names) assert(await fs.exists(join(root, '.claude/skills', name)));
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('#2008 cleanup: linked skill trees and references are retained without touching their targets', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const dependencies = { fs, aspireAgentInitializer: NO_ASPIRE };
    await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    const canonical = join(root, '.agents/skills/netscript');
    await Deno.symlink(canonical, join(root, '.claude/skills/netscript'), { type: 'dir' });
    await copy(join(root, '.agents/skills/deno'), join(root, '.claude/skills/deno'));
    await Deno.symlink(join(canonical, 'SKILL.md'), join(root, '.claude/skills/deno/linked.md'), {
      type: 'file',
    });
    const original = await fs.readText(join(canonical, 'SKILL.md'));
    const result = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    assert(
      result.messages.some((message) => message.includes('divergent .claude/skills/netscript.')),
    );
    assert(
      result.messages.some((message) =>
        message.includes('divergent .claude/skills/deno/linked.md.')
      ),
    );
    assert((await Deno.lstat(join(root, '.claude/skills/netscript'))).isSymlink);
    assert((await Deno.lstat(join(root, '.claude/skills/deno/linked.md'))).isSymlink);
    assertEquals(await fs.readText(join(canonical, 'SKILL.md')), original);
    assertEquals(result.changedFiles, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('#2008 cleanup: binary divergence and missing canonical skills never prove ownership', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const dependencies = { fs, aspireAgentInitializer: NO_ASPIRE };
    await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    const canonical = join(root, '.agents/skills/deno');
    await copy(canonical, join(root, '.claude/skills/deno'));
    // Different invalid UTF-8 bytes decode alike; cleanup must compare bytes, even after a chunk boundary.
    const original = new Uint8Array(150_001).fill(255);
    const edited = original.slice();
    edited[150_000] = 254;
    await Deno.writeFile(join(canonical, 'asset.bin'), original);
    await Deno.writeFile(join(root, '.claude/skills/deno/asset.bin'), edited);
    await fs.writeText(
      join(root, '.claude/skills/aspire-init/SKILL.md'),
      '# Legacy without canonical\n',
    );
    const result = await initAgent({ projectRoot: root, host: 'claude' }, dependencies);
    assert(
      result.messages.some((message) =>
        message.includes('divergent .claude/skills/deno/asset.bin.')
      ),
    );
    assert(
      result.messages.some((message) => message.includes('.claude/skills/aspire-init/SKILL.md')),
    );
    assertEquals(await Deno.readFile(join(root, '.claude/skills/deno/asset.bin')), edited);
    assertEquals(
      await fs.readText(join(root, '.claude/skills/aspire-init/SKILL.md')),
      '# Legacy without canonical\n',
    );
    assertEquals(result.changedFiles, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
