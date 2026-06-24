#!/usr/bin/env python3
"""Per-package README evaluation for PR #117"""

import os
import re
import json
from pathlib import Path

# Voice check banned words/phrases
VOICE_BANNED = [
    r'\bhonest\b', r'\bhonesty\b', r'\bhonestly\b',
    r'\blet me be (?:honest|frank|transparent)\b',
    r'\bbe (?:honest|frank|transparent)\b',
]

def check_voice(readme_text):
    """Check for banned voice patterns"""
    for pattern in VOICE_BANNED:
        if re.search(pattern, readme_text, re.IGNORECASE):
            return f"FAIL (banned phrase: {pattern})"
    return "PASS"

def check_links(readme_text, package_name):
    """Check for dead ./docs/* links and cross-refs"""
    issues = []
    
    # Check for dead ./docs/* links
    dead_links = re.findall(r'\./docs/[^)]+', readme_text)
    if dead_links:
        issues.append(f"dead ./docs/* link(s): {dead_links}")
    
    # Check cross-ref links to docs site
    cross_refs = re.findall(r'https://rickylabs\.github\.io/netscript/[^\s\)]+', readme_text)
    
    return issues, cross_refs

def check_structure(readme_text):
    """Check for industry-standard structure"""
    checks = {
        'title': bool(re.search(r'^#\s+@netscript/', readme_text, re.MULTILINE)),
        'badges': bool(re.search(r'!\[JSR\]', readme_text)),
        'description': bool(re.search(r'^\*\*[^*]+\*\*', readme_text, re.MULTILINE)),
        'quick_start': bool(re.search(r'## (?:🚀 )?Quick Start', readme_text, re.IGNORECASE)),
        'installation': bool(re.search(r'### Installation', readme_text, re.IGNORECASE)),
        'usage': bool(re.search(r'### Usage', readme_text, re.IGNORECASE)),
        'capabilities': bool(re.search(r'## (?:📦 )?Key Capabilities', readme_text, re.IGNORECASE)),
        'documentation': bool(re.search(r'## (?:📖 )?Documentation', readme_text, re.IGNORECASE)),
        'license': bool(re.search(r'## (?:📝 )?License', readme_text, re.IGNORECASE)),
    }
    
    missing = [k for k, v in checks.items() if not v]
    return checks, missing

def check_api_claims(readme_text, package_name):
    """Extract API claims for spot-check"""
    # Look for code examples
    code_blocks = re.findall(r'```(?:typescript|ts)?\n(.*?)```', readme_text, re.DOTALL)
    
    # Extract imports/symbols mentioned
    imports = set()
    symbols = set()
    
    for block in code_blocks:
        # Find imports
        import_matches = re.findall(r'import\s+{([^}]+)}\s+from', block)
        for match in import_matches:
            symbols.update(s.strip() for s in match.split(','))
    
    return list(symbols)[:10]  # Max 10 for spot-check

def main():
    results = []
    
    # Scan packages/*/README.md and plugins/*/README.md
    for category in ['packages', 'plugins']:
        cat_path = Path(category)
        if not cat_path.exists():
            continue
            
        for pkg_dir in sorted(cat_path.iterdir()):
            if not pkg_dir.is_dir():
                continue
                
            readme_path = pkg_dir / 'README.md'
            if not readme_path.exists():
                continue
            
            package_name = pkg_dir.name
            full_name = f"{category}/{package_name}"
            
            with open(readme_path) as f:
                text = f.read()
            
            # Run checks
            voice_result = check_voice(text)
            link_issues, cross_refs = check_links(text, package_name)
            structure_checks, missing_sections = check_structure(text)
            api_claims = check_api_claims(text, package_name)
            
            results.append({
                'package': full_name,
                'voice': voice_result,
                'link_issues': link_issues,
                'cross_ref_count': len(cross_refs),
                'structure': structure_checks,
                'missing_sections': missing_sections,
                'api_claims_sample': api_claims,
                'readme_size': len(text),
            })
    
    # Print results
    print("# Per-Package README Evaluation Summary\n")
    print(f"Total packages evaluated: {len(results)}\n")
    
    print("## Package Results\n")
    for r in results:
        print(f"### {r['package']}")
        print(f"- Voice: {r['voice']}")
        print(f"- Cross-refs: {r['cross_ref_count']}")
        print(f"- Link issues: {r['link_issues'] if r['link_issues'] else 'none'}")
        print(f"- Structure: {sum(r['structure'].values())}/{len(r['structure'])} sections")
        if r['missing_sections']:
            print(f"- Missing: {', '.join(r['missing_sections'])}")
        print(f"- API claims (sample): {r['api_claims_sample'][:5]}")
        print(f"- README size: {r['readme_size']} chars")
        print()

if __name__ == '__main__':
    main()
