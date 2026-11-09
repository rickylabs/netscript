/** Records list (search, status filter, paging) and record detail (status actions, clipboard). */
import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { RECORD_STATUSES, type RecordStatus, STATUS_LABEL } from '../contract.ts';
import { Badge, Box, Button, col, row, Spacer, Text, TextInput } from '../ui/primitives.ts';
import { RADIUS, tokens } from '../ui/theme.ts';
import { formatAmount, formatInt, statusTone } from '../ui/format.ts';
import {
  createRecord,
  loadRecords,
  records,
  recordsPage,
  recordsQuery,
  recordsStatus,
  selectedRecord,
  setRecordStatus,
  setRecordsVisible,
} from '../client/state.ts';
import { host } from '../client/host.ts';
import { PageHeader, Section } from './shell.tsx';
import { RecordRow } from './overview.tsx';

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }): JSX.Element {
  const t = tokens();
  return (
    <Box
      style={{ ...row, height: 26, paddingLeft: 10, paddingRight: 10, borderWidth: 1, borderRadius: RADIUS, cursor: 'pointer', borderColor: active ? t.ink : t.border, backgroundColor: active ? t.surfaceMuted : t.bg }}
      hover={{ borderColor: t.borderStrong }}
      onClick={onPress}
    >
      <Text size='sm' weight={active ? 600 : 400} tone={active ? 'default' : 'muted'}>{label}</Text>
    </Box>
  );
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;

export function RecordsPage({ navigate }: { navigate: (href: string) => void }): JSX.Element {
  const t = tokens();
  const [draftOwner, setDraftOwner] = useState('');
  useEffect(() => {
    setRecordsVisible(true);
    return () => setRecordsVisible(false);
  }, []);
  const page = records.value;
  const pages = page ? Math.max(1, Math.ceil(page.total / page.pageSize)) : 1;
  const filter = (status: RecordStatus | undefined) => {
    recordsStatus.value = status;
    recordsPage.value = 1;
    void loadRecords();
  };
  return (
    <>
      <PageHeader
        title='Records'
        description={page ? `${formatInt(page.total)} records match` : 'Loading…'}
        actions={
          <>
            <TextInput value={draftOwner} onValue={setDraftOwner} placeholder='Owner name' style={{ width: 180 }} testId='new-owner' />
            <Button
              label='+ New record'
              variant='primary'
              disabled={draftOwner.trim().length === 0}
              testId='create-record'
              onPress={() => void createRecord(draftOwner.trim(), 120).then((record) => {
                setDraftOwner('');
                if (record) navigate(`/records/${record.id}`);
              })}
            />
          </>
        }
      />
      <Box style={{ ...row, gap: 8, flexWrap: 'wrap' }}>
        <TextInput
          value={recordsQuery.value}
          placeholder='Search reference or owner'
          testId='records-search'
          style={{ width: 260 }}
          onValue={(value) => {
            recordsQuery.value = value;
            recordsPage.value = 1;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => void loadRecords(), 150);
          }}
        />
        <Chip label='All' active={!recordsStatus.value} onPress={() => filter(undefined)} />
        {RECORD_STATUSES.map((status) => <Chip key={status} label={STATUS_LABEL[status]} active={recordsStatus.value === status} onPress={() => filter(status)} />)}
      </Box>
      <Box style={{ ...col, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS }}>
        <Box style={{ ...row, gap: 12, height: 32, paddingLeft: 8, paddingRight: 8, borderBottomWidth: 1, borderColor: t.border, backgroundColor: t.surface }}>
          <Box style={{ width: 92 }}><Text size='xs' tone='muted' mono>REFERENCE</Text></Box>
          <Box style={{ flexGrow: 1, flexBasis: 0 }}><Text size='xs' tone='muted' mono>OWNER</Text></Box>
          <Box style={{ width: 132 }}><Text size='xs' tone='muted' mono>STATUS</Text></Box>
          <Box style={{ ...col, width: 104, alignItems: 'flex-end' }}><Text size='xs' tone='muted' mono>AMOUNT</Text></Box>
          <Box style={{ ...col, width: 76, alignItems: 'flex-end' }}><Text size='xs' tone='muted' mono>UPDATED</Text></Box>
        </Box>
        {page?.rows.map((record) => <RecordRow key={record.id} record={record} onOpen={(target) => navigate(`/records/${target.id}`)} />)}
      </Box>
      <Box style={{ ...row, gap: 8 }}>
        <Text size='sm' tone='muted' mono>Page {page?.page ?? 1} / {pages}</Text>
        <Spacer />
        <Button label='← Previous' disabled={(page?.page ?? 1) <= 1} onPress={() => { recordsPage.value -= 1; void loadRecords(); }} />
        <Button label='Next →' disabled={(page?.page ?? 1) >= pages} onPress={() => { recordsPage.value += 1; void loadRecords(); }} testId='next-page' />
      </Box>
    </>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }): JSX.Element {
  const t = tokens();
  return (
    <Box style={{ ...row, height: 36, borderBottomWidth: 1, borderColor: t.border }}>
      <Box style={{ width: 140 }}><Text size='sm' tone='muted'>{label}</Text></Box>
      <Text size='sm' mono={mono}>{value}</Text>
    </Box>
  );
}

export function RecordDetailPage({ navigate }: { navigate: (href: string) => void }): JSX.Element {
  const record = selectedRecord.value;
  if (!record) return <Text tone='muted'>Loading record…</Text>;
  const native = host().native;
  return (
    <>
      <Box style={{ cursor: 'pointer' }} onClick={() => navigate('/records')}><Text size='sm' tone='muted'>← Records</Text></Box>
      <PageHeader
        title={record.reference}
        description={`Owned by ${record.ownerName}`}
        actions={
          <>
            <Badge label={STATUS_LABEL[record.status]} tone={statusTone(record.status)} />
            <Button label='Copy reference' disabled={!native} onPress={() => native?.copy(record.reference)} testId='copy-reference' />
          </>
        }
      />
      <Box style={{ ...row, gap: 12, alignItems: 'flex-start' }}>
        <Section title='Details' grow={3}>
          <Field label='Record id' value={record.id} mono />
          <Field label='Amount' value={formatAmount(record.amount, record.currency)} mono />
          <Field label='Currency' value={record.currency} />
          <Field label='Created' value={new Date(record.createdAt).toLocaleString('en-CH')} />
          <Field label='Updated' value={new Date(record.updatedAt).toLocaleString('en-CH')} />
        </Section>
        <Section title='Status' description='Writes through the typed oRPC contract' grow={2}>
          {RECORD_STATUSES.map((status) => (
            <Button
              key={status}
              label={STATUS_LABEL[status]}
              variant={record.status === status ? 'primary' : 'outline'}
              onPress={() => void setRecordStatus(record.id, status)}
              testId={`status-${status}`}
            />
          ))}
        </Section>
      </Box>
    </>
  );
}
