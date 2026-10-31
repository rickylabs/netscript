import type { ContractRenderFixture } from './style-provider.ts';
import { Button } from '../../registry/components/ui/button.tsx';
import { IconButton } from '../../registry/components/ui/icon-button.tsx';
import { Label } from '../../registry/components/ui/label.tsx';
import { Input } from '../../registry/components/ui/input.tsx';
import { Textarea } from '../../registry/components/ui/textarea.tsx';
import { Select } from '../../registry/components/ui/select.tsx';
import { Checkbox } from '../../registry/components/ui/checkbox.tsx';
import { Switch } from '../../registry/components/ui/switch.tsx';
import { FormField } from '../../registry/components/ui/form-field.tsx';
import { Search } from '../../registry/components/ui/search.tsx';
import { Dropzone } from '../../registry/components/ui/dropzone.tsx';
import { Avatar } from '../../registry/components/ui/avatar.tsx';
import { Badge } from '../../registry/components/ui/badge.tsx';
import { Card } from '../../registry/components/ui/card.tsx';
import { CodeBlock } from '../../registry/components/ui/code-block.tsx';
import { ChartBlock } from '../../registry/components/ui/chart-block.tsx';
import { Donut } from '../../registry/components/ui/donut.tsx';
import { Alert } from '../../registry/components/ui/alert.tsx';
import { InlineNotice } from '../../registry/components/ui/inline-notice.tsx';
import { Progress } from '../../registry/components/ui/progress.tsx';
import { Spinner } from '../../registry/components/ui/spinner.tsx';
import { Skeleton } from '../../registry/components/ui/skeleton.tsx';
import { EmptyState } from '../../registry/components/ui/empty-state.tsx';
import { Separator } from '../../registry/components/ui/separator.tsx';
import { SectionDivider } from '../../registry/components/ui/section-divider.tsx';
import { Panel } from '../../registry/components/ui/panel.tsx';
import { DetailLayout } from '../../registry/components/ui/detail-layout.tsx';
import { FilterForm } from '../../registry/components/ui/filter-form.tsx';
import { CitationChip } from '../../registry/components/ui/citation-chip.tsx';
import { ToolCallCard } from '../../registry/components/ui/tool-call-card.tsx';
import { ModelSelector } from '../../registry/components/ui/model-selector.tsx';
import { PromptInput } from '../../registry/components/ui/prompt-input.tsx';
import { Icon } from '../../src/presentation/primitives.tsx';
import ThemeToggle from '../../registry/islands/ThemeToggle.tsx';
import SidebarToggle from '../../registry/islands/SidebarToggle.tsx';
import Toast from '../../registry/islands/Toast.tsx';
import McpUiWidget from '../../registry/islands/McpUiWidget.tsx';

export const basicFixtures: readonly ContractRenderFixture[] = [
  { component: 'icon', scenario: 'glyph', render: () => <Icon name='check' /> },
  {
    component: 'button',
    scenario: 'default',
    render: () => <Button icon='★'>Action</Button>,
    parts: ['label', 'icon-start'],
    attributes: ['data-variant', 'data-size', 'data-state'],
  },
  {
    component: 'button',
    scenario: 'loading',
    parts: ['spinner'],
    render: () => <Button loading>Action</Button>,
    attributes: ['data-state'],
  },
  {
    component: 'button',
    scenario: 'trailing link',
    render: () => <Button type='link' href='/example' icon='→' iconPosition='right'>Visit</Button>,
    parts: ['icon-end'],
  },
  {
    component: 'icon-button',
    scenario: 'glyph',
    render: () => <IconButton label='Action' icon='★' />,
    parts: ['glyph'],
    attributes: ['data-variant', 'data-size', 'data-state'],
  },
  {
    component: 'theme-toggle',
    scenario: 'default',
    render: () => <ThemeToggle />,
    attributes: ['data-state'],
  },
  { component: 'sidebar-toggle', scenario: 'default', render: () => <SidebarToggle /> },
  {
    component: 'label',
    scenario: 'required',
    render: () => <Label required>Name</Label>,
    parts: ['text'],
    attributes: ['data-variant', 'data-state'],
  },
  {
    component: 'input',
    scenario: 'invalid',
    render: () => <Input error value='Ada' />,
    attributes: ['data-size', 'data-state', 'data-content'],
  },
  {
    component: 'textarea',
    scenario: 'disabled',
    render: () => <Textarea disabled value='Text' />,
    attributes: ['data-state'],
  },
  {
    component: 'select',
    scenario: 'options',
    render: () => <Select options={[{ value: 'one', label: 'One' }]} />,
    attributes: ['data-size', 'data-state', 'data-content'],
  },
  {
    component: 'checkbox',
    scenario: 'checked',
    render: () => <Checkbox checked description='Description'>Choice</Checkbox>,
    parts: ['control', 'indicator', 'body', 'label', 'description'],
    attributes: ['data-state', 'data-checked'],
  },
  {
    component: 'switch',
    scenario: 'checked',
    render: () => <Switch checked description='Description'>Choice</Switch>,
    parts: ['control', 'track', 'thumb', 'body', 'label', 'description'],
    attributes: ['data-state', 'data-checked'],
  },
  {
    component: 'field',
    scenario: 'error',
    render: () => (
      <FormField label='Name' name='name' helpText='Hint' error='Required'>
        <Input />
      </FormField>
    ),
    parts: ['label', 'error'],
    attributes: ['data-orientation', 'data-variant', 'data-state'],
  },
  {
    component: 'search',
    scenario: 'shortcut',
    render: () => <Search />,
    parts: ['icon', 'label', 'kbd'],
  },
  {
    component: 'dropzone',
    scenario: 'picker',
    render: () => (
      <Dropzone hint='PDF'>
        <input type='file' />
      </Dropzone>
    ),
  },
  {
    component: 'avatar',
    scenario: 'initials',
    render: () => <Avatar name='Ada' presence='online' />,
    parts: ['initials', 'presence'],
    attributes: ['data-size', 'data-content', 'data-status'],
  },
  {
    component: 'avatar',
    scenario: 'image',
    render: () => <Avatar name='Ada' src='/avatar.png' />,
    parts: ['image'],
  },
  {
    component: 'avatar',
    scenario: 'agent',
    render: () => <Avatar name='Agent' agent />,
    parts: ['agent-icon'],
  },
  {
    component: 'badge',
    scenario: 'info',
    render: () => <Badge variant='info'>Shipped</Badge>,
    parts: ['label'],
    attributes: ['data-variant', 'data-emphasis'],
  },
  {
    component: 'badge',
    scenario: 'status',
    render: () => <Badge variant='success'>Ready</Badge>,
    parts: ['label'],
    attributes: ['data-variant', 'data-emphasis'],
  },
  {
    component: 'card',
    scenario: 'sections',
    render: () => (
      <Card interactive>
        <Card.Header>
          <Card.Title>Title</Card.Title>
          <Card.Description>Description</Card.Description>
        </Card.Header>
        <Card.Body>Body</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    ),
    parts: ['header', 'title', 'description', 'body', 'footer'],
    attributes: ['data-variant', 'data-size', 'data-state'],
  },
  {
    component: 'code-block',
    scenario: 'code',
    render: () => <CodeBlock code='const answer = 42;' filename='example.ts' lang='ts' />,
    parts: ['content', 'code'],
  },
  {
    component: 'chart-block',
    scenario: 'bar',
    render: () => <ChartBlock title='Chart' data={[{ label: 'One', value: 42 }]} />,
  },
  {
    component: 'donut',
    scenario: 'segments',
    render: () => <Donut data={[{ label: 'One', value: 42 }, { label: 'Two', value: 58 }]} />,
  },
  {
    component: 'alert',
    scenario: 'notice',
    render: () => <Alert title='Notice'>Description</Alert>,
    parts: ['icon', 'body', 'title', 'description'],
    attributes: ['data-variant'],
  },
  {
    component: 'inline-notice',
    scenario: 'notice',
    render: () => <InlineNotice title='Notice'>Description</InlineNotice>,
    parts: ['icon', 'body', 'title', 'description'],
    attributes: ['data-variant'],
  },
  {
    component: 'toast',
    scenario: 'message',
    render: () => <Toast message='Saved' title='Notice' type='success' />,
    parts: ['panel', 'title', 'message', 'dismiss'],
    attributes: ['data-type', 'data-state'],
  },
  {
    component: 'progress',
    scenario: 'determinate',
    render: () => <Progress value={42} label='Progress' />,
    parts: ['track', 'bar'],
    attributes: ['data-variant', 'data-size', 'data-state'],
  },
  {
    component: 'spinner',
    scenario: 'loading',
    render: () => <Spinner label='Loading' />,
    attributes: ['data-size'],
  },
  ...(['table', 'stats', 'detail', 'form'] as const).map((variant) => ({
    component: 'skeleton',
    scenario: variant,
    render: () => <Skeleton variant={variant} rows={1} cards={1} columns={2} />,
    attributes: ['data-variant'],
  })),
  {
    component: 'empty-state',
    scenario: 'content',
    render: () => <EmptyState heading='No records'>Add a record</EmptyState>,
    parts: ['heading', 'content'],
  },
  {
    component: 'detail-layout',
    scenario: 'columns',
    render: () => (
      <DetailLayout>
        <DetailLayout.Main>Main</DetailLayout.Main>
        <DetailLayout.Aside>Aside</DetailLayout.Aside>
      </DetailLayout>
    ),
    parts: ['main', 'aside'],
  },
  {
    component: 'filter-form',
    scenario: 'form',
    render: () => (
      <FilterForm>
        <FilterForm.Body>Filters</FilterForm.Body>
        <FilterForm.Actions>Apply</FilterForm.Actions>
      </FilterForm>
    ),
    parts: ['body', 'actions'],
  },
  {
    component: 'panel',
    scenario: 'sections',
    render: () => (
      <Panel tone='raised'>
        <Panel.Header>
          <Panel.Title>Title</Panel.Title>
          <Panel.Description>Description</Panel.Description>
        </Panel.Header>
        <Panel.Body>Body</Panel.Body>
        <Panel.Footer>Footer</Panel.Footer>
      </Panel>
    ),
    parts: ['header', 'title', 'description', 'body', 'footer'],
    attributes: ['data-variant'],
  },
  {
    component: 'separator',
    scenario: 'vertical',
    render: () => <Separator orientation='vertical' />,
    attributes: ['data-orientation'],
  },
  {
    component: 'section-divider',
    scenario: 'label',
    render: () => <SectionDivider label='Section' />,
    parts: ['label', 'line'],
  },
  {
    component: 'citation-chip',
    scenario: 'active',
    render: () => <CitationChip index={1} active source='Source' />,
    parts: ['index'],
    attributes: ['data-state'],
  },
  {
    component: 'tool-call-card',
    scenario: 'result',
    render: () => <ToolCallCard name='lookup' status='done' args='{}' result='Ready' defaultOpen />,
    attributes: ['data-status'],
  },
  {
    component: 'model-selector',
    parts: ['btn', 'label', 'menu', 'opt'],
    scenario: 'choices',
    render: () => (
      <ModelSelector
        models={[{ id: 'one', label: 'One', provider: 'Provider', desc: 'Description' }]}
        value='one'
      />
    ),
    attributes: ['data-align'],
  },
  {
    component: 'prompt-input',
    scenario: 'composer',
    render: () => <PromptInput placeholder='Message' />,
  },
  {
    component: 'mcp-ui-widget',
    scenario: 'sandbox',
    render: () => <McpUiWidget src='https://widget.example.test/widget' theme='utility' />,
  },
];
