import type { PropDoc } from './catalog.ts';

/** Rich examples are JSX expressions; C is replaced by the actual registry export at build time. */
const RICH_EXAMPLES: Readonly<Record<string, string>> = {
  'alert-dialog':
    '<C triggerLabel="Review deletion" title="Delete order?" description="This action cannot be undone." actionLabel="Delete order" onAction={()=>report("Order deleted")} />',
  'button-group': '<C><Button>Save</Button><Button variant="outline">Cancel</Button></C>',
  'radio-group':
    '<C name="shipping" legend="Shipping method" options={[{value:"standard",label:"Standard"},{value:"express",label:"Express"}]} />',
  'input-group':
    '<C addon="Order" control={<Input aria-label="Order reference" placeholder="SO–10480" />} />',
  'input-otp': '<C label="Verification code" />',
  'slider': '<C label="Discount" />',
  'calendar': '<C aria-label="Delivery date" defaultMonth="2026-11-01" />',
  'date-picker': '<C label="Delivery date" defaultMonth="2026-11-01" />',
  'location-marker': '<span>Current section <C /></span>',
  'navigation-menu':
    '<C label="Order navigation" items={[{id:"orders",label:"Orders",href:"#orders"}]} />',
  'stepper':
    '<C steps={[{id:"details",title:"Order details",status:"current"},{id:"confirm",title:"Confirm order",status:"upcoming"}]} />',
  'menubar':
    '<C label="Order actions" menus={[{id:"file",label:"File",items:[{id:"save",label:"Save order",onSelect:()=>report("Saved")}]}]} />',
  'hover-card':
    '<C triggerLabel="Maya Rossi" title="Maya Rossi" description="Customer since 2024" />',
  'context-menu':
    '<C label="Order actions" items={[{id:"save",label:"Save order",onSelect:()=>report("Saved")}]}><Button variant="outline">Order actions</Button></C>',
  'item': '<C title="Order SO–10480">Ready for fulfillment</C>',
  'kbd': '<C>Ctrl+K</C>',
  'collapsible': '<C label="Order details">Ready for fulfillment</C>',
  'chart':
    '<C title="Orders by week" series={[{label:"Orders"}]} data={[{label:"Week 1",values:[32]},{label:"Week 2",values:[48]}]} />',
  'carousel':
    '<C label="Order attachments" slides={[{label:"Invoice",content:<p>Invoice</p>},{label:"Packing slip",content:<p>Packing slip</p>}]} />',
  'toggle': '<C aria-label="Pin order">Pin order</C>',
  'toggle-group':
    '<C label="Order view" items={[{value:"list",label:"List"},{value:"grid",label:"Grid"}]} />',

  button:
    '<div class="demo-row"><C onClick={() => report("Changes saved")}>Save changes</C><C variant="outline">Cancel</C><C disabled>Disabled</C></div>',
  'icon-button': '<C icon="+" label="Create order" onClick={() => report("Order created")} />',
  input: '<C aria-label="Customer email" placeholder="maya@example.com" />',
  textarea: '<C aria-label="Internal note" placeholder="Visible to your team" rows={3} />',
  checkbox: '<C description="Includes a tracking link">Email the customer</C>',
  switch: '<C description="Priority orders appear first">Mark as priority</C>',
  label: '<div><C htmlFor="demo-label">Order name</C><input id="demo-label" /></div>',
  select:
    '<C aria-label="Shipping method" options={[{value:"standard",label:"Standard · 3–5 business days"},{value:"express",label:"Express · 1–2 business days"}]} />',
  'form-field':
    '<C name="email" label="Customer email" helpText="We will send tracking updates"><Input id="email" name="email" type="email" /></C>',
  card:
    '<C><C.Header><C.Title>Order SO–10480</C.Title><C.Description>Review fulfillment details</C.Description></C.Header><C.Body><Input aria-label="Tracking number" placeholder="Tracking number" /></C.Body><C.Footer><Button onClick={() => report("Order saved")}>Save changes</Button></C.Footer></C>',
  panel:
    '<C><C.Header><C.Title>Recent activity</C.Title></C.Header><C.Body>Your order has shipped.</C.Body></C>',
  badge:
    '<div class="demo-row"><C variant="success">Paid</C><C variant="warning">Awaiting payment</C><C variant="muted">Refunded</C></div>',
  avatar: '<C name="Maya Rossi" />',
  'citation-chip':
    '<C index={1} source="Order policy" onClick={()=>report("Order policy selected")} />',
  'code-block':
    '<C code={"const order = await orders.get(id);"} lang="typescript" filename="order.ts" />',
  'model-selector':
    '<C value={value} models={[{id:"standard",label:"Standard"},{id:"fast",label:"Fast"}]} onChange={setValue} />',
  'tool-call-card':
    '<C name="orders.lookup" status="done" args={JSON.stringify({id:"SO–10480"})} result="Order shipped" />',
  'chart-block':
    '<C title="Orders by channel" data={[{label:"Online",value:72},{label:"Wholesale",value:28}]} />',
  donut: '<C data={[{label:"Fulfilled",value:88},{label:"Pending",value:12}]} />',
  'prompt-input': '<C placeholder="Ask about an order…" onSubmit={(text) => report(text)} />',
  message:
    '<C message={{role:"assistant",author:{name:"Order assistant"},body:"Your order **SO–10480** has shipped."}} />',
  markdown: '<C>{"## Order updates\\n\\nYour order is **on its way**."}</C>',
  'command-palette':
    '<div><Button onClick={() => setOpen(true)}>Open commands</Button><C open={open} onOpenChange={setOpen} groups={[{id:"orders",label:"Orders",items:[{id:"create",label:"Create order",onSelect:()=>report("Order created")}]}]} /></div>',
  search:
    '<C aria-label="Search orders" placeholder="Search orders…" onOpen={()=>report("Search opened")} />',
  dropzone: '<C onFiles={(files) => report(`${files.length} files selected`)} />',
  separator: '<div>Order details<C />Fulfillment</div>',
  alert: '<C variant="warning" title="Awaiting payment">Three orders need your attention.</C>',
  'inline-notice': '<C title="Saved">Changes apply to this order.</C>',
  spinner: '<C label="Loading orders" />',
  progress: '<C value={64} label="Upload progress" />',
  skeleton: '<C variant="table" rows={3} columns={3} />',
  breadcrumb: '<C items={[{label:"Commerce",href:"#"},{label:"Orders"}]} />',
  'sidebar-shell':
    '<C brand="Northwind" pathname="/orders" navigation={[{items:[{label:"Orders",href:"/orders"}]}]}>Order workspace</C>',
  'page-header':
    '<C><C.Main><C.Intro><h2>Orders</h2><p>Fulfillment across every channel.</p></C.Intro></C.Main><C.Actions><Button>Create order</Button></C.Actions></C>',
  'filter-form':
    '<C><C.Body><Input aria-label="Filter orders" placeholder="Order or customer" /></C.Body><C.Actions><Button type="submit">Filter</Button></C.Actions></C>',
  'stats-grid':
    '<C><C.Card label="Orders" value="3,182" detail="Past 30 days" /><C.Card label="Refund rate" value="1.8%" /></C>',
  'detail-layout':
    '<C><C.Main><h2>Order details</h2><Input aria-label="Order name" /></C.Main><C.Aside>Recent activity</C.Aside></C>',
  'data-table':
    '<C><C.Header>Orders</C.Header><C.Body><C.Row cols="2fr 1fr"><span>SO–10480 · Aiko Tanaka</span><Badge variant="success">Paid</Badge></C.Row></C.Body><C.Footer>1 order</C.Footer></C>',
  'responsive-table':
    '<C caption="Orders" rows={[{id:"SO–10480",customer:"Aiko Tanaka"}]} getRowKey={(row)=>row.id} columns={[{key:"id",label:"Order",priority:"primary",cell:(row)=>row.id},{key:"customer",label:"Customer",cell:(row)=>row.customer}]} />',
  pagination:
    '<C><C.Meta>Showing 1–6 of 3,182 orders</C.Meta><C.Actions><Button variant="outline" onClick={()=>report("Previous page")}>Previous</Button><Button variant="outline" onClick={()=>report("Next page")}>Next</Button></C.Actions></C>',
  'empty-state': '<C heading="No orders yet">Create your first order to get started.</C>',
  'section-divider': '<C label="Fulfillment" />',
  'theme-toggle': '<C />',
  'sidebar-toggle':
    '<div><C /><aside data-sidebar>Orders navigation</aside><div data-sidebar-backdrop /></div>',
  toast:
    '<div><Button onClick={()=>report("Order saved")}>Show toast</Button><C message={notice} type="success" duration={60000} /></div>',
  'desktop-tray-menu':
    '<C source="tray" disabled items={[{type:"action",id:"open",label:"Open orders"}]} />',
  'desktop-dialog': '<C disabled message="Delete this order?" />',
  'desktop-notification':
    '<C disabled notification={{title:"Order shipped",body:"SO–10480 is on its way"}} />',
  'desktop-window-chrome': '<C disabled title="Northwind orders" />',
  'desktop-update-prompt':
    '<C event={{applyMode:"manual",version:"1.2.0",manualUpdateUrl:"https://example.com/download"}} />',
  'desktop-only':
    '<C fallback={<p>Desktop binding unavailable in this browser.</p>}>Desktop content</C>',
  'mcp-ui-widget': '<C src="./widget/" theme="studio-utility" title="Host-provided MCP widget" />',
};

/** New simple registry entries automatically get a real minimal component example. */
export function componentExample(name: string, symbol: string, props: readonly PropDoc[]): string {
  const rich = RICH_EXAMPLES[name];
  if (rich) return rich.replace(/\bC\b/g, symbol);
  const attributes = new Map<string, string>();
  for (const prop of props.filter((p) => !p.optional && !p.name.startsWith('data-'))) {
    if (prop.name === 'children') continue;
    let value: string;
    if (prop.type === 'string') value = JSON.stringify(prop.name);
    else if (prop.type === 'number') value = '{1}';
    else if (prop.type === 'boolean') value = '{true}';
    else if (prop.type.startsWith('"')) value = prop.type.split(' | ')[0];
    else if (prop.type.includes('=>')) value = '{() => {}}';
    else if (prop.type.endsWith('[]')) value = '{[]}';
    else throw new Error(`Add a rich preview for ${name}: required ${prop.name}: ${prop.type}`);
    attributes.set(prop.name, `${prop.name}=${value}`);
  }
  return `<${symbol} ${[...attributes.values()].join(' ')}>${name}</${symbol}>`;
}
