/** Overview: the scaffold dashboard (stats, weekly chart, statuses, recent records, live activity, jobs). */
import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { type Metric, STATUS_LABEL, type WorkspaceRecord } from '../contract.ts';
import { Badge, Box, Button, col, Progress, row, Spacer, Text } from '../ui/primitives.ts';
import { RADIUS, tokens } from '../ui/theme.ts';
import { formatAmount, formatDelta, formatInt, formatTime, initials, statusTone } from '../ui/format.ts';
import { activity, jobs, lastError, loadWorkspace, overview } from '../client/state.ts';
import { host } from '../client/host.ts';
import { PageHeader, Section } from './shell.tsx';

let readyReported = false;

function StatCard({ label, value, metric, points = false, inverse = false }: { label: string; value: string; metric: Metric; points?: boolean; inverse?: boolean }): JSX.Element {
  const t = tokens();
  const tone = metric.delta > 0 && !inverse ? 'success' : 'muted';
  return (
    <Box style={{ ...col, gap: 6, flexGrow: 1, flexBasis: 0, minWidth: 0, padding: 16, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS, backgroundColor: t.bg }}>
      <Text size='sm' tone='muted' truncate>{label}</Text>
      <Text size='xxl' weight={400} mono>{value}</Text>
      <Box style={{ ...row, gap: 6 }}>
        <Text size='sm' tone={tone} mono>{formatDelta(metric, points)}</Text>
        <Text size='sm' tone='subtle'>vs. previous 28 days</Text>
      </Box>
    </Box>
  );
}

function ColumnChart({ data }: { data: Array<{ label: string; count: number }> }): JSX.Element {
  const t = tokens();
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <Box style={{ ...row, alignItems: 'flex-end', gap: 14, height: 168, paddingTop: 8 }}>
      {data.map((item, index) => (
        <Box key={item.label} style={{ ...col, alignItems: 'center', gap: 6, flexGrow: 1, flexBasis: 0 }}>
          <Text size='xs' mono tone='muted'>{formatInt(item.count)}</Text>
          <Box style={{ width: '100%', height: Math.max(2, Math.round((item.count / max) * 118)), backgroundColor: index === data.length - 1 ? t.chart : t.chartMuted, borderRadius: 1 }} />
          <Text size='xs' tone='subtle'>{item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}

function StatusBars(): JSX.Element {
  const t = tokens();
  const counts = (overview.value?.statusCounts ?? []).filter((item) => item.count > 0);
  const max = Math.max(1, ...counts.map((item) => item.count));
  return (
    <Box style={{ ...col, gap: 9 }}>
      {counts.map((item) => (
        <Box key={item.status} style={{ ...row, gap: 10 }}>
          <Box style={{ width: 128, flexShrink: 0 }}><Text size='sm' tone='muted'>{STATUS_LABEL[item.status]}</Text></Box>
          <Box style={{ flexGrow: 1, height: 10, backgroundColor: t.surfaceMuted, borderRadius: 1 }}>
            <Box style={{ height: 10, width: `${(item.count / max) * 100}%`, backgroundColor: item.status === 'paid' ? t.chart : t.chartMuted, borderRadius: 1 }} />
          </Box>
          <Box style={{ width: 40, flexShrink: 0, alignItems: 'flex-end', ...col }}><Text size='sm' mono>{formatInt(item.count)}</Text></Box>
        </Box>
      ))}
    </Box>
  );
}

export function RecordRow({ record, onOpen, compact = false }: { record: WorkspaceRecord; onOpen?: (record: WorkspaceRecord) => void; compact?: boolean }): JSX.Element {
  const t = tokens();
  return (
    <Box
      // Explicit width: rows inside a native <virtual-list> are laid out at their content width otherwise.
      style={{ ...row, width: '100%', flexShrink: 0, gap: 12, height: compact ? 34 : 38, paddingLeft: 8, paddingRight: 8, borderBottomWidth: 1, borderColor: t.border, cursor: onOpen ? 'pointer' : 'default' }}
      hover={onOpen ? { backgroundColor: t.hover } : undefined}
      onClick={onOpen ? () => onOpen(record) : undefined}
      testId={`record-${record.id}`}
    >
      <Box style={{ width: 92, flexShrink: 0 }}><Text size='sm' mono weight={500}>{record.reference}</Text></Box>
      <Box style={{ flexGrow: 1, flexBasis: 0, minWidth: 0 }}><Text size='sm' truncate>{record.ownerName}</Text></Box>
      <Box style={{ ...row, width: 132, flexShrink: 0 }}><Badge label={STATUS_LABEL[record.status]} tone={statusTone(record.status)} /></Box>
      <Box style={{ ...col, width: 104, flexShrink: 0, alignItems: 'flex-end' }}><Text size='sm' mono>{formatAmount(record.amount, record.currency)}</Text></Box>
      {compact ? null : <Box style={{ ...col, width: 76, flexShrink: 0, alignItems: 'flex-end' }}><Text size='xs' tone='subtle'>{formatTime(record.updatedAt)}</Text></Box>}
    </Box>
  );
}

function ActivityFeed(): JSX.Element {
  const t = tokens();
  const items = activity.value.slice(0, 8);
  if (items.length === 0) return <Text size='sm' tone='muted'>Record changes appear here as they stream in.</Text>;
  return (
    <Box style={{ ...col, gap: 10 }}>
      {items.map((item) => (
        <Box key={item.id} style={{ ...row, alignItems: 'flex-start', gap: 10 }}>
          <Box style={{ ...row, justifyContent: 'center', width: 24, height: 24, flexShrink: 0, borderRadius: RADIUS, backgroundColor: t.surfaceMuted }}>
            <Text size='xs' mono>{initials(item.actor)}</Text>
          </Box>
          <Box style={{ ...col, gap: 1, flexGrow: 1, minWidth: 0 }}>
            <Text size='sm' weight={600} truncate>{item.actor}</Text>
            <Text size='sm' tone='muted' truncate>{item.verb} · {item.label}</Text>
          </Box>
          <Text size='xs' tone='subtle'>{formatTime(item.timestamp)}</Text>
        </Box>
      ))}
    </Box>
  );
}

function Jobs(): JSX.Element {
  const t = tokens();
  return (
    <Box style={{ ...row, gap: 12, alignItems: 'stretch' }}>
      {jobs.value.map((job) => (
        <Box key={job.id} style={{ ...col, gap: 8, flexGrow: 1, flexBasis: 0, minWidth: 0, padding: 12, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS }}>
          <Box style={{ ...row, gap: 8 }}>
            <Text size='md' weight={600} truncate>{job.label}</Text>
            <Spacer />
            <Badge label={job.state} tone={job.state === 'completed' ? 'success' : job.state === 'failed' ? 'danger' : job.state === 'running' ? 'info' : 'muted'} />
          </Box>
          <Text size='sm' tone='muted' truncate>{job.detail}</Text>
          <Box style={{ ...row, gap: 8 }}>
            <Progress value={job.progress} tone={job.state === 'completed' ? 'success' : 'ink'} />
            <Text size='xs' mono tone='subtle'>{job.progress}%</Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

async function exportCsv(): Promise<void> {
  const native = host().native;
  const data = overview.value;
  if (!native || !data) return;
  const directory = await native.pickDirectory();
  if (!directory) return;
  const rows = ['reference,owner,status,amount,currency,updatedAt', ...data.latest.map((record) => [record.reference, record.ownerName, record.status, record.amount, record.currency, record.updatedAt].join(','))];
  const path = `${directory}/netscript-records-${Date.now()}.csv`;
  try {
    await native.writeTextFile(path, rows.join('\n'));
    native.notify('Export complete', path);
  } catch (error) {
    lastError.value = `Export failed: ${String(error)}`;
  }
}

export function OverviewPage({ navigate }: { navigate: (href: string) => void }): JSX.Element {
  const data = overview.value;
  useEffect(() => {
    if (data && !readyReported) {
      readyReported = true;
      host().onReady();
    }
  }, [data]);
  if (!data) return <Text tone='muted'>Loading overview…</Text>;
  const chf = data.totals.currencies.find((entry) => entry.currency === 'CHF')!;
  const eur = data.totals.currencies.find((entry) => entry.currency === 'EUR')!;
  return (
    <>
      <PageHeader
        title='Overview'
        description={`Records, amounts and activity for the last ${data.periodDays} days.`}
        actions={
          <>
            <Button label='↓ Export records' onPress={() => void exportCsv()} disabled={!host().native} testId='export' />
            <Button label='Refresh' variant='primary' onPress={() => void loadWorkspace()} testId='refresh' />
          </>
        }
      />
      <Box style={{ ...row, gap: 12, alignItems: 'stretch' }}>
        <StatCard label='Total amount · CHF' value={formatAmount(chf.amount.current, 'CHF')} metric={chf.amount} />
        <StatCard label='Records' value={formatInt(data.totals.records.current)} metric={data.totals.records} />
        <StatCard label='Average amount · EUR' value={formatAmount(eur.averageAmount.current, 'EUR')} metric={eur.averageAmount} />
        <StatCard label='Refund rate' value={`${data.totals.refundRate.current}%`} metric={data.totals.refundRate} points inverse />
      </Box>
      <Box style={{ ...row, gap: 12, alignItems: 'stretch' }}>
        <Section title='Records by week' description={`${formatInt(data.totals.records.current)} created · 7-day groups · UTC`} aside={<Badge label={`Last ${data.periodDays} days`} />}>
          <ColumnChart data={data.weekly} />
        </Section>
        <Section title='Status breakdown' description='Current status of records created this period'>
          <StatusBars />
        </Section>
      </Box>
      <Box style={{ ...row, gap: 12, alignItems: 'stretch' }}>
        <Section title='Recent records' description='The latest records across your workspace.' grow={3}
          aside={<Box style={{ cursor: 'pointer' }} onClick={() => navigate('/records')}><Text size='sm' weight={500}>View all records →</Text></Box>}>
          <Box style={{ ...col }}>
            {data.latest.map((record) => <RecordRow key={record.id} record={record} compact onOpen={(target) => navigate(`/records/${target.id}`)} />)}
          </Box>
        </Section>
        <Section title='Activity' description='Live from the durable stream' grow={2}>
          <ActivityFeed />
        </Section>
      </Box>
      <Section title='Background work' description='Jobs reported by connected workers.'>
        <Jobs />
      </Section>
    </>
  );
}
