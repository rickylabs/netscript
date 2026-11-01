# Docs11b2 design checkpoint — RuledGrid and Hero

Previous Docs11b1 is terminal atf1889578; source/evidence PASS and PR2538
comment6554461892 reconciled. Same independent evaluator, failure streak1 after design round1 FAIL_PLAN.
This checkpoint precedes product code. Full11b3/12/13 still mandatory; no READY.

1. **Public surface.** Add copied RuledGrid and Hero registry UI items, TSX/CSS
   only; catalog reaches104of104 shipped only after actual render/keyboard/
   installed-copy/browser proof. RuledGrid({columns='3',variant='ruled',children})
   owns data-columns2|3|4 and data-variant ruled|feature. RuledGrid.Cell is private
   Docs-card anatomy, not a second public component identity or base Card import:
   native div cell/card frames with optional eyebrow/icon/title/description
   (children)/action slots, decorative aria-hidden arrow. Cell title/action may
   contain caller-native links/buttons; card frame itself has no link role,
   click handler or tabindex. Whole-card navigation is not implied; it avoids
   nested interactive anchors and preserves supplied control behavior. Title
   is a styled div, caller may supply a correctly ranked native heading/link.
   Root and Cell accept native div attributes/class; owned scope/part/axes win
   after spread, Cell owns no public root axes and strips illicit ones.

   Hero({layout='split',breakpoint?,eyebrow,title,headingLevel='1',children,actions,
   aside,paths}) is a native section. Required title is a slot in an h1 by
   default; headingLevel'1'..'6' lets caller choose document outline without changing
   typography. children is lede slot, actions wraps caller-native controls.
   Optional aside and paths render one aside, with path-stack only when paths
   is supplied; paths stays IN aside, not display. Aside-only/paths-only/empty
   all covered. Caller supplies real CodeBlock/Figure/FilePathChip; no L2import.
   Explicit breakpoint desktop|mobile forces a reference render, omitted uses
   named CSS container queries at767px with useful SSR and no hydration or duplicate DOM. No
   data-breakpoint on automatic root; no invented third public enum. data-layout
   always reflects layout. Mobile title uses existing title tokens, desktop
   display tokens; centered desktop stacks aside below centered display;
   mobile remains single column with start-aligned copy as ledger render.
   Native attributes/class and owned scope/part/layout/breakpoint precedence.

2. **Vocabulary.** Cell is the ledger private Docs card. Ruled means contiguous
   cell right/bottom rules plus structural top rule; feature means separate
   card top hairlines with32gap. Hero display contains eyebrow/title/lede/
   actions, aside contains caller content then optional path-stack. Responsive
   presentation is CSS-only and no component owns business state/navigation.

3. **Ports.** Native HTML/Preact ComponentChildren+JSX props and existing cn only.
   No hook/observer, backend, new dependency, L2 import or native bridge. Registry
   installs source+CSS through existing canonical tools/collections/source-style
   map. Caller owns child callbacks, alt text, title rank and file-copy behavior.

4. **Constants.** Existing semantic theme roles only: fg/muted-fg/bg/hero-bg/
   hero-pad/font-sans/font-heading/font-mono/text-display/title/leading/tracking/
   weight and border/topbar/card/ring. Check roles resolve in every engine;
   optional prose roles use existing same-theme body fallback. Geometry literals
   are ledger values, not new tokens: ruled24padding, feature20/0, gap32, icon
   tile28x22, eyebrow14/body10/action20; hero1120=680+80+360, eyebrow24/title30/
   lede36/actions12, aside12/32, mobile20padding. Responsive2/3/4columns collapse
   to1 below768, remove inline-end borders without double rules in both LTR/RTL;
   exact container bands are locked below. No token values changed (#2450 owns them), no cache/lock churn.

5. **Commit slices/files/gates.** 11b2 introduces only these2identities and
   complete actual-source tests. Expected26 source/carrier paths:4newTSX/CSS;
   docs-kit/4.ts+contracts.json; registry.json+2native/legacy projections+2CLI
   assets; README; catalog count/styles/provider assembly and2newSSRfixture/test
   files; installedconsumer/post-v1;1newbrowserfixture+1spec andexistingrouter,
   server/SSRbuild. Keep fewer30. Four carriers canonically generated after
   sourcecommit, actualdelta inspected; committedHEADquality/nativepub andSAME
   evidence review before audited exactleasepush/PRcomment/reconcile.

   Before source review: strict real contract renders all6grid variants/all4
   forcedHero views/defaultresponsive/empty/slots/ownedattrs, fullpackage,
   actual ui:add source+CSS fidelity compile/lint/SSR, source/browser wrappers
   0dropped and template lint. Actual browser native Tab/ShiftTab/Enter/Space
   on supplied controls, noframe tabstops; grid1/2/3/4 geometry/nooverflow/
   right-bottom/top borders/logicalRTL/longwrap and featurehover; Hero split/
   centered/forcedresponsive/empty/asidepaths andtypography/allusedrolesresolve,
   calleractual Button/CodeBlock/FilePathChip/Figure composition, noJS SSRnative
   navigation. Both schemes390/1280, focusedFFWK+fullChromium, strictaxe/errors0,
   Utility captures compared to actual ledgerPNG (both inspected). Dedicated
   docs build/browser140; quality/preflight/docsaccuracy/exports/nativepub0slow/
   exactexisting2531doclint attribution. No newwaiver or fake passing evidence.

6. **Deferred scope.** Actual six Desktop audit is complete next11b3unit with
   owncheckpoint/review, no native-host success claim (#859). Productiondeclaredx/
   allstyle harness12, fullruntime/finalindependentIMPL/exactrequiredCI13 remain
   mandatory. Nineteen promotions onlyAFTERUtilitycanary. Runtime/body-as-scroller
   limitations stay explicit; README navigation note may be added in this docs
   unit but no behavior change or oldproof relabeling. NoREADY or finalreport.

7. **Contributor path.** packages/fresh-ui/README.md documents native composition,
   imports/CSS, slots/headingrank/automatic vsforcedbreakpoint, gridcell controls
   and how to extend via canonical registry/contracts without L2imports. Source
   of truth is ledger-desktop-docs (wins over research component-spec) and its
   review-ruled-grid/review-hero PNGs, existing docs/site CSS for geometry only.

## Required round1 corrections — binding before implementation

These are explicit additions/normalizations of UNSHIPPED placeholders X8/X9.
No settled columns2|3|4, variant ruled|feature, layout split|centered or forced
breakpoint desktop|mobile enum is changed. Both remain unshipped until proof.

### Content-width responsive contract

Each component root is an inline-size named CSS container (ns-ruled-grid or
ns-hero). One independently declared inner part is necessary so queries can
style layout based on the component's own width: RuledGrid `grid`, Hero `layout`.
Root never queries/styles itself from its own container. No JS or parent CSS
contract is needed; no duplicate markup. Root min-inline-size0/width100%, inner
width100%/box-sizing:border-box and minmax(0,...) keep long content from forcing
its parent wide. Literal widths are maxima, never fixed minimums.

- **RuledGrid** automatic container width C: C<=767 yields1column for all values;
  768<=C<=1100 yields2columns for all values; C>=1101 yields declared2/3/4columns.
  Inner grid width100%, no arbitrary fixed960 requirement (960 ledger reference
  remains a reference; its normal medium mode uses2, and forced grid axes are
  requests up to available capacity). Ruled gap0, grid top rule1via topbar role;
  eachcell one bottom1subtle rule and one inline-end1subtle except every Nth
  cell (actual band N). Every band first RESETS every cell inline-end to1 then
  removes Nth, so transitions cannot retain stale2/3/4rules. Last row retains
  its single cell bottomrule, with NOextra grid bottom border. Partial lastrow
  retains inline-end boundaries unless it ends at Nth column. Feature has
  gap32/cardtop1 only, no structural gridtop/cellbottom/cellinline borders.
  Logical inline-end handlesRTL; rowsautoheight and descendantsmin-width0+
  overflow-wrap:anywhere keep longtext inside. No tablet 'maybe' remains.
- **Hero automatic** C<=767:1column,gap32,padding-inline20,title existing48/52
  title role; display/aside minwidth0,copy startaligned regardless layout.
  768<=C<=1100 split:minmax(0,1.5fr) minmax(0,1fr),gap40,inlinepadding0,title
  display64/68roles. C>=1101 split:minmax(0,17fr) minmax(0,9fr),gap80,layout
  max-width1120 and margin-inline:auto. At1120 these give680/360 exactly; at
  1101 tracks shrink, no fixed-min overflow. Centereddesktop uses1column and
  centereddisplay/aside, same gap byband; displaymax680,ledemeasure620,aside
  max520. Aside follows display inDOM at everywidth. Forcedmobile usesmobile
  policy regardlesswidth; forceddesktop useswidefluidtwo-columnsplit orone
  centered regardlesswidth,documentedreference,64/68title. Forced modes bypass
  automaticcontaineroverrides; theirtracksstillmin0 andtitlewrapanywhere.

Browser evidence MUST cover C=767,768,1100,1101,1120 (all columnrequests, both
variants/layouts/LTRRTL), using caller wrappers to set actualcomponentwidth,
plus390/1280 viewport andrealSidebarShell docswithrail at1280 (actual narrow
contentC). Assert actual C/band/columncount/gap/alignment, shared boundaries,
no added/missing/double rules, longtextwrap and0overflow. Hero forced modes
are testedseparately. Queryconditions inclusive exactly as bands above.

### Exact canonical catalog delta

- RuledGrid root props: columns enumstring2|3|4 default3; variant enumruled|feature
  defaultruled; children slot. Qualified Cell props: Cell.eyebrow, Cell.icon,
  Cell.title, Cell.children, Cell.action all optional slot. Native id/class/ARIA
  remainstandardHTMLpassthrough, notnewstyleaxes. Parts: root,grid always;cell
  andcard whenCellsupplied;eyebrow/icon/title/description/action when corresponding
  Cellslot supplied;arrow wheneverCellsupplied (puredecoration). Cell ownsNONE
  ofdata-columns/data-variant (stripboth afterspread). Rootaxespartsrootonly.
  Slots: children→cell;Cell.eyebrow→eyebrow;Cell.icon→icon;Cell.title→title;
  Cell.children→description;Cell.action→action. All planned:true markersremoved
  onlyuponactualshipping. Nativechildkeyboard contractadded Tab/ShiftTab visit
  supplied controls,Enter/Space retainnativebehavior,frameaddsnostop. This is
  normalization ofplaceholder noninteractivepresentation intoexplicitnativechild
  composition, notnewkeymanager.
- Hero headingLevel is enum STRING '1'|'2'|'3'|'4'|'5'|'6', default'1'. It affects
  h1..h6 rank ONLY, neverstylerole. title remainsrequiredslot, allothersoptional.
  paths newslot→path-stack;path-stack whenpaths supplied. aside part whenaside
  ORpaths supplied;display/root/layout always;eyebrow/title/lede/actions when
  corresponding content supplied (titlealwaysforvalidinput). data-layout
  partsrootdefaultsplit;data-breakpoint partsroot onlywhenforced, no default
  value and absentautomatic. Existing parts andnamespreserved, newlayoutpart
  explicitlydeclared. Breakpointpropdescription documents CSS-onlyautomatic
  omission. Requiredslots/props andwhen clauses match actualrenderfixtures,
  emptyrootpolicies andinstalledconsumerJSON, notonlytypedAPI.

Source/carrier budget remains under30; these two inner wrappers are functional
container-query targets, not ornamental folders/nodes. READMEdocumentsbandtable.
Same second design review must PASS or endleaf/escalate, no thirdattempt.

## Round2 PASS binding fractional-width condition

Use complementary range syntax width<=767,767<width<=1100,width>1100.
Fractional767.5 and1100.5 geometry cases run for bothcomponents/LTRRTL with
expectedbands derived from independent native queryreference, notactualdisplay.
All othercheckpointbandsdenote integerexamplesoftheseexactcontinuousranges.
