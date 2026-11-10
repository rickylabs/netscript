#!/usr/bin/env bash
# Repro for two 0.0.9 findings on a fresh scaffold (SQLite + Garnet):
#   1. the first-party background plugins' Prisma fragments do not validate/migrate on SQLite;
#   2. installing streams does not link the scaffold service unless --service is passed, so its
#      record-activity publisher stays disabled.
#   bash sqlite-plugins.sh <empty-dir>
set -uo pipefail
cd "$1"
NS=(deno run -A --no-config --node-modules-dir=none jsr:@netscript/cli@0.0.9)
"${NS[@]}" init repro --db sqlite --service --cache --cache-backend garnet --no-agent --no-git --ci --yes > init.log 2>&1; echo "init exit=$?"
cd "$(dirname "$(find . -maxdepth 3 -name appsettings.json | head -1)")" && echo "workspace: $PWD"
cp appsettings.json ../appsettings.before.json
for kind in workers sagas triggers; do
  "${NS[@]}" plugin install "$kind" --name "$kind" --ci > "install-$kind.log" 2>&1; echo "plugin install $kind exit=$?"
done
"${NS[@]}" plugin install streams --name streams --ci > install-streams.log 2>&1; echo "plugin install streams exit=$?"
cp appsettings.json ../appsettings.after.json
echo "--- services after installing streams without --service"
python3 -c "import json;d=json.load(open('appsettings.json'))['NetScript'];print('Services:',json.dumps(d.get('Services')));print('streams entry:',json.dumps(d.get('Plugins',{}).get('streams')))"
echo "--- Prisma fragments with Postgres-only syntax"
grep -rn -E '@db\.|String\[\]' database --include=*.prisma | head -20
echo "--- prisma validate"
(cd database/sqlite && deno task db:validate) > validate.log 2>&1; echo "db:validate exit=$?"; grep -E 'P1012|error|Error|Validation' validate.log | head -12
