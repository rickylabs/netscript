#!/usr/bin/env bash
# Fetch the bundled UI fonts (OFL) from Ubuntu 24.04 packages into assets/fonts.
# Run inside the bench image as root: docker run --rm -v "$PWD:$PWD" -w "$PWD" gpuix-eval-bench:1 scripts/fetch-fonts.sh
set -euo pipefail
apt-get update -qq && apt-get install -y -qq --no-install-recommends fonts-inter fonts-jetbrains-mono >/dev/null
cp /usr/share/fonts/opentype/inter/Inter-{Regular,Medium,SemiBold}.otf assets/fonts/
cp /usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-{Regular,Medium}.ttf assets/fonts/
chown -R "$(stat -c %u:%g .)" assets/fonts
