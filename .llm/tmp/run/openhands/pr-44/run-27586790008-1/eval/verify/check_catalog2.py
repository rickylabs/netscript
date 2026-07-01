"""Verify catalog completeness using the existing imports.all.txt dump."""
import re

ROOT_DUMP = "/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/imports.all.txt"
dump = open(ROOT_DUMP).read()

# Each section is separated by === <path> === and has lines like:
#   CAT <key> <value>
#   IMP <key> <value>
sections = re.split(r"^=== (.*?) ===$", dump, flags=re.MULTILINE)
files = {}
for i in range(1, len(sections), 2):
    name = sections[i]
    body = sections[i+1]
    cat = {}
    imp = {}
    for line in body.split("\n"):
        m = re.match(r"^  CAT (\S+) (.+)$", line)
        if m:
            cat[m.group(1)] = m.group(2).strip()
        m = re.match(r"^  IMP (\S+) (.+)$", line)
        if m:
            imp[m.group(1)] = m.group(2).strip()
    files[name] = (cat, imp)

root_cat = files.get("deno.json", ({}, {}))[0]
print(f"Root catalog has {len(root_cat)} entries")
for k in sorted(root_cat.keys()):
    print(f"  {k} = {root_cat[k]}")

missing = []
unused = []
all_used = set()
for name, (cat, imp) in files.items():
    if name == "deno.json":
        continue
    for k, v in imp.items():
        if v == "catalog:":
            if k not in root_cat:
                missing.append((name, k))
            else:
                all_used.add(k)
for k in root_cat:
    if k not in all_used:
        unused.append(k)

print(f"\n=== {len(missing)} catalog: refs with NO root entry (FAIL) ===")
for m in missing:
    print("  ", m)
print(f"\n=== {len(unused)} root catalog entries never referenced (info) ===")
for u in unused:
    print("  ", u)

# Inline npm: subpath specifiers — version must equal catalog version
print("\n=== Inline npm: subpath specifiers ===")
mismatches = []
for name, (cat, imp) in files.items():
    for k, v in imp.items():
        m = re.match(r"^npm:(@?[\w\-]+(?:/[\w\-]+)?)(@[\^~]?[\d\.\w\-\+\*]+)?(/.*)?$", v)
        if m:
            pkg = m.group(1)
            sub = m.group(3)
            if sub:
                inline_ver = m.group(2) or ""
                if pkg in root_cat:
                    cat_ver = root_cat[pkg]
                    ok = inline_ver == cat_ver
                    if not ok:
                        mismatches.append((name, k, v, pkg, inline_ver, cat_ver))
                        print(f"  MISMATCH {name}: {k} -> {v} catalog {pkg}={cat_ver}")
                else:
                    mismatches.append((name, k, v, pkg, None, None))
                    print(f"  PKG-NOT-IN-CATALOG {name}: {k} -> {v}")
            else:
                print(f"  BARE-INLINE-NPM {name}: {k} -> {v}")
print(f"\n{len(mismatches)} inline-npm subpath issues")
