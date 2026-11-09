/** Sign-in, settings, system health and design-token screens. */
import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Badge, Box, Button, col, Divider, Progress, row, Spacer, Text, TextInput } from '../ui/primitives.ts';
import { FONT, RADIUS, scheme, SIZE, THEMES, tokens } from '../ui/theme.ts';
import {
  busy,
  lastError,
  notificationsEnabled,
  session,
  setNotifications,
  setScheme,
  signIn,
  streamEvents,
  streamState,
} from '../client/state.ts';
import { host } from '../client/host.ts';
import { Logo, PageHeader, Section } from './shell.tsx';

export function SignInPage({ onSignedIn }: { onSignedIn: () => void }): JSX.Element {
  const t = tokens();
  const [email, setEmail] = useState('ada@netscript.dev');
  const [password, setPassword] = useState('');
  const submit = () => void signIn(email, password).then((ok) => ok && onSignedIn());
  return (
    <Box style={{ ...col, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: t.surface, fontFamily: FONT.sans }}>
      <Box style={{ ...col, gap: 14, width: 360, padding: 28, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS, backgroundColor: t.bg }}>
        <Logo />
        <Box style={{ ...col, gap: 4, paddingTop: 6 }}>
          <Text size='xl' weight={600}>Sign in</Text>
          <Text size='sm' tone='muted'>The session is an HttpOnly cookie issued by the workspace service.</Text>
        </Box>
        <Box style={{ ...col, gap: 6 }}>
          <Text size='sm' weight={500}>Email</Text>
          <TextInput value={email} onValue={setEmail} placeholder='you@company.com' testId='email' />
        </Box>
        <Box style={{ ...col, gap: 6 }}>
          <Text size='sm' weight={500}>Password</Text>
          <TextInput value={password} onValue={setPassword} placeholder='netscript' testId='password' />
        </Box>
        {lastError.value ? <Text size='sm' tone='danger'>{lastError.value}</Text> : null}
        <Button label={busy.value ? 'Signing in…' : 'Sign in'} variant='primary' disabled={busy.value} onPress={submit} testId='sign-in' />
        <Text size='xs' tone='subtle'>Demo: any email, password “netscript”.</Text>
      </Box>
    </Box>
  );
}

function Toggle({ label, description, on, onChange, testId }: { label: string; description: string; on: boolean; onChange: (next: boolean) => void; testId?: string }): JSX.Element {
  const t = tokens();
  return (
    <Box style={{ ...row, gap: 12, paddingTop: 6, paddingBottom: 6 }}>
      <Box style={{ ...col, gap: 2, flexGrow: 1 }}>
        <Text size='md' weight={500}>{label}</Text>
        <Text size='sm' tone='muted'>{description}</Text>
      </Box>
      <Box
        style={{ ...row, width: 36, height: 20, padding: 2, borderRadius: RADIUS, cursor: 'pointer', backgroundColor: on ? t.ink : t.surfaceMuted, borderWidth: 1, borderColor: on ? t.ink : t.borderStrong, justifyContent: on ? 'flex-end' : 'flex-start' }}
        onClick={() => onChange(!on)}
        testId={testId}
      >
        <Box style={{ width: 14, height: 14, borderRadius: 1, backgroundColor: on ? t.inkText : t.textSubtle }} />
      </Box>
    </Box>
  );
}

export function SettingsPage(): JSX.Element {
  const native = host().native;
  const [message, setMessage] = useState<string | null>(null);
  return (
    <>
      <PageHeader title='Settings' description='Preferences are stored locally (Deno KV in the native build, localStorage in the webview).' />
      <Box style={{ ...row, gap: 12, alignItems: 'flex-start' }}>
        <Section title='Appearance'>
          <Toggle label='Dark mode' description='Studio Utility, designed dark scheme' on={scheme.value === 'dark'} onChange={(dark) => void setScheme(dark ? 'dark' : 'light')} testId='toggle-dark' />
          <Divider />
          <Toggle label='Job notifications' description='Native notification when a background job completes' on={notificationsEnabled.value} onChange={(on) => void setNotifications(on)} />
        </Section>
        <Section title='Native capabilities' description={native ? 'In-process GPUIX renderer APIs' : 'Not available in this host'}>
          <Box style={{ ...row, gap: 8, flexWrap: 'wrap' }}>
            <Button label='Test notification' disabled={!native} onPress={() => native?.notify('NetScript', 'Native notification from the desktop host.')} />
            <Button label='Copy diagnostics' disabled={!native} onPress={() => {
              native?.copy(JSON.stringify({ ...host().runtime, memoryMb: host().runtime.memoryMb(), stream: streamState.value }, null, 2));
              setMessage('Diagnostics copied to the clipboard.');
            }} />
            <Button label='Rename window' disabled={!native} onPress={() => native?.setTitle(`NetScript — ${session.value?.name ?? 'desktop'}`)} />
          </Box>
          {message ? <Text size='sm' tone='muted'>{message}</Text> : null}
        </Section>
      </Box>
      <Section title='Connection'>
        <Box style={{ ...row, gap: 8 }}><Box style={{ width: 140 }}><Text size='sm' tone='muted'>Service</Text></Box><Text size='sm' mono>{host().baseUrl}</Text></Box>
        <Box style={{ ...row, gap: 8 }}><Box style={{ width: 140 }}><Text size='sm' tone='muted'>Signed in as</Text></Box><Text size='sm'>{session.value?.email ?? '—'}</Text></Box>
      </Section>
    </>
  );
}

interface HealthReport {
  status?: string;
  [key: string]: unknown;
}

interface StackReport {
  readyMs: number;
  hostRssMb: number | null;
  totalRssMb: number | null;
  processes: number | null;
  nodes: Array<{ name: string; kind: string; port: number; pid?: number; state: string; spawnedAt?: number; readyAt?: number; rssMb: number | null }>;
}

/** The supervised NetScript graph (real-stack builds): an in-app, Aspire-dashboard-sized view. */
function StackSection({ stack }: { stack: StackReport }): JSX.Element {
  const header = { size: 'xs' as const, tone: 'muted' as const, mono: true };
  const cell = (width: number, child: JSX.Element, end = false) => (
    <Box style={{ width, flexShrink: 0, ...(end ? { alignItems: 'flex-end' } : {}) }}>{child}</Box>
  );
  return (
    <Section
      title='NetScript graph'
      description={`Supervised by this process · ready in ${(stack.readyMs / 1000).toFixed(2)} s · ${stack.processes ?? '?'} processes · ${stack.totalRssMb?.toFixed(0) ?? '?'} MB resident in total`}
    >
      <Box style={{ ...row, gap: 8 }}>
        {cell(130, <Text {...header}>NODE</Text>)}
        {cell(96, <Text {...header}>KIND</Text>)}
        {cell(84, <Text {...header}>STATE</Text>)}
        {cell(64, <Text {...header}>PORT</Text>, true)}
        {cell(72, <Text {...header}>PID</Text>, true)}
        {cell(84, <Text {...header}>READY</Text>, true)}
        {cell(84, <Text {...header}>MEMORY</Text>, true)}
      </Box>
      {stack.nodes.map((node) => (
        <Box key={node.name} style={{ ...row, gap: 8 }}>
          {cell(130, <Text size='sm' mono>{node.name}</Text>)}
          {cell(96, <Text size='sm' tone='muted'>{node.kind}</Text>)}
          {cell(84, <Badge label={node.state} tone={node.state === 'ready' ? 'success' : 'warning'} />)}
          {cell(64, <Text size='sm' mono>{String(node.port)}</Text>, true)}
          {cell(72, <Text size='sm' mono tone='muted'>{String(node.pid ?? '—')}</Text>, true)}
          {cell(84, <Text size='sm' mono>{node.readyAt !== undefined && node.spawnedAt !== undefined ? `${node.readyAt - node.spawnedAt} ms` : '—'}</Text>, true)}
          {cell(84, <Text size='sm' mono>{node.rssMb === null ? '—' : `${node.rssMb.toFixed(0)} MB`}</Text>, true)}
        </Box>
      ))}
      <Text size='xs' tone='subtle'>Desktop host (UI, BFF, SDK clients): {stack.hostRssMb?.toFixed(0) ?? '?'} MB resident.</Text>
    </Section>
  );
}

export function HealthPage(): JSX.Element {
  const t = tokens();
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [stack, setStack] = useState<StackReport | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const probe = async () => {
      const started = performance.now();
      try {
        const response = await host().fetch(`${host().baseUrl}/health`);
        const body = await response.json() as HealthReport;
        if (alive) {
          setHealth(body);
          setLatency(performance.now() - started);
        }
      } catch (error) {
        if (alive) setHealth({ status: 'unreachable', error: String(error) });
      }
      try {
        const response = await host().fetch(`${host().baseUrl}/__stack`);
        if (response.ok && alive) setStack(await response.json() as StackReport);
        else await response.body?.cancel();
      } catch {
        // Not a real-stack build.
      }
      if (alive) setTick((value) => value + 1);
    };
    void probe();
    const timer = setInterval(probe, 2_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  const runtime = host().runtime;
  const memory = runtime.memoryMb();
  const frames = host().native?.frameStats() ?? null;
  return (
    <>
      <PageHeader title='System health' description='Service probe, stream state and runtime metrics, refreshed every 2 s.' />
      <Box style={{ ...row, gap: 12, alignItems: 'stretch' }}>
        <Section title='Service'>
          <Box style={{ ...row, gap: 8 }}><Badge label={String(health?.status ?? 'probing')} tone={health?.status === 'healthy' ? 'success' : 'warning'} /><Spacer /><Text size='sm' mono tone='muted'>{latency === null ? '—' : `${latency.toFixed(1)} ms`}</Text></Box>
          <Text size='xs' mono tone='muted'>{JSON.stringify(health ?? {}).slice(0, 180)}</Text>
        </Section>
        <Section title='Durable stream'>
          <Box style={{ ...row, gap: 8 }}><Badge label={streamState.value} tone={streamState.value === 'live' ? 'success' : 'warning'} /><Spacer /><Text size='sm' mono>{streamEvents.value} events</Text></Box>
          <Text size='xs' tone='muted'>Fetch-based SSE consumer from @netscript/sdk/streams/consumer with offset resume.</Text>
        </Section>
        <Section title='Runtime'>
          <Text size='sm' mono>{runtime.renderer}</Text>
          <Text size='sm' mono>{runtime.runtime} · {runtime.platform}</Text>
          <Box style={{ ...row, gap: 8 }}><Text size='sm' tone='muted'>Process memory</Text><Spacer /><Text size='sm' mono>{memory === null ? 'n/a' : `${memory.toFixed(0)} MB`}</Text></Box>
          {memory !== null ? <Progress value={(memory / 512) * 100} /> : null}
        </Section>
      </Box>
      {stack ? <StackSection stack={stack} /> : null}
      {frames
        ? (
          <Section title='Frame stats' description='GPUI debug overlay counters'>
            <Box style={{ ...row, gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(frames).slice(0, 8).map(([key, value]) => (
                <Box key={key} style={{ ...col, gap: 2, minWidth: 120 }}>
                  <Text size='xs' tone='muted' mono>{key}</Text>
                  <Text size='lg' mono>{typeof value === 'number' ? Number(value.toFixed(2)) : String(value)}</Text>
                </Box>
              ))}
            </Box>
          </Section>
        )
        : null}
      <Text size='xs' tone='subtle'>Theme surface: {t.bg}</Text>
    </>
  );
}

export function DesignPage(): JSX.Element {
  const t = tokens();
  const swatches = Object.entries(THEMES[scheme.value]);
  return (
    <>
      <PageHeader title='Design' description='Studio Utility tokens rendered natively. fresh-ui ships them as CSS variables; here they are data.' />
      <Section title={`Color · ${scheme.value}`}>
        <Box style={{ ...row, gap: 10, flexWrap: 'wrap' }}>
          {swatches.map(([name, value]) => (
            <Box key={name} style={{ ...col, gap: 4, width: 112 }}>
              <Box style={{ height: 40, backgroundColor: value, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS }} />
              <Text size='xs' mono>{name}</Text>
              <Text size='xs' mono tone='subtle'>{value}</Text>
            </Box>
          ))}
        </Box>
      </Section>
      <Box style={{ ...row, gap: 12, alignItems: 'stretch' }}>
        <Section title='Type scale'>
          {(Object.keys(SIZE) as Array<keyof typeof SIZE>).map((size) => (
            <Box key={size} style={{ ...row, gap: 12 }}>
              <Box style={{ width: 70 }}><Text size='xs' mono tone='subtle'>{size} · {SIZE[size]}</Text></Box>
              <Text size={size}>Precision engineering</Text>
            </Box>
          ))}
        </Section>
        <Section title='Controls'>
          <Box style={{ ...row, gap: 8 }}>
            <Button label='Primary' variant='primary' />
            <Button label='Outline' />
            <Button label='Ghost' variant='ghost' />
            <Button label='Disabled' disabled />
          </Box>
          <Box style={{ ...row, gap: 6 }}>
            <Badge label='paid' tone='success' />
            <Badge label='awaiting' tone='warning' />
            <Badge label='shipped' tone='info' />
            <Badge label='error' tone='danger' />
            <Badge label='pending' />
          </Box>
          <Progress value={62} />
        </Section>
      </Box>
    </>
  );
}
