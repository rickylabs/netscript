/**
 * App root shared by every host. Routes use the Fresh 3 route-module shape
 * (middleware → handler → page in a layout); see `client/router.ts`.
 */
import type { JSX } from 'preact';
import { activeRoute, createRouter, type Middleware, type RouteModule } from './client/router.ts';
import {
  connectActivity,
  loadPreferences,
  loadRecord,
  loadRecords,
  loadWorkspace,
  refreshSession,
  session,
  signIn,
} from './client/state.ts';
import { host } from './client/host.ts';
import { Box, col, Text } from './ui/primitives.ts';
import { FONT, scheme, tokens } from './ui/theme.ts';
import { Shell } from './screens/shell.tsx';
import { OverviewPage } from './screens/overview.tsx';
import { RecordDetailPage, RecordsPage } from './screens/records.tsx';
import { DesignPage, HealthPage, SettingsPage, SignInPage } from './screens/system.tsx';

const routes: RouteModule<never>[] = [
  { pattern: '/sign-in', title: 'Sign in', page: () => null },
  {
    pattern: '/overview',
    title: 'Overview',
    handler: async () => {
      await loadWorkspace();
      return { data: undefined as never };
    },
    page: ({ navigate }) => <OverviewPage navigate={navigate} />,
  },
  {
    pattern: '/records',
    title: 'Records',
    handler: async () => {
      await loadRecords();
      return { data: undefined as never };
    },
    page: ({ navigate }) => <RecordsPage navigate={navigate} />,
  },
  {
    pattern: '/records/:id',
    title: 'Record',
    handler: async ({ params }) => {
      await loadRecord(params.id);
      return { data: undefined as never };
    },
    page: ({ navigate }) => <RecordDetailPage navigate={navigate} />,
  },
  { pattern: '/settings', title: 'Settings', page: () => <SettingsPage /> },
  { pattern: '/health', title: 'System health', page: () => <HealthPage /> },
  { pattern: '/design', title: 'Design', page: () => <DesignPage /> },
];

/** Fresh `_middleware`: every route except sign-in needs a session. */
const requireSession: Middleware = async (ctx) => {
  if (ctx.url.pathname === '/sign-in') return;
  if (session.value === undefined) await refreshSession();
  if (!session.value) return '/sign-in';
  connectActivity();
};

const router = createRouter(routes, [requireSession]);

export function navigate(href: string): void {
  void router.navigate(href).then(() => {
    const title = activeRoute.value?.route.title;
    if (title) host().native?.setTitle(`NetScript — ${title}`);
  });
}

export function App(): JSX.Element {
  const t = tokens();
  const active = activeRoute.value;
  if (!active) {
    return (
      <Box style={{ ...col, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: t.bg, fontFamily: FONT.sans }}>
        <Text tone='muted'>Starting…</Text>
      </Box>
    );
  }
  if (active.route.pattern === '/sign-in') return <SignInPage onSignedIn={() => navigate('/overview')} />;
  const Page = active.route.page;
  return (
    <Shell navigate={navigate}>
      <Page data={active.data as never} params={active.params} url={active.url} navigate={navigate} />
    </Shell>
  );
}

export interface BootOptions {
  /** Sign in programmatically (benchmarks, smoke tests). */
  readonly autoSignIn?: { email: string; password: string };
  readonly initialPath?: string;
  readonly scheme?: 'light' | 'dark';
}

export async function boot(options: BootOptions = {}): Promise<void> {
  await loadPreferences();
  if (options.scheme) scheme.value = options.scheme;
  if (options.autoSignIn) {
    await refreshSession();
    if (!session.value) await signIn(options.autoSignIn.email, options.autoSignIn.password);
  }
  navigate(options.initialPath ?? '/overview');
}
