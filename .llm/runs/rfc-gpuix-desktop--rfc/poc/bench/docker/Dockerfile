# GPUIX evaluation bench image: Ubuntu 24.04 (glibc 2.39, required by the
# published @gpuix/native linux binary), Xvfb + Mesa lavapipe (software Vulkan)
# so GPUI can open a real X11 window without a GPU, plus the WebKitGTK and CEF
# runtime libraries needed by the `deno desktop` webview/cef baselines.
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl unzip xz-utils git procps psmisc time jq python3 \
      xvfb xauth x11-utils x11-apps xdotool imagemagick dbus dbus-x11 \
      mesa-vulkan-drivers libvulkan1 vulkan-tools libgl1-mesa-dri libegl1 libgbm1 \
      libxkbcommon0 libxkbcommon-x11-0 libxcb1 libx11-6 libx11-xcb1 libxrandr2 libxi6 libxcursor1 \
      libwayland-client0 libfontconfig1 libfreetype6 fonts-dejavu-core fonts-noto-core fonts-inter \
      libwebkit2gtk-4.1-0 libgtk-3-0t64 libsoup-3.0-0 libayatana-appindicator3-1 libxdo3 \
      libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxcomposite1 libxdamage1 \
      libxfixes3 libpango-1.0-0 libcairo2 libasound2t64 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*
ARG DENO_VERSION=2.9.7
ARG BUN_VERSION=1.4.4
ARG NODE_VERSION=24.20.0
RUN curl -fsSL -o /tmp/deno.zip https://dl.deno.land/release/v${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip \
    && unzip -q /tmp/deno.zip -d /usr/local/bin && rm /tmp/deno.zip \
    && curl -fsSL -o /tmp/bun.zip https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-x64.zip \
    && unzip -q /tmp/bun.zip -d /tmp && mv /tmp/bun-linux-x64/bun /usr/local/bin/bun && rm -rf /tmp/bun* \
    && curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz | tar -xJ -C /opt \
    && ln -s /opt/node-v${NODE_VERSION}-linux-x64/bin/node /usr/local/bin/node \
    && ln -s /opt/node-v${NODE_VERSION}-linux-x64/bin/npm /usr/local/bin/npm \
    && ln -s /opt/node-v${NODE_VERSION}-linux-x64/bin/npx /usr/local/bin/npx
RUN useradd -m -u 1000 -o bench || true
ENV XDG_RUNTIME_DIR=/tmp/xdg LIBGL_ALWAYS_SOFTWARE=1 VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.x86_64.json
# Packaging tools: NSIS (Windows installer), png2icns (macOS icon), zip.
RUN apt-get update && apt-get install -y --no-install-recommends nsis icnsutils zip \
    && rm -rf /var/lib/apt/lists/*
