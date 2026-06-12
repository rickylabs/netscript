import { Popover, Sheet, Tooltip } from '@netscript/fresh-ui/interactive';
import { Badge, Button, InlineNotice, Panel } from '@app/components/ui/mod.ts';

type FloatingSurfaceDemoProps = {
  kind: 'sheet' | 'floating';
};

export function FloatingSurfaceDemo({ kind }: FloatingSurfaceDemoProps) {
  if (kind === 'sheet') {
    return (
      <div class='ns-floating-demo'>
        <Sheet.Root side='right'>
          <Sheet.Trigger class='ns-btn ns-btn--secondary'>Open right sheet</Sheet.Trigger>
          <Sheet.Content>
            <div class='ns-sheet__header'>
              <div>
                <Sheet.Title class='text-base font-semibold text-ns-fg'>
                  Deployment inspector
                </Sheet.Title>
                <Sheet.Description class='mt-1 text-sm text-ns-muted-fg'>
                  Side-docked panel styled by the sheet-styles registry item.
                </Sheet.Description>
              </div>
              <Sheet.Close class='ns-btn ns-btn--ghost ns-btn--sm'>Close</Sheet.Close>
            </div>
            <div class='ns-sheet__body'>
              <div class='ns-gallery-stack'>
                <Panel tone='muted'>
                  <Panel.Header>
                    <Panel.Title>api-gateway</Panel.Title>
                    <Panel.Description>v2.4.1 promoted to production</Panel.Description>
                  </Panel.Header>
                  <Panel.Body>
                    <div class='ns-gallery-row'>
                      <Badge variant='success'>healthy</Badge>
                      <Badge variant='muted'>12 checks</Badge>
                    </div>
                  </Panel.Body>
                </Panel>
                <InlineNotice variant='info'>
                  The panel uses the platform dialog element, sticky sheet sections, and
                  reduced-motion-aware enter timing from the copied CSS.
                </InlineNotice>
              </div>
            </div>
            <div class='ns-sheet__footer'>
              <Sheet.Close class='ns-btn ns-btn--primary ns-btn--sm'>Acknowledge</Sheet.Close>
              <Sheet.Close class='ns-btn ns-btn--outline ns-btn--sm'>Dismiss</Sheet.Close>
            </div>
          </Sheet.Content>
        </Sheet.Root>

        <Sheet.Root side='bottom'>
          <Sheet.Trigger class='ns-btn ns-btn--outline'>Open bottom sheet</Sheet.Trigger>
          <Sheet.Content>
            <div class='ns-sheet__header'>
              <div>
                <Sheet.Title class='text-base font-semibold text-ns-fg'>
                  Mobile action tray
                </Sheet.Title>
                <Sheet.Description class='mt-1 text-sm text-ns-muted-fg'>
                  Bottom-side placement shares the same dialog contract.
                </Sheet.Description>
              </div>
            </div>
            <div class='ns-sheet__body'>
              <p class='text-sm leading-relaxed text-ns-muted-fg'>
                Compact screens can promote the same content into a bottom sheet without changing
                the runtime API.
              </p>
            </div>
            <div class='ns-sheet__footer'>
              <Sheet.Close class='ns-btn ns-btn--secondary ns-btn--sm'>Close tray</Sheet.Close>
            </div>
          </Sheet.Content>
        </Sheet.Root>
      </div>
    );
  }

  return (
    <div class='ns-floating-demo'>
      <Popover.Root placement='bottom-start'>
        <Popover.Trigger class='ns-btn ns-btn--secondary'>Open popover</Popover.Trigger>
        <Popover.Content class='ns-floating-card'>
          <Popover.Title class='ns-floating-card__title'>Region capacity</Popover.Title>
          <Popover.Description class='ns-floating-card__body'>
            eu-west has headroom for two more canary services before autoscale raises the floor.
          </Popover.Description>
          <div class='ns-gallery-row'>
            <Badge variant='warning'>82%</Badge>
            <Popover.Close class='ns-btn ns-btn--ghost ns-btn--sm'>Close</Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Root>

      <Tooltip.Root placement='top' openDelay={0} closeDelay={80}>
        <Tooltip.Trigger class='ns-btn ns-btn--outline'>Hover or focus</Tooltip.Trigger>
        <Tooltip.Content class='ns-floating-tooltip'>
          CSS anchor positioning when available, fixed fallback otherwise.
        </Tooltip.Content>
      </Tooltip.Root>

      <Button type='link' href='/design/composition' variant='ghost'>
        Composition rules
      </Button>
    </div>
  );
}
