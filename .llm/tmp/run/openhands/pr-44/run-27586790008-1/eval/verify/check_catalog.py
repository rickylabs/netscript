"""Verify that every `catalog:` reference resolves to a root catalog entry,
and that every root catalog entry is referenced by at least one member (sanity).

Also surface the inline npm: subpath specifiers and confirm version == catalog version.
"""
import re
import sys
import os
from collections import defaultdict

ROOT = "/home/runner/work/netscript/netscript"

# Use the existing imports.all.txt
dump = open(f"{ROOT}/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/imports.all.txt").read()

# Parse it
sections = re.split(r"^=== (.*?) ===$", dump, flags=re.MULTILINE)
files = {}
for i in range(1, len(sections), 2):
    name = sections[i]
    body = sections[i+1]
    cat = {}
    imp = {}
    for line in body.split("\n"):
        if line.startswith("  CAT "):
            _, k, v = line.split(" ", 2)
            cat[k] = v.strip()
        elif line.startswith("  IMP "):
            _, k, v = line.split(" ", 2)
            imp[k] = v.strip()
    files[name] = (cat, imp)

root_cat = files.get("deno.json", ({}, {}))[0]
print(f"Root catalog has {len(root_cat)} entries")
print("Catalog keys:", sorted(root_cat.keys()))

# Now check
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

print("\n=== Missing catalog entries (catalog: with no root entry) ===")
for m in missing:
    print(m)
print(f"\n=== Unused catalog entries (in root, never referenced) ===")
for u in unused:
    print(u)

# Now check inline npm: subpaths
print("\n=== Inline npm: subpath specifiers ===")
for name, (cat, imp) in files.items():
    for k, v in imp.items():
        m = re.match(r"npm:(@?[\w\-]+(?:/[\w\-]+)?)(@[\^~]?[\d\.\w\-\+\*]+)?(/.*)?$", v)
        if m:
            pkg = m.group(1)
            sub = m.group(3)
            if sub:
                # check version matches root catalog
                if pkg in root_cat:
                    inline_ver = m.group(2) or ""
                    cat_ver = root_cat[pkg]
                    ok = inline_ver == cat_ver
                    print(f"  {name}: {k} -> {v} (catalog {pkg}={cat_ver}) {'OK' if ok else 'MISMATCH'}")
                else:
                    print(f"  {name}: {k} -> {v} (pkg {pkg} NOT in root catalog)")
