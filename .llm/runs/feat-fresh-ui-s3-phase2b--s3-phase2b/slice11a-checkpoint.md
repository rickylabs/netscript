# Docs11a design checkpoint — path/attribute chips, file tree and figure

## 1. Public surface

Ship X2/X3/X5/X6 as four independent copied registry components, inventory104/96/8
to104/100/4. Four TSX/CSS items, real style/collection registration, actual ui:add
fidelity/compile/lint/SSR, strict render and native keyboard/browser tests. No
L2-to-L2 import, token value, dependency version or lock change. The sole L0
addition is the missing folder glyph: use Lucide's verified primary folder.svg
path, retain/update its existing ISC/Feather notice, extend canonical Z1 name
metadata and exercise the public Icon through this unit's fixture provider.
No duplicate private SVG or fake folder-as-file glyph. Existing runtime mapping
is used for Icon consumers; copied static AttributeChip/Figure need no runtime
package import. Primary glyph source is icons/folder.svg in lucide-icons/lucide;
the verified blob is ef69b345f200f1542ad9a2dfca7d41d036910f4b.

FilePathChip is native inline span/code plus optional native copy button.
Props: path:string required, copy:boolean(defaulttrue), copyLabel(default
"Copy path"), copiedLabel(default "Path copied"), errorLabel(default
"Could not copy path"), native span attributes/class. path is escaped text, not
a render slot, and the exact original string is passed to clipboard.writeText.
No writable state prop: data-state derives rest|copied and native hover/focus CSS
expresses the corresponding design states. The optional copy control preserves
focus and remains enabled during requests. An always-mounted visually hidden
polite status part reports actual success/error; no false Copied on rejection,
no execCommand fallback or fabricated success. Missing clipboard access is an
error. Repeated attempts and path/copy changes invalidate older completion
results with a local request epoch; unmount guards invalidate all pending work.
UI results can only describe the currently mounted path/latest request, never a
stale path. No claim to cancel an OS clipboard operation already issued. Copied
state persists until the next attempt or a path/copy change, with no timer.
copy=false removes the button; root/path content add no tab stop.
Ledger overrides: padding2/5, height26, gap6, copy target20 square/glyph14,
subtle border/badge radius/mono12/18 rather than spec24px/padding8.

AttributeChip is escaped native text, with name:string required,
value:string|number|boolean|null required, size sm|md(defaultmd), native span
attributes/class. Render name plus '=' and a quoted String(value), preserving
zero/false/empty values and escaping quotes/markup. It is presentation, not a
live DOM attribute editor; name/value are not arbitrary JSX slots. No tab stop.
Ledger NO border overrides the older spec; surface/surface, badge radius and
muted name/foreground value remain token-driven.

FileTree is a labelled group/frame containing native nested UL/LI lists.
Use explicit list/listitem roles where list-style:none needs them to retain
WebKit accessibility semantics. Root props items:readonly FileTreeEntry[]
required, label(default "Project files"), tag:boolean(defaulttrue), optional
typeLabels{folder,file} for localizable static type equivalents, native div
attributes/class. Entry is a discriminated folder/file model with stable unique
nonblank id, required name content, optional comment content, ownership
none|owned|generated|guidance(defaultnone), optional custom tag text; folders may
have children, files may not. Reject duplicate identities and file children;
detect cycles rather than recursing indefinitely on malformed caller data.
No filesystem lookup, sorting, selection, open state, tree role, chevrons, hover
selection treatment, indent guides or custom arrow-key manager. All nodes are
visible; optional caller-supplied name/comment links retain native keyboard
behavior. Folder/file glyphs are decorative; a visually hidden type-label keeps
empty folders distinguishable to assistive technology. Ownership tag text is
default [owned]/[generated]/[guidance] or caller annotation (for example
[owned config], [generated history], [CLI-managed]). tag=false visually hides
the annotation but keeps its meaning in the accessibility tree. No duplicate
status announcement. Ownership none has no tag unless caller supplies one.
The actual anatomy is root/list/node/row/icon/name/comment/tag/type-label;
the planned indent part is removed because the ledger explicitly has no guides.
data-type/data-ownership belong only to row. Ledger eight type/ownership cases,
row min-height26, indent20, frame padding16/20, generated row muted and owned
tag foreground. Narrow text may wrap rather than overflow the document.

Figure is native figure/media container/optional figcaption. Props children
(required caller media), caption(optional, preserving zero/empty), width
prose|wide(defaultprose), media image|diagram(defaultimage), native figure
attributes/class. Caller supplies real image alt text, SVG name/description,
video or native child controls. Do not ship Figma's placeholder as actual media:
the image placeholder existed because the plugin couldn't create image fills.
Keep caller intrinsic media aspect ratio; no cropping or forced placeholder
ratio. Native figcaption supplies the semantic relationship without extra live
regions or tab stops. Border/subtle frame has no radius; caption padding-top8.
Widths reuse existing optional --ns-studio-prose-measure/wide with 100% fallback,
matching the already-shipped Markdown pattern. Utility currently resolves544/720;
no new prose token values or theme-family changes.

## 2. Domain vocabulary

Path is exact clipboard text; copied/error are actual outcomes, not supplied
visual claims. Attribute is a textual code example, not DOM mutation.
Ownership describes caller-supplied file provenance, not access control or a
filesystem claim. Folder/file is read-only structure; stable id owns render
identity. Comment/tag are documentation annotations. Figure width chooses the
existing prose measure; media describes caller content rather than fetching it.

## 3. Ports

Preact types/hooks, cn, existing L0 Icon plus verified folder glyph, native
clipboard API, span/code/button/UL/LI/figure/figcaption/media controls. No backend,
clipboard library, filesystem, tree engine or dependency changes. Clipboard
promises are guarded by local identity/mount state. Static surfaces stay SSR
friendly; native copy activation alone requires browser clipboard support.
File tree validation is local structural integrity, not filesystem validation.

## 4. Constants

Public unions own sizes, ownership, entry types, figure width/media and derived
copy state. Named label defaults and ownership/type label maps replace repeated
messages. Use existing semantic --ns-* color/type/spacing/radius roles only;
existing optional prose roles have the same fallback as Markdown. Fixed ledger
geometry is named/documented (26/20/6/2/5/16/20/8), never a token value change.
All inline dimensions and indentation use logical properties and support RTL.
Retain legal Lucide/Feather notices; add no tool/AI attribution footer.

## 5. Commit slices and gates

One complete unit, target fewer30 source/carrier files. Estimate28 source files
plus one export-corpus delta: eight TSX/CSS; registry JSON/embeddings/native copy/
CLI carriers; docs-kit2/3 + Z1 + contractsJSON; primitive glyph; new docs fixture/
focused test/provider + inventory/post-v1/actual installer; browser fixture/spec/
route; README. Folder Icon fixture lives in the new docs fixture module rather
than an extra basic-fixture edit. Count actual files before committing; if >=30,
split complete independently reviewed units without weakening gates. Run/context
updates accompany source/evidence. Source commit precedes corpus generation.

Strict SSR proves the four components/parts/ports, folder Z1 enum/render, FileTree
eight cases/nesting/ownership/comments/tags/hidden equivalents and malformed
structure controls, Figure four cases/caption0/native media, AttributeChip both
sizes/escaped text/zero/false, FilePath actual rest defaults/no invented Copied.
Both invalid axes and undeclared attribute additions must fail on every new
scope. Do not reintroduce a writable derived copy state or planned tree controls.

Real Utility light/dark390/1280 browser tests prove exact clipboard text via a
real supported write/read path, native Enter/Space/focus and copy=false skip,
actual rejected/missing clipboard errors and deterministic pending-promise
out-of-order/path-change/unmount controls. Mock failure/race controls supplement
real success, never replace it. Copy results/status text and focus are truthful.
Static components add no tab stop; native name/comment/media child links and
controls keep order/activation; file tree is a real accessible list with no
tree/treeitem/expanded/selected semantics. Assert ownership/type text even when
visually hidden; all rows stay visible after arrow keys. Figure real image load,
alt/caption and diagram semantics/child controls, intrinsic ratios and measure/
wide/narrow geometry. Local RTL and long content cause no document overflow.
Zero page/console errors and serious/critical axe findings/allowances, captures
against actual Utility renders. Focused Firefox/WebKit prove native controls and
static semantics; disclose clipboard capability baselines where engines differ.

Actual ui:add TSX/CSS fidelity/compile/lint/SSR + runtime import closure; source/
browser wrappers0drop; quality/architecture/template guards; preflight/docs
accuracy/export drift/site build; native publication0slowtypes, full doc-lint
exact accepted baseline and no new public Icon diagnostics; all four
committed-source carrier freshness checks. Same independent design/source/
evidence reviews and mandatory zero public audit before push/comment.

## 6. Deferred scope

No clipboard polyfill, filesystem/browser, selection/collapse model, image fetch/
upload, Markdown parser or theme/token rewrite. Toc/AnchorNav/RuledGrid/Hero and
Desktop audit remain11b; declared additive extensions/all-style harness12 and
full final13 remain required. Original Shell Toc integration remains11b.
Future nineteen promotions stay after the Utility canary. Runtime/current
required remote CI remain unproven, no READY.

## 7. Contributor path

packages/fresh-ui/README.md documents copied imports, exact copy/outcome/error/
stale-result behavior, escaped attribute examples, read-only FileTree data and
annotation/type semantics, and caller-owned figure media/alt/caption/width.


## Outcome visibility and path context clarification

Use useId for code/button description association so repeated Copy path names
have the exact path as their accessible description. The status region is hidden
when empty or reporting success (the check glyph supplies visible success), but
error text is visible as well as announced, using the existing destructive-text
role and wrapping if needed. This adds no error variant/axis and keeps the
ordinary26px minimum geometry. Stale completions never clear or mutate the current
status. A new attempt clears it; path/copy changes intentionally invalidate the
prior path outcome as already specified, preventing an old Copied message from
claiming success for the new displayed path. Cycle detection uses an ancestor
set plus a separate duplicate-ID check. Ports/scope remain unchanged.
