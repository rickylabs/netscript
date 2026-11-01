import { expect, test } from '@playwright/test';
import { APP_DIR, EXTERNAL_SERVER } from '../settings.ts';

test(
  'CodeBlock memoizes highlighting through streaming Message re-renders',
  async ({ page }, testInfo) => {
    test.skip(EXTERNAL_SERVER, 'Requires the owned scaffold with installed component fixtures');
    await page.goto('/');
    const snapshots = await page.evaluate(async (fixture) => {
      return (await import(fixture)).exerciseCodeBlock() as Array<{
        name: string;
        calls: number;
        body: string;
        code: string;
        clipboard: string;
        filename: string;
        syntaxSpans: number;
        injectedElements: number;
      }>;
    }, `/@fs/${APP_DIR}/browser-fixtures/test-code-block.ts`);
    await testInfo.attach('highlight-call-counts', {
      body: JSON.stringify(snapshots, null, 2),
      contentType: 'application/json',
    });
    expect(snapshots.map(({ calls }) => calls)).toEqual([
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      3,
      3,
      3,
      4,
      5,
    ]);
    expect(snapshots.slice(0, 11).map(({ body }) => body)).toEqual(
      Array.from({ length: 11 }, (_, token) => `Token ${token}`),
    );
    expect(snapshots.find(({ name }) => name === 'filename')?.filename).toBe('renamed.ts');
    for (const snapshot of snapshots) {
      expect(snapshot.clipboard).toBe(snapshot.code);
      expect(snapshot.injectedElements).toBe(0);
      if (snapshot.name === 'unknown' || snapshot.name === 'plain') {
        expect(snapshot.syntaxSpans).toBe(0);
        expect(snapshot.code).toContain('<img src=x');
      } else {
        expect(snapshot.syntaxSpans).toBeGreaterThan(0);
      }
    }
  },
);
