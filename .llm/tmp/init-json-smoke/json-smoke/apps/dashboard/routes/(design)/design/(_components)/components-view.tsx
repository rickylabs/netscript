import type { VNode } from 'preact';
import {
  Alert,
  Badge,
  type BadgeVariant,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  DataTable,
  DetailLayout,
  EmptyState,
  FilterForm,
  FormField,
  IconButton,
  InlineNotice,
  Input,
  Label,
  PageHeader,
  Pagination,
  Panel,
  Progress,
  ResponsiveTable,
  type ResponsiveTableColumn,
  SectionDivider,
  Select,
  Separator,
  Skeleton,
  Spinner,
  StatsGrid,
  Switch,
  Textarea,
} from '@app/components/ui/mod.ts';
import {
  registryCatalog,
  type RegistryCatalogItem,
  type RegistryItemKind,
  registryMeta,
} from '../(_shared)/registry.ts';
import { tokenManifestMeta } from '../(_shared)/tokens.ts';
import { FloatingSurfaceDemo } from '../(_islands)/FloatingSurfaceDemo.tsx';

const SECTIONS = [
  {
    id: 'components',
    label: 'Components',
    kinds: ['component'],
    lede:
      'Layer-2 primitives. Each one is copied into the app with ui:add, owns no palette of its own, and renders here live against the active theme.',
  },
  {
    id: 'blocks',
    label: 'Blocks',
    kinds: ['block'],
    lede:
      'Layer-3 compositions. Blocks arrange primitives into dashboard seams — headers, tables, rails — and stay theme-blind the same way.',
  },
  {
    id: 'islands',
    label: 'Islands',
    kinds: ['island'],
    lede:
      'Client-side interactivity. The islands ship as registry items too; two of them are running in the chrome of this very page.',
  },
  {
    id: 'styles',
    label: 'Styles',
    kinds: ['style'],
    lede:
      'Shared CSS seams installed alongside components. They speak only the semantic --ns-* vocabulary, so a new theme restyles them without edits.',
  },
  {
    id: 'foundation',
    label: 'Foundation',
    kinds: ['theme', 'lib', 'support'],
    lede:
      'The theme and the plumbing everything else depends on: NS One token artifacts, the class-merge helper, shared types, and form/toast support.',
  },
] as const satisfies readonly {
  id: string;
  label: string;
  kinds: readonly RegistryItemKind[];
  lede: string;
}[];

const KIND_BADGES: Record<RegistryItemKind, BadgeVariant> = {
  component: 'primary',
  block: 'secondary',
  island: 'success',
  style: 'muted',
  theme: 'warning',
  lib: 'muted',
  hook: 'muted',
  support: 'muted',
};

/** Style seams are demonstrated by the items rendered above them. */
const STYLE_REFS: Record<string, readonly string[]> = {
  'form-control-styles': ['input', 'textarea', 'select'],
  'choice-styles': ['checkbox', 'switch'],
  'surface-styles': ['card', 'panel'],
  'alert-styles': ['alert', 'inline-notice'],
  'layout-objects': ['sidebar-shell', 'page-header', 'stats-grid'],
};

const REGION_OPTIONS = [
  { value: 'eu-west', label: 'eu-west' },
  { value: 'us-east', label: 'us-east' },
  { value: 'ap-south', label: 'ap-south (at capacity)', disabled: true },
] as const;

const RESPONSIVE_TABLE_ROWS = [
  {
    service: 'api-gateway',
    owner: 'platform',
    region: 'eu-west',
    status: 'Live',
    latency: '184ms',
    updated: '2m ago',
  },
  {
    service: 'billing-worker',
    owner: 'finance',
    region: 'us-east',
    status: 'Queued',
    latency: '321ms',
    updated: '11m ago',
  },
  {
    service: 'analytics-import',
    owner: 'data',
    region: 'ap-south',
    status: 'Paused',
    latency: '612ms',
    updated: '1h ago',
  },
] as const;

type ResponsiveTableRow = typeof RESPONSIVE_TABLE_ROWS[number];

const RESPONSIVE_TABLE_COLUMNS: readonly ResponsiveTableColumn<ResponsiveTableRow>[] = [
  {
    key: 'service',
    label: 'Service',
    priority: 'primary',
    cell: (row) => (
      <span class='ns-stack ns-stack--2xs'>
        <span class='truncate font-medium text-ns-fg'>{row.service}</span>
        <span class='text-xs text-ns-muted-fg'>{row.owner} team</span>
      </span>
    ),
  },
  {
    key: 'region',
    label: 'Region',
    cell: (row) => <span class='font-mono text-xs text-ns-muted-fg'>{row.region}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    cell: (row) => (
      <Badge
        variant={row.status === 'Live'
          ? 'success'
          : row.status === 'Queued'
          ? 'secondary'
          : 'muted'}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'latency',
    label: 'P95',
    align: 'end',
    cell: (row) => <span class='tabular-nums text-ns-fg'>{row.latency}</span>,
  },
  {
    key: 'updated',
    label: 'Updated',
    align: 'end',
    cell: (row) => <span class='tabular-nums text-ns-muted-fg'>{row.updated}</span>,
  },
];

function ChromeNote({ children }: { children: string }): VNode {
  return <InlineNotice title='Live on this page'>{children}</InlineNotice>;
}

function renderDemo(name: string): VNode | null {
  switch (name) {
    case 'button':
      return (
        <>
          <div class='ns-gallery-row'>
            <Button variant='primary'>Primary</Button>
            <Button variant='secondary'>Secondary</Button>
            <Button variant='outline'>Outline</Button>
            <Button variant='ghost'>Ghost</Button>
            <Button variant='destructive'>Destructive</Button>
          </div>
          <div class='ns-gallery-row'>
            <Button size='sm' variant='secondary'>Small</Button>
            <Button size='lg' variant='secondary'>Large</Button>
            <Button loading>Deploying</Button>
            <Button disabled>Disabled</Button>
            <Button type='link' href='/design/tokens' variant='outline'>Link form</Button>
          </div>
        </>
      );
    case 'icon-button':
      return (
        <div class='ns-gallery-row'>
          <IconButton icon='✓' label='Approve' variant='primary' />
          <IconButton icon='⟳' label='Retry' variant='outline' />
          <IconButton icon='✕' label='Dismiss' variant='ghost' />
          <IconButton icon='≠' label='Delete' variant='destructive' />
        </div>
      );
    case 'input':
      return (
        <div class='ns-gallery-stack'>
          <Input placeholder='Search services…' aria-label='Search services' />
          <Input value='http://hooks.example' error aria-label='Webhook URL with error' />
          <Input placeholder='Locked by org policy' disabled aria-label='Disabled input' />
        </div>
      );
    case 'textarea':
      return (
        <div class='ns-gallery-stack'>
          <Textarea
            rows={3}
            placeholder='Release notes for v2.4.1…'
            aria-label='Release notes'
          />
        </div>
      );
    case 'checkbox':
      return (
        <div class='ns-gallery-stack'>
          <Checkbox checked>Enable build cache</Checkbox>
          <Checkbox description='Applies to preview deployments only.'>
            Auto-promote previews
          </Checkbox>
          <Checkbox error>Accept the data-retention policy</Checkbox>
          <Checkbox disabled checked>Locked by org policy</Checkbox>
        </div>
      );
    case 'switch':
      return (
        <div class='ns-gallery-stack'>
          <Switch checked>Failure notifications</Switch>
          <Switch description='Denser rows in directory tables.'>Compact mode</Switch>
          <Switch disabled>Maintenance mode</Switch>
        </div>
      );
    case 'label':
      return (
        <div class='ns-gallery-stack'>
          <Label htmlFor='gallery-label-plain'>Service name</Label>
          <Label htmlFor='gallery-label-required' required>API key</Label>
        </div>
      );
    case 'select':
      return (
        <div class='ns-gallery-stack'>
          <Select
            aria-label='Deployment region'
            placeholder='Choose a region…'
            options={REGION_OPTIONS}
          />
        </div>
      );
    case 'form-field':
      return (
        <div class='ns-gallery-stack'>
          <FormField
            label='Display name'
            name='gallery-display-name'
            helpText='Shown in the workspace switcher.'
          >
            <Input
              id='gallery-display-name'
              name='gallery-display-name'
              placeholder='Acme Robotics'
            />
          </FormField>
          <FormField
            label='Webhook URL'
            name='gallery-webhook'
            required
            error='Must be an https:// URL.'
          >
            <Input id='gallery-webhook' name='gallery-webhook' value='http://hooks.example' error />
          </FormField>
        </div>
      );
    case 'card':
      return (
        <Card class='ns-gallery-surface'>
          <Card.Header>
            <div>
              <Card.Title>Build pipeline</Card.Title>
              <Card.Description>main · last run 4 minutes ago</Card.Description>
            </div>
            <Badge variant='success'>passing</Badge>
          </Card.Header>
          <Card.Body>
            <p class='text-sm leading-relaxed text-ns-muted-fg'>
              Twelve checks across lint, types, and tests. The slowest stage is the integration
              suite at 96 seconds.
            </p>
          </Card.Body>
          <Card.Footer>
            <Button size='sm' variant='outline'>View run</Button>
          </Card.Footer>
        </Card>
      );
    case 'panel':
      return (
        <div class='ns-gallery-row ns-gallery-row--start'>
          {(['default', 'muted', 'raised'] as const).map((tone) => (
            <Panel key={tone} tone={tone} class='ns-gallery-panel'>
              <Panel.Header>
                <Panel.Title>{tone}</Panel.Title>
              </Panel.Header>
              <Panel.Body>
                <p class='text-sm text-ns-muted-fg'>Dense secondary surface.</p>
              </Panel.Body>
            </Panel>
          ))}
        </div>
      );
    case 'badge':
      return (
        <div class='ns-gallery-row'>
          <Badge variant='primary'>primary</Badge>
          <Badge variant='secondary'>secondary</Badge>
          <Badge variant='success'>success</Badge>
          <Badge variant='warning'>warning</Badge>
          <Badge variant='destructive'>destructive</Badge>
          <Badge variant='muted'>muted</Badge>
        </div>
      );
    case 'separator':
      return (
        <div class='ns-gallery-stack'>
          <p class='text-sm text-ns-muted-fg'>Above the rule</p>
          <Separator />
          <div class='ns-gallery-row'>
            <span class='text-sm text-ns-muted-fg'>logs</span>
            <Separator orientation='vertical' class='ns-gallery-vsep' />
            <span class='text-sm text-ns-muted-fg'>metrics</span>
            <Separator orientation='vertical' class='ns-gallery-vsep' />
            <span class='text-sm text-ns-muted-fg'>traces</span>
          </div>
        </div>
      );
    case 'alert':
      return (
        <div class='ns-gallery-stack ns-gallery-stack--wide'>
          <Alert variant='info' title='Scheduled maintenance'>
            The eu-west region rotates certificates tonight at 02:00 UTC.
          </Alert>
          <Alert variant='success' title='Deploy complete'>
            api-gateway v2.4.1 is live in all regions.
          </Alert>
          <Alert variant='warning' title='Quota at 82%'>
            Build minutes run out in roughly six days at the current pace.
          </Alert>
          <Alert variant='destructive' title='Webhook failing'>
            The billing webhook has returned 500 for the last 40 minutes.
          </Alert>
        </div>
      );
    case 'inline-notice':
      return (
        <div class='ns-gallery-stack'>
          <InlineNotice variant='info'>
            Changes apply to new deployments only.
          </InlineNotice>
          <InlineNotice variant='warning' title='Key expires soon'>
            Rotate this credential before June 30.
          </InlineNotice>
          <InlineNotice variant='destructive'>
            This action cannot be undone.
          </InlineNotice>
        </div>
      );
    case 'spinner':
      return (
        <div class='ns-gallery-row'>
          <Spinner size='sm' />
          <Spinner size='md' />
          <Spinner size='lg' />
          <Spinner label='Loading deployments' />
        </div>
      );
    case 'progress':
      return (
        <div class='ns-gallery-stack'>
          <Progress value={64} label='Upload' />
          <Progress value={100} variant='success' label='Migration' />
          <Progress value={35} size='sm' variant='warning' label='Quota' />
          <Progress indeterminate label='Reindexing' />
        </div>
      );
    case 'skeleton':
      return (
        <div class='ns-gallery-stack ns-gallery-stack--wide'>
          <Skeleton variant='table' rows={3} columns={4} />
          <Skeleton variant='form' rows={2} />
        </div>
      );
    case 'breadcrumb':
      return (
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Services', href: '/dashboard' },
            { label: 'api-gateway' },
          ]}
        />
      );
    case 'sidebar-shell':
      return (
        <ChromeNote>
          The sidebar, topbar, breadcrumbs, and this content region are the sidebar-shell block —
          the gallery is rendered inside its own exhibit.
        </ChromeNote>
      );
    case 'page-header':
      return (
        <PageHeader>
          <PageHeader.Main>
            <PageHeader.Badges>
              <Badge variant='primary'>service</Badge>
              <Badge variant='muted'>v2.4.1</Badge>
            </PageHeader.Badges>
            <PageHeader.Intro>
              <p class='text-2xl font-semibold tracking-tight text-ns-fg'>api-gateway</p>
              <p class='text-sm leading-relaxed text-ns-muted-fg'>
                Edge routing and authentication for the public API.
              </p>
            </PageHeader.Intro>
            <PageHeader.Actions>
              <Button size='sm'>Deploy</Button>
              <Button size='sm' variant='outline'>View logs</Button>
            </PageHeader.Actions>
          </PageHeader.Main>
        </PageHeader>
      );
    case 'filter-form':
      return (
        <FilterForm method='get'>
          <FilterForm.Body class='xl:grid-cols-[minmax(0,1fr)_14rem_auto]'>
            <FormField label='Search' name='gallery-filter-q'>
              <Input id='gallery-filter-q' name='q' placeholder='Filter by service name…' />
            </FormField>
            <FormField label='Region' name='gallery-filter-region'>
              <Select
                id='gallery-filter-region'
                name='region'
                aria-label='Region filter'
                placeholder='Any region'
                options={REGION_OPTIONS}
              />
            </FormField>
            <FilterForm.Actions>
              <Button type='submit' variant='secondary'>Apply</Button>
              <Button type='reset' variant='ghost'>Clear</Button>
            </FilterForm.Actions>
          </FilterForm.Body>
        </FilterForm>
      );
    case 'stats-grid':
      return (
        <StatsGrid>
          <StatsGrid.Card
            label='Requests'
            value='1.2M'
            detail='Past 24 hours'
            badge={<Badge variant='success'>+8%</Badge>}
          />
          <StatsGrid.Card
            label='P95 latency'
            value='184ms'
            detail='All regions'
            badge={<Badge variant='warning'>watch</Badge>}
          />
        </StatsGrid>
      );
    case 'detail-layout':
      return (
        <DetailLayout>
          <DetailLayout.Main>
            <Card>
              <Card.Header>
                <Card.Title>Overview</Card.Title>
              </Card.Header>
              <Card.Body>
                <p class='text-sm leading-relaxed text-ns-muted-fg'>
                  The primary flow of a record page lives here; the rail beside it carries
                  supporting context.
                </p>
              </Card.Body>
            </Card>
          </DetailLayout.Main>
          <DetailLayout.Aside>
            <Panel tone='muted'>
              <Panel.Header>
                <Panel.Title>On-call</Panel.Title>
              </Panel.Header>
              <Panel.Body>
                <p class='text-sm text-ns-muted-fg'>platform-team, rotating weekly.</p>
              </Panel.Body>
            </Panel>
          </DetailLayout.Aside>
        </DetailLayout>
      );
    case 'data-table':
      return (
        <DataTable>
          <DataTable.Header>
            <div>
              <Card.Title>Deployments</Card.Title>
              <Card.Description>Latest first</Card.Description>
            </div>
            <Button size='sm' variant='outline'>Export</Button>
          </DataTable.Header>
          <DataTable.Body>
            {[
              { name: 'web-frontend', status: 'live', when: '2m ago' },
              { name: 'api-gateway', status: 'building', when: '11m ago' },
              { name: 'billing-worker', status: 'live', when: '1h ago' },
            ].map((row) => (
              <DataTable.Row
                key={row.name}
                class='grid-cols-[minmax(0,1fr)_auto_auto] items-center'
              >
                <span class='truncate text-sm font-medium text-ns-fg'>{row.name}</span>
                <Badge variant={row.status === 'live' ? 'success' : 'secondary'}>
                  {row.status}
                </Badge>
                <span class='text-sm tabular-nums text-ns-muted-fg'>{row.when}</span>
              </DataTable.Row>
            ))}
          </DataTable.Body>
          <DataTable.Footer>
            <span class='text-sm text-ns-muted-fg'>3 of 28 deployments</span>
          </DataTable.Footer>
        </DataTable>
      );
    case 'responsive-table':
      return (
        <ResponsiveTable
          caption='Regional service health'
          columns={RESPONSIVE_TABLE_COLUMNS}
          rows={RESPONSIVE_TABLE_ROWS}
          getRowKey={(row) => row.service}
          summary={<span>3 regions tracked · p95 latency by region</span>}
        />
      );
    case 'pagination':
      return (
        <Pagination>
          <Pagination.Meta>Showing 1–10 of 128</Pagination.Meta>
          <Pagination.Actions>
            <Button size='sm' variant='outline' disabled>Previous</Button>
            <Button size='sm' variant='outline'>Next</Button>
          </Pagination.Actions>
        </Pagination>
      );
    case 'empty-state':
      return (
        <EmptyState heading='No services yet'>
          Run <code>netscript service:add</code> to scaffold your first service.
        </EmptyState>
      );
    case 'section-divider':
      return (
        <div class='ns-gallery-stack ns-gallery-stack--wide'>
          <SectionDivider label='Configuration' />
          <SectionDivider label='Danger zone' />
        </div>
      );
    case 'theme-toggle':
      return (
        <ChromeNote>
          The sun/moon control in the topbar is this island. Flip it and every demo in the gallery
          re-renders under the other theme — no component changes hands.
        </ChromeNote>
      );
    case 'sidebar-toggle':
      return (
        <ChromeNote>
          Below the 64rem breakpoint the topbar grows a drawer toggle — that is this island driving
          the sidebar-shell's mobile state.
        </ChromeNote>
      );
    case 'toast':
      return (
        <InlineNotice variant='info' title='Redirect-flash island'>
          Mounted app-wide; it reads a flash message from the query string after a redirect and
          announces it. Pair with the toast-support helpers when building form actions.
        </InlineNotice>
      );
    case 'sheet-styles':
      return <FloatingSurfaceDemo kind='sheet' />;
    case 'floating-styles':
      return <FloatingSurfaceDemo kind='floating' />;
    case 'theme-seed':
      return (
        <div class='ns-gallery-row'>
          <Button type='link' href='/design/tokens' variant='outline'>
            Browse the {tokenManifestMeta.total}-token vocabulary
          </Button>
        </div>
      );
    default:
      return null;
  }
}

function StyleRefs({ name }: { name: string }): VNode | null {
  const refs = STYLE_REFS[name];
  if (!refs) return null;
  return (
    <p class='ns-gallery-refs'>
      seen in {refs.map((ref, index) => (
        <span key={ref}>
          {index > 0 && ', '}
          <a href={`#item-${ref}`}>{ref}</a>
        </span>
      ))}
    </p>
  );
}

function GalleryItem({ item }: { item: RegistryCatalogItem }): VNode {
  const demo = renderDemo(item.name);
  return (
    <article
      id={`item-${item.name}`}
      data-registry-item={item.name}
      data-registry-kind={item.kind}
      class='ns-gallery-item'
    >
      <header class='ns-gallery-item__head'>
        <h3 class='ns-gallery-item__name'>{item.name}</h3>
        <Badge variant={KIND_BADGES[item.kind]}>{item.kind}</Badge>
        {item.layer !== null && <Badge variant='muted'>layer {item.layer}</Badge>}
        <p class='ns-gallery-item__desc'>{item.description}</p>
        <StyleRefs name={item.name} />
      </header>
      {demo && <div class='ns-gallery-demo'>{demo}</div>}
    </article>
  );
}

export default function DesignComponentsView() {
  return (
    <main class='ns-tokens-page'>

      <header class='ns-page-header'>
        <div class='ns-cluster ns-cluster--md'>
          <h1>Components</h1>
          <Badge variant='primary'>NS One</Badge>
          <Badge variant='muted'>
            {registryMeta.name} v{registryMeta.version}
          </Badge>
        </div>
        <p class='ns-lede'>
          All {registryMeta.total} items in the {registryMeta.packageName}{' '}
          registry. Everything below renders from the app-owned copies ui:add installed, against
          whichever theme is active — switch themes in the topbar and watch the whole gallery
          follow.
        </p>
      </header>

      <div class='ns-tokens-layout'>
        <nav class='ns-tokens-rail' aria-label='Gallery sections'>
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} class='ns-tokens-rail__link'>
              {section.label}
            </a>
          ))}
        </nav>

        <div class='ns-tokens-sections'>
          {SECTIONS.map((section) => {
            const items = registryCatalog.filter((item) =>
              (section.kinds as readonly RegistryItemKind[]).includes(item.kind)
            );
            return (
              <section key={section.id} class='ns-token-section'>
                <header class='ns-token-section__head'>
                  <h2 id={section.id} class='ns-token-section__title'>
                    {section.label} <span class='ns-gallery-count'>{items.length}</span>
                  </h2>
                  <p class='ns-token-section__lede'>{section.lede}</p>
                </header>
                <div class='ns-gallery-items'>
                  {items.map((item) => <GalleryItem key={item.name} item={item} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
