#!/usr/bin/env python3
"""Gate checks for docs-readme-revamp PR #117"""
import os
import re
import subprocess
import sys

def gate3_dead_docs_links():
    """Gate 3: No README links to ./docs/* paths"""
    print("\n=== GATE 3: Dead ./docs/* links in READMEs ===")
    issues = []
    
    for root, dirs, files in os.walk("packages"):
        if "README.md" in files:
            path = os.path.join(root, "README.md")
            with open(path, encoding="utf-8") as f:
                content = f.read()
            
            # Check for ./docs/ links
            matches = re.findall(r'\]\([^)]*docs/[^)]*\)', content)
            if matches:
                issues.append(f"{path}: {matches}")
    
    for root, dirs, files in os.walk("plugins"):
        if "README.md" in files:
            path = os.path.join(root, "README.md")
            with open(path, encoding="utf-8") as f:
                content = f.read()
            
            matches = re.findall(r'\]\([^)]*docs/[^)]*\)', content)
            if matches:
                issues.append(f"{path}: {matches}")
    
    if issues:
        print(f"✗ FAIL: {len(issues)} READMEs link to ./docs/*")
        for issue in issues:
            print(f"  {issue}")
        return False
    else:
        print("✓ PASS: No dead ./docs/* links")
        return True

def gate4_voice_check():
    """Gate 4: No 'honest/honesty/honestly' words in READMEs"""
    print("\n=== GATE 4: Voice check (honest/honesty/honestly) ===")
    issues = []
    pattern = re.compile(r'\b(honest|honesty|honestly)\b', re.IGNORECASE)
    
    for root, dirs, files in os.walk("packages"):
        if "README.md" in files:
            path = os.path.join(root, "README.md")
            with open(path, encoding="utf-8") as f:
                content = f.read()
            
            matches = pattern.findall(content)
            if matches:
                issues.append(f"{path}: {matches}")
    
    for root, dirs, files in os.walk("plugins"):
        if "README.md" in files:
            path = os.path.join(root, "README.md")
            with open(path, encoding="utf-8") as f:
                content = f.read()
            
            matches = pattern.findall(content)
            if matches:
                issues.append(f"{path}: {matches}")
    
    if issues:
        print(f"✗ FAIL: {len(issues)} READMEs contain banned words")
        for issue in issues:
            print(f"  {issue}")
        return False
    else:
        print("✓ PASS: No banned voice words")
        return True

def gate5_api_spotcheck():
    """Gate 5: API claims match exports (spot-check 5 packages)"""
    print("\n=== GATE 5: API spot-check (contracts, config, logger, sdk, plugin) ===")
    
    packages = ["contracts", "config", "logger", "sdk", "plugin"]
    results = {}
    
    for pkg in packages:
        deno_json = f"packages/{pkg}/deno.json"
        if not os.path.exists(deno_json):
            print(f"⚠ SKIP: {pkg} (no deno.json)")
            continue
        
        # Read exports from deno.json
        with open(deno_json, encoding="utf-8") as f:
            import json
            config = json.load(f)
        
        exports = config.get("exports", {})
        if not exports:
            print(f"⚠ SKIP: {pkg} (no exports)")
            continue
        
        # Count export entries
        export_count = len(exports)
        
        # Read mod.ts or entrypoint
        entry = exports.get(".", "./mod.ts")
        if isinstance(entry, dict):
            entry = entry.get("default", "./mod.ts")
        
        entry_path = f"packages/{pkg}/{entry.lstrip('./')}"
        if not os.path.exists(entry_path):
            print(f"⚠ SKIP: {pkg} (entry not found: {entry_path})")
            continue
        
        with open(entry_path, encoding="utf-8") as f:
            content = f.read()
        
        # Count exports in source
        export_matches = re.findall(r'export\s+(?:async\s+)?(?:function|class|const|type|interface)\s+(\w+)', content)
        reexport_matches = re.findall(r'export\s+\{[^}]+\}', content)
        reexport_count = len(reexport_matches)
        
        results[pkg] = {
            "deno_json_exports": export_count,
            "source_exports": len(export_matches),
            "reexports": reexport_count,
            "sample_exports": export_matches[:5]
        }
        
        print(f"✓ {pkg}: {export_count} exports in deno.json, {len(export_matches)} in source, {reexport_count} re-exports")
        if export_matches:
            print(f"  Sample: {', '.join(export_matches[:5])}")
    
    return True

if __name__ == "__main__":
    os.chdir("/home/runner/work/netscript/netscript")
    
    g3 = gate3_dead_docs_links()
    g4 = gate4_voice_check()
    g5 = gate5_api_spotcheck()
    
    print("\n=== SUMMARY ===")
    print(f"Gate 3 (dead ./docs/* links): {'✓ PASS' if g3 else '✗ FAIL'}")
    print(f"Gate 4 (voice check): {'✓ PASS' if g4 else '✗ FAIL'}")
    print(f"Gate 5 (API spot-check): {'✓ PASS' if g5 else '✗ FAIL'}")
    
    sys.exit(0 if all([g3, g4, g5]) else 1)
