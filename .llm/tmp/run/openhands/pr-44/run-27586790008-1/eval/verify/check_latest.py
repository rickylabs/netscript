"""Cross-check every catalog entry against npm-latest snapshot."""
import re

dump = open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/imports.all.txt").read()
npm_latest = {}
for line in open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/registry/npm-latest.txt"):
    m = re.match(r"^([^:]+): npm latest = (.+)$", line.strip())
    if m: npm_latest[m.group(1)] = m.group(2)
jsr_latest = {}
for line in open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/registry/jsr-latest.txt"):
    m = re.match(r"^([^:]+): jsr latest = (.+)$", line.strip())
    if m: jsr_latest[m.group(1)] = m.group(2)

sections = re.split(r"^=== (.*?) ===$", dump, flags=re.MULTILINE)
files = {}
for i in range(1, len(sections), 2):
    name = sections[i]
    body = sections[i+1]
    cat, imp = {}, {}
    for line in body.split("\n"):
        m = re.match(r"^  CAT (\S+) (.+)$", line)
        if m: cat[m.group(1)] = m.group(2).strip()
        m = re.match(r"^  IMP (\S+) (.+)$", line)
        if m: imp[m.group(1)] = m.group(2).strip()
    files[name] = (cat, imp)

root_cat = files["deno.json"][0]
print(f"{'PKG':<45} {'CATALOG':<12} {'LATEST':<12} STATUS")
print("-"*85)
for pkg in sorted(root_cat):
    cat_v = root_cat[pkg]
    cat_v_stripped = cat_v.lstrip("^~")
    latest = npm_latest.get(pkg, "?")
    if latest == cat_v_stripped or latest == cat_v:
        status = "OK (latest)"
    else:
        status = f"NOT-LATEST"
    print(f"{pkg:<45} {cat_v:<12} {latest:<12} {status}")

# Inline jsr: specifiers
print("\n=== Inline jsr: specifiers ===")
jsr_inline = []
for name, (cat, imp) in files.items():
    for k, v in imp.items():
        if v.startswith("jsr:"):
            m = re.match(r"^jsr:(@?[^@]+)@?([^/]+)?(/.*)?$", v)
            if m:
                scope_pkg = m.group(1)
                ver = (m.group(2) or "").strip()
                sub = m.group(3) or ""
                # jsr specifiers may be `jsr:@hono/hono@4.12.24` or `jsr:@hono/hono@^4`
                # parse "scope/pkg" vs "pkg"
                jsr_inline.append((scope_pkg, ver, sub, name, k, v))
for sp, ver, sub, name, k, v in sorted(set(jsr_inline)):
    latest = jsr_latest.get(sp, "?")
    # only compare versions that aren't "major" (^N) or range
    is_range = ver.startswith("^") or ver.startswith("~")
    if is_range:
        print(f"  {sp}@{ver}{sub}  (range; latest={latest})  in {name}:{k}")
    else:
        ok = "OK" if ver == latest else f"NOT-LATEST (latest={latest})"
        print(f"  {sp}@{ver}{sub}  {ok}  in {name}:{k}")
