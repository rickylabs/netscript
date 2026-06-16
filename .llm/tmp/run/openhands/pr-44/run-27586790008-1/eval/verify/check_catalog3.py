"""Fixed check: strip the leading @ from inline npm version before comparing."""
import re

dump = open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/imports.all.txt").read()

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

root_cat = files.get("deno.json", ({}, {}))[0]

missing, unused = [], set()
all_used = set()
for name, (cat, imp) in files.items():
    if name == "deno.json": continue
    for k, v in imp.items():
        if v == "catalog:":
            if k not in root_cat:
                missing.append((name, k))
            else:
                all_used.add(k)
for k in root_cat:
    if k not in all_used: unused.add(k)

print(f"Root catalog: {len(root_cat)} entries")
print(f"Missing catalog: refs: {len(missing)}")
for m in missing: print(" ", m)
print(f"Unused catalog: entries: {len(unused)}")
for u in sorted(unused): print(" ", u)

# Inline npm: subpath — fix: drop leading @ from version
print("\n=== Inline npm: subpath specifiers (post-fix) ===")
mismatches = []
for name, (cat, imp) in files.items():
    for k, v in imp.items():
        m = re.match(r"^npm:(@?[\w\-]+(?:/[\w\-]+)?)(@?[\^~]?[\d\.\w\-\+\*]+)?(/.*)?$", v)
        if not m: continue
        pkg = m.group(1)
        sub = m.group(3)
        if not sub: continue  # bare
        inline_ver = (m.group(2) or "").lstrip("@")
        if pkg in root_cat:
            cat_ver = root_cat[pkg]
            if inline_ver != cat_ver:
                mismatches.append((name, k, v, pkg, inline_ver, cat_ver))
                print(f"  MISMATCH {name}: {k} -> {v} catalog {pkg}={cat_ver}")
        else:
            mismatches.append((name, k, v, pkg, None, None))
            print(f"  PKG-NOT-IN-CATALOG {name}: {k} -> {v}")
print(f"\n{len(mismatches)} inline-npm issues after fix")

# Check for bare inline npm: specifiers (no subpath)
print("\n=== Bare inline npm: specifiers (no subpath) — should be catalog: ===")
for name, (cat, imp) in files.items():
    for k, v in imp.items():
        m = re.match(r"^npm:(@?[\w\-]+(?:/[\w\-]+)?)(@?[\^~]?[\d\.\w\-\+\*]+)?(/.*)?$", v)
        if m and not m.group(3):
            print(f"  {name}: {k} -> {v}")
