import {
  Alert,
  Badge,
  Button,
  Card,
  InlineNotice,
  PageHeader,
  Panel,
  Progress,
  ResponsiveTable,
  type ResponsiveTableColumn,
  StatsGrid,
} from '@app/components/ui/mod.ts';

interface ServiceRow {
  readonly name: string;
  readonly owner: string;
  readonly region: string;
  readonly status: 'Live' | 'Queued' | 'Paused';
  readonly latency: string;
  readonly updated: string;
}

interface DashboardViewProps {
  readonly projectName: string;
  readonly appName: string;
  readonly services: readonly ServiceRow[];
}

const columns: readonly ResponsiveTableColumn<ServiceRow>[] = [
  {
    key: 'name',
    label: 'Service',
    priority: 'primary',
    cell: (service) => service.name,
  },
  {
    key: 'owner',
    label: 'Owner',
    cell: (service) => service.owner,
  },
  {
    key: 'region',
    label: 'Region',
    cell: (service) => service.region,
  },
  {
    key: 'status',
    label: 'Status',
    cell: (service) => (
      <Badge
        variant={service.status === 'Live'
          ? 'success'
          : service.status === 'Queued'
          ? 'secondary'
          : 'muted'}
      >
        {service.status}
      </Badge>
    ),
  },
  {
    key: 'latency',
    label: 'P95',
    align: 'end',
    cell: (service) => service.latency,
  },
  {
    key: 'updated',
    label: 'Updated',
    align: 'end',
    cell: (service) => service.updated,
  },
];

export default function DashboardView({ projectName, appName, services }: DashboardViewProps) {
  return (
    <main class='ns-shell ns-section ns-stack ns-stack--lg'>
      <PageHeader>
        <PageHeader.Layout>
          <PageHeader.Main>
            <PageHeader.Badges>
              <Badge variant='primary'>Dashboard</Badge>
              <Badge variant='muted'>{appName}</Badge>
            </PageHeader.Badges>
            <PageHeader.Intro>
              <h1>{projectName}</h1>
              <p class='ns-lede'>
                A registry-only operations view with summary cards, service health, and action
                rails ready for real contracts.
              </p>
            </PageHeader.Intro>
            <PageHeader.Actions>
              <Button type='link' href='/examples/crud'>Review CRUD flow</Button>
              <Button type='link' href='/design/tokens' variant='outline'>Inspect tokens</Button>
            </PageHeader.Actions>
          </PageHeader.Main>
          <PageHeader.Aside>
            <InlineNotice title='Scaffold status'>
              Replace these static rows with loaders that read your service contracts.
            </InlineNotice>
          </PageHeader.Aside>
        </PageHeader.Layout>
      </PageHeader>

      <StatsGrid>
        <StatsGrid.Card label='Services' value={services.length} detail='Seeded operational rows' />
        <StatsGrid.Card label='Healthy' value='1' detail='Live service in this scaffold' badge={<Badge variant='success'>ok</Badge>} />
        <StatsGrid.Card label='Queued' value='1' detail='Background work awaiting capacity' badge={<Badge variant='secondary'>watch</Badge>} />
        <StatsGrid.Card label='P95 high' value='612ms' detail='Use your telemetry source here' badge={<Badge variant='warning'>trace</Badge>} />
      </StatsGrid>

      <div class='ns-grid ns-grid--2'>
        <Card>
          <Card.Header>
            <Card.Title>Service health</Card.Title>
            <Card.Description>Responsive table block with semantic mobile cells.</Card.Description>
          </Card.Header>
          <Card.Body>
            <ResponsiveTable
              caption='Service health'
              columns={columns}
              rows={services}
              getRowKey={(service) => service.name}
              summary={<span>{services.length} services tracked</span>}
            />
          </Card.Body>
        </Card>

        <Panel tone='muted'>
          <Panel.Header>
            <Panel.Title>Deployment readiness</Panel.Title>
            <Panel.Description>Static scaffold data shaped like an operations rail.</Panel.Description>
          </Panel.Header>
          <Panel.Body>
            <div class='ns-stack ns-stack--md'>
              <Progress value={64} label='Contract coverage' />
              <Progress value={42} label='Background jobs' variant='warning' />
              <Alert variant='info' title='Next integration'>
                Connect this panel to your service health endpoint or database read model.
              </Alert>
            </div>
          </Panel.Body>
        </Panel>
      </div>
    </main>
  );
}
