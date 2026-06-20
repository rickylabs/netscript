import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  type ResponsiveTableColumn,
} from '@app/components/ui/mod.ts';

interface ExampleCard {
  readonly title: string;
  readonly href: string;
  readonly description: string;
  readonly status: string;
  readonly owner: string;
}

interface ExamplesViewProps {
  readonly examples: readonly ExampleCard[];
}

const columns: readonly ResponsiveTableColumn<ExampleCard>[] = [
  {
    key: 'title',
    label: 'Example',
    priority: 'primary',
    cell: (example) => example.title,
  },
  {
    key: 'owner',
    label: 'Owner',
    cell: (example) => example.owner,
  },
  {
    key: 'status',
    label: 'Status',
    cell: (example) => <Badge variant='secondary'>{example.status}</Badge>,
  },
  {
    key: 'action',
    label: 'Action',
    align: 'end',
    cell: (example) => (
      <Button type='link' href={example.href} variant='ghost' size='sm'>
        Open
      </Button>
    ),
  },
];

export default function ExamplesView({ examples }: ExamplesViewProps) {
  return (
    <main class='ns-shell ns-section ns-stack ns-stack--lg'>
      <PageHeader>
        <PageHeader.Main>
          <PageHeader.Badges>
            <Badge variant='primary'>Examples</Badge>
            <Badge variant='muted'>registry-only pages</Badge>
          </PageHeader.Badges>
          <PageHeader.Intro>
            <h1>Examples</h1>
            <p class='ns-lede'>
              Reference app workflows built from copied fresh-ui components. Start with CRUD, then
              replace the data seams with your contracts and services.
            </p>
          </PageHeader.Intro>
          <PageHeader.Actions>
            <Button type='link' href='/examples/crud'>Open CRUD example</Button>
          </PageHeader.Actions>
        </PageHeader.Main>
      </PageHeader>

      <Card>
        <Card.Header>
          <Card.Title>Example routes</Card.Title>
          <Card.Description>Generated workflows and integration placeholders.</Card.Description>
        </Card.Header>
        <Card.Body>
          <ResponsiveTable
            caption='Scaffold example routes'
            columns={columns}
            rows={examples}
            getRowKey={(example) => example.href}
            emptyState={
              <EmptyState heading='No examples configured'>
                Add a workflow route and include it in this table.
              </EmptyState>
            }
            summary={<span>{examples.length} examples available</span>}
          />
        </Card.Body>
      </Card>
    </main>
  );
}
