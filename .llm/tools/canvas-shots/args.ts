export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

export interface CanvasShotsOptions {
  serveUrl: string;
  outDir: string;
  routes: string[];
  themes: Theme[];
  viewport: { width: number; height: number };
  scale: number;
  settleMs: number;
  format: 'json' | 'pretty';
  allowDefects: boolean;
}

function takeValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function positiveNumber(value: string, flag: string, integer = false): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || (integer && !Number.isInteger(parsed))) {
    throw new Error(`${flag} must be a positive ${integer ? 'integer' : 'number'}`);
  }
  return parsed;
}

function parseViewport(value: string): { width: number; height: number } {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) throw new Error('--viewport must have the form WIDTHxHEIGHT');
  return {
    width: positiveNumber(match[1], '--viewport width', true),
    height: positiveNumber(match[2], '--viewport height', true),
  };
}

function parseRoutes(value: string): string[] {
  return value.split(',').map((route) => route.trim());
}

function parseThemes(value: string): Theme[] {
  const values = value.split(',').map((theme) => theme.trim());
  if (values.length === 0 || values.some((theme) => !THEMES.includes(theme as Theme))) {
    throw new Error('--themes accepts only light,dark');
  }
  return values as Theme[];
}

/** Parses the canvas screenshot command-line contract. */
export function parseArgs(args: string[]): CanvasShotsOptions {
  let serveUrl: string | undefined;
  let outDir: string | undefined;
  let routes = [''];
  let themes: Theme[] = [...THEMES];
  let viewport = { width: 1440, height: 900 };
  let scale = 2;
  let settleMs = 2500;
  let format: 'json' | 'pretty' = 'pretty';
  let formatFlag: '--json' | '--pretty' | undefined;
  let allowDefects = false;

  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    switch (flag) {
      case '--serve-url':
        serveUrl = takeValue(args, index++, flag);
        break;
      case '--out':
        outDir = takeValue(args, index++, flag);
        break;
      case '--routes':
        routes = parseRoutes(takeValue(args, index++, flag));
        break;
      case '--themes':
        themes = parseThemes(takeValue(args, index++, flag));
        break;
      case '--viewport':
        viewport = parseViewport(takeValue(args, index++, flag));
        break;
      case '--scale':
        scale = positiveNumber(takeValue(args, index++, flag), flag);
        break;
      case '--settle-ms':
        settleMs = positiveNumber(takeValue(args, index++, flag), flag, true);
        break;
      case '--json':
        if (formatFlag) throw new Error('--json and --pretty may be passed only once');
        formatFlag = flag;
        format = 'json';
        break;
      case '--pretty':
        if (formatFlag) throw new Error('--json and --pretty may be passed only once');
        formatFlag = flag;
        format = 'pretty';
        break;
      case '--allow-defects':
        allowDefects = true;
        break;
      default:
        throw new Error(`unknown option: ${flag}`);
    }
  }

  if (!serveUrl) throw new Error('--serve-url is required');
  if (!outDir) throw new Error('--out is required');
  try {
    new URL(serveUrl);
  } catch {
    throw new Error('--serve-url must be an absolute URL');
  }

  return { serveUrl, outDir, routes, themes, viewport, scale, settleMs, format, allowDefects };
}
