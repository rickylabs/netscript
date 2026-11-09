/** Workspace shell: sidebar navigation + routed page, like the scaffold's `_layout`. */
import type { ComponentChildren, JSX } from 'preact';
import { Box, col, Divider, row, Scroll, Spacer, Text } from '../ui/primitives.ts';
import { FONT, RADIUS, SIZE, tokens } from '../ui/theme.ts';
import { activeRoute, navigating } from '../client/router.ts';
import { lastError, runningJobs, session, signOut, streamState, toast } from '../client/state.ts';
import { host } from '../client/host.ts';
import { initials } from '../ui/format.ts';

const NAV: Array<{ href: string; label: string; match: string }> = [
  { href: '/overview', label: 'Overview', match: '/overview' },
  { href: '/records', label: 'Records', match: '/records' },
  { href: '/health', label: 'System health', match: '/health' },
  { href: '/design', label: 'Design', match: '/design' },
  { href: '/settings', label: 'Settings', match: '/settings' },
];

export function Logo(): JSX.Element {
  const t = tokens();
  return (
    <Box style={{ ...row, gap: 8 }}>
      <Box style={{ width: 14, height: 14, backgroundColor: t.danger, borderRadius: 1 }} />
      <Text size='lg' weight={600}>NetScript</Text>
      <Text size='xs' tone='subtle' mono>desktop</Text>
    </Box>
  );
}

function NavItem({ href, label, active, navigate, badge }: { href: string; label: string; active: boolean; navigate: (href: string) => void; badge?: string }): JSX.Element {
  const t = tokens();
  return (
    <Box
      style={{
        ...row,
        height: 30,
        paddingLeft: 10,
        paddingRight: 8,
        borderRadius: RADIUS,
        cursor: 'pointer',
        backgroundColor: active ? t.surfaceMuted : 'transparent',
        borderLeftWidth: 2,
        borderColor: active ? t.ink : 'transparent',
      }}
      hover={{ backgroundColor: t.hover }}
      onClick={() => navigate(href)}
      testId={`nav-${href.slice(1)}`}
    >
      <Text size='md' weight={active ? 600 : 400} tone={active ? 'default' : 'muted'}>{label}</Text>
      <Spacer />
      {badge ? <Text size='xs' mono tone='subtle'>{badge}</Text> : null}
    </Box>
  );
}

export function Shell({ navigate, children }: { navigate: (href: string) => void; children?: ComponentChildren }): JSX.Element {
  const t = tokens();
  const current = activeRoute.value?.url.pathname ?? '';
  const user = session.value;
  const runtime = host().runtime;
  const live = streamState.value;
  return (
    <Box style={{ ...row, alignItems: 'stretch', width: '100%', height: '100%', backgroundColor: t.bg, color: t.text, fontFamily: FONT.sans, fontSize: SIZE.md }}>
      <Box style={{ ...col, width: 224, flexShrink: 0, backgroundColor: t.surface, borderRightWidth: 1, borderColor: t.border, padding: 14, gap: 4 }}>
        <Box style={{ paddingLeft: 4, paddingBottom: 14 }}><Logo /></Box>
        {NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            active={current.startsWith(item.match)}
            navigate={navigate}
            badge={item.href === '/overview' && runningJobs.value > 0 ? `${runningJobs.value} running` : undefined}
          />
        ))}
        <Spacer />
        <Box style={{ ...col, gap: 6, paddingLeft: 4, paddingBottom: 8 }}>
          <Box style={{ ...row, gap: 6 }}>
            <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: live === 'live' ? t.success : live === 'reconnecting' ? t.warning : t.textSubtle }} />
            <Text size='xs' mono tone='muted'>stream {live}</Text>
          </Box>
          <Text size='xs' mono tone='subtle'>{runtime.renderer} · {runtime.runtime}</Text>
        </Box>
        <Divider />
        {user
          ? (
            <Box style={{ ...row, gap: 8, paddingTop: 10 }}>
              <Box style={{ ...row, justifyContent: 'center', width: 26, height: 26, borderRadius: RADIUS, backgroundColor: t.surfaceMuted, borderWidth: 1, borderColor: t.border }}>
                <Text size='xs' mono weight={500}>{initials(user.name)}</Text>
              </Box>
              <Box style={{ ...col, minWidth: 0, flexGrow: 1, flexShrink: 1 }}>
                <Text size='sm' weight={500} truncate>{user.name}</Text>
                <Text size='xs' tone='subtle' truncate>{user.email}</Text>
              </Box>
              <Box style={{ cursor: 'pointer', paddingLeft: 4, paddingRight: 4 }} onClick={() => void signOut().then(() => navigate('/sign-in'))} testId='sign-out'>
                <Text size='xs' tone='muted'>Sign out</Text>
              </Box>
            </Box>
          )
          : null}
      </Box>
      <Box style={{ ...col, flexGrow: 1, flexShrink: 1, minWidth: 0, opacity: navigating.value ? 0.85 : 1 }}>
        {lastError.value
          ? (
            <Box style={{ ...row, gap: 10, paddingLeft: 24, paddingRight: 16, height: 32, borderBottomWidth: 1, borderColor: t.danger, backgroundColor: t.surface }}>
              <Text size='sm' tone='danger'>{lastError.value}</Text>
              <Spacer />
              <Box style={{ cursor: 'pointer' }} onClick={() => lastError.value = null}><Text size='xs' tone='muted'>Dismiss</Text></Box>
            </Box>
          )
          : null}
        <Scroll style={{ padding: 28, paddingTop: 24, gap: 20 }}>{children}</Scroll>
        {toast.value
          ? (
            <Box style={{ ...row, gap: 10, paddingLeft: 24, paddingRight: 16, height: 34, borderTopWidth: 1, borderColor: t.border, backgroundColor: t.surfaceMuted }}>
              <Text size='sm'>{toast.value}</Text>
            </Box>
          )
          : null}
      </Box>
    </Box>
  );
}

/** Page header with title, description and right-aligned actions. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ComponentChildren }): JSX.Element {
  return (
    <Box style={{ ...row, alignItems: 'flex-end', gap: 16 }}>
      <Box style={{ ...col, gap: 4, flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <Text size='xxl' weight={600}>{title}</Text>
        {description ? <Text size='md' tone='muted'>{description}</Text> : null}
      </Box>
      <Box style={{ ...row, gap: 8, flexShrink: 0 }}>{actions}</Box>
    </Box>
  );
}

/** Bordered section with heading, the scaffold's `workspace-section`. */
export function Section({ title, description, aside, children, grow = 1 }: { title: string; description?: string; aside?: ComponentChildren; children?: ComponentChildren; grow?: number }): JSX.Element {
  const t = tokens();
  return (
    <Box style={{ ...col, flexGrow: grow, flexShrink: 1, flexBasis: 0, minWidth: 0, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS, backgroundColor: t.bg }}>
      <Box style={{ ...row, gap: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: t.border }}>
        <Box style={{ ...col, gap: 2, flexGrow: 1, minWidth: 0 }}>
          <Text size='lg' weight={600}>{title}</Text>
          {description ? <Text size='sm' tone='muted'>{description}</Text> : null}
        </Box>
        {aside}
      </Box>
      <Box style={{ ...col, padding: 16, gap: 10 }}>{children}</Box>
    </Box>
  );
}
