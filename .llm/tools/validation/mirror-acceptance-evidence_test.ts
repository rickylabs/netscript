import { assertEquals } from 'jsr:@std/assert@1';
import type { AcceptanceEvidence } from './acceptance-evidence.ts';
import {
  closingMirrorIssues,
  type MirrorClient,
  mirrorIssue,
} from './mirror-acceptance-evidence.ts';

Deno.test('mirror excludes classified pull requests and retains lookup failures', () => {
  assertEquals(
    closingMirrorIssues(
      [1415, 1431, 1432],
      new Map([
        [1415, 'issue'],
        [1431, 'pull request'],
        [1432, 'lookup failed'],
      ]),
    ),
    {
      issues: [1415, 1432],
      notices: [
        'Closing reference #1415 classified as issue; retained for acceptance mirroring.',
        'Closing reference #1431 classified as pull request; excluded from acceptance mirroring.',
        'Closing reference #1432 classification lookup failed; retained for acceptance mirroring.',
      ],
    },
  );
});

Deno.test('mirror retries once from a live body after a mid-air edit', async () => {
  let body = '## Acceptance\n- [ ] criterion';
  let updatedAt = '2026-08-03T10:00:00Z';
  let updates = 0;
  const client: MirrorClient = {
    getIssue: (number) =>
      Promise.resolve({ number, title: 'race', body, updated_at: updatedAt, labels: [] }),
    getPullRequest: () => Promise.reject(new Error('unused')),
    getComments: () => Promise.resolve([]),
    updateIssue: (_number, nextBody) => {
      updates++;
      if (updates === 1) {
        body = '## Acceptance\n- [ ] criterion\n\nconcurrent editor note';
        updatedAt = '2026-08-03T10:00:01Z';
      } else {
        body = nextBody;
        updatedAt = '2026-08-03T10:00:02Z';
      }
      return Promise.resolve();
    },
    postComment: () => Promise.resolve(),
  };
  const evidence: AcceptanceEvidence[] = [{
    issue: 12,
    text: 'criterion',
    evidence: 'CI run',
    legacy: false,
  }];

  const result = await mirrorIssue(client, 12, evidence, false);

  assertEquals(updates, 2);
  assertEquals(result.changed, true);
  assertEquals(body, '## Acceptance\n- [x] criterion\n\nconcurrent editor note');
  assertEquals(result.snapshot.updatedAt, '2026-08-03T10:00:02Z');
});
