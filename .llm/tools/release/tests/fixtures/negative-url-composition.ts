import readmeText from './sample.txt' with { type: 'text' };

const routeModule = new URL('../routes/index.ts', import.meta.url);
const httpTarget = new URL('/openapi.json', 'https://example.test');

export function describeRoute(): string {
  return `${routeModule.href}:${httpTarget.href}:${readmeText.length}`;
}
