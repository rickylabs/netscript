"""Enumerate every deno.json in the repo, dump imports + catalog + jsr/ npm: specifiers.
Produces:
  imports.all.txt     - per-file: name -> spec
  registry-needed.txt - unique jsr / npm packages to query
  dup-keys.txt        - any duplicate keys within any one deno.json
  inline-npm.txt      - npm: specifiers that are NOT subpath versions
"""
import os
import re
import sys
import json
import subprocess
from collections import defaultdict, OrderedDict
from parse_json5 import load

ROOT = "/home/runner/work/netscript/netscript"

def find_deno_jsons():
    out = []
    for dp, _, files in os.walk(ROOT):
        if "/node_modules" in dp or "/.deno" in dp or "/.llm/tmp" in dp:
            continue
        for f in files:
            if f == "deno.json" or f == "deno.json.template":
                out.append(os.path.join(dp, f))
    return sorted(out)

def classify(spec: str):
    """Return (kind, version, package) where kind ∈ {catalog, jsr, npm, npm-subpath, relative, http, other}"""
    if spec.startswith("catalog:"):
        return ("catalog", "", "")
    if spec.startswith("jsr:@std/") or spec.startswith("jsr:/@std/"):
        m = re.match(r"jsr:(@std/[\w\-]+)(@[\^~]?[\d\.\w\-]+)?(/.*)?$", spec)
        if m:
            return ("jsr-std", m.group(2) or "", m.group(1))
    if spec.startswith("jsr:"):
        m = re.match(r"jsr:(@[\w\-]+/[\w\-]+)(@[\^~]?[\d\.\w\-\+\*]+)?(/.*)?$", spec)
        if m:
            return ("jsr", m.group(2) or "", m.group(1))
    if spec.startswith("npm:") or spec.startswith("npm:/"):
        # extract pkg@version/path
        s = spec[4:] if spec.startswith("npm:") else spec[5:]
        m = re.match(r"(@?[\w\-]+(?:/[\w\-]+)?)(@[\^~]?[\d\.\w\-\+\*]+)?(/.*)?$", s)
        if m:
            pkg = m.group(1)
            ver = m.group(2) or ""
            sub = m.group(3) or ""
            if sub:
                return ("npm-subpath", ver, pkg + sub)
            return ("npm", ver, pkg)
    if spec.startswith("./") or spec.startswith("../") or spec.startswith("/"):
        return ("relative", "", spec)
    if spec.startswith("http://") or spec.startswith("https://"):
        return ("http", "", spec)
    if spec.startswith("node:"):
        return ("node", "", spec)
    if spec.startswith("npm:") or spec.startswith("file:") or spec.startswith("jsr:/"):
        return ("other", "", spec)
    return ("other", "", spec)

def main():
    paths = find_deno_jsons()
    print(f"Found {len(paths)} deno.json(/.template) files", file=sys.stderr)
    all_pkgs = OrderedDict()   # (kind, pkg) -> set(versions)
    dup_keys_report = []
    inline_npm_report = []
    imports_dump = []
    for p in paths:
        try:
            d = load(p)
        except Exception as e:
            print(f"ERR {p}: {e}", file=sys.stderr)
            continue
        imports = d.get("imports", {}) or {}
        catalog = d.get("catalog", {}) or {}
        if not isinstance(imports, dict):
            print(f"WARN {p}: imports is not dict", file=sys.stderr)
            continue
        rel = p.replace(ROOT + "/", "")
        imports_dump.append(f"=== {rel} ===")
        imports_dump.append(f"# catalog entries: {len(catalog)}")
        for k, v in catalog.items():
            imports_dump.append(f"  CAT {k} {v}")
        imports_dump.append(f"# imports entries: {len(imports)}")
        # check for dup keys within imports
        seen = defaultdict(int)
        for k in imports:
            seen[k] += 1
        dups = [k for k, n in seen.items() if n > 1]
        if dups:
            dup_keys_report.append((rel, dups))
        for k, v in imports.items():
            imports_dump.append(f"  IMP {k} {v}")
            kind, ver, pkg = classify(v)
            if kind in ("npm", "jsr", "jsr-std"):
                all_pkgs.setdefault((kind, pkg, k), set()).add(ver)
            if kind == "npm":
                inline_npm_report.append((rel, k, v))
            if kind == "jsr" and pkg.startswith("@netscript/"):
                pass  # netscript packages, not from registry
    with open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/imports.all.txt", "w") as f:
        f.write("\n".join(imports_dump))
    with open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/registry-needed.txt", "w") as f:
        for (kind, pkg, key), vers in all_pkgs.items():
            f.write(f"{kind}\t{pkg}\t{key}\t{','.join(sorted(vers))}\n")
    with open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/dup-keys.txt", "w") as f:
        for rel, dups in dup_keys_report:
            f.write(f"{rel}: {dups}\n")
    with open("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/inline-npm.txt", "w") as f:
        for rel, k, v in inline_npm_report:
            f.write(f"{rel}: {k} -> {v}\n")
    print(f"Total: {len(all_pkgs)} unique registry-bound specifiers, {len(inline_npm_report)} inline npm, {len(dup_keys_report)} dup-key files", file=sys.stderr)

if __name__ == "__main__":
    main()
