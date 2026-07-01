"""Strip // line comments and /* ... */ block comments then json.load the file.
Deno's deno.json allows comments, so use this instead of stdlib json.load.
"""
import re
import json
import sys

def strip_comments(s: str) -> str:
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.DOTALL)
    s = re.sub(r"//[^\n]*", "", s)
    return s

def load(path: str):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    return json.loads(strip_comments(text))

if __name__ == "__main__":
    print(json.dumps(load(sys.argv[1]), indent=2, sort_keys=True))
