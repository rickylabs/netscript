import { assertEquals } from '@std/assert';
import { ASPIRE_WORKFLOW_SKILLS } from '../../features/agent/init/aspire-agent-initializer.ts';
import { aspireAgentInitArgs } from './deno-aspire-agent-initializer.ts';

Deno.test('Aspire agent init selects only the four non-colliding workflow skills', () => {
  const args = aspireAgentInitArgs('/workspace/project');
  assertEquals(args, [
    'agent',
    'init',
    '--non-interactive',
    '--nologo',
    '--workspace-root',
    '/workspace/project',
    '--skill-locations',
    'standard,claudecode',
    '--skills',
    'aspire-init,aspire-orchestration,aspire-monitoring,aspire-deployment',
  ]);
  const selected = args[args.indexOf('--skills') + 1].split(',');
  assertEquals(selected, ASPIRE_WORKFLOW_SKILLS);
  assertEquals(selected.includes('aspire'), false);
  assertEquals(selected.includes('all'), false);
});
