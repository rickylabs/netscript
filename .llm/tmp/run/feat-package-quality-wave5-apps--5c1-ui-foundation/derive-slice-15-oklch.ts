type DtcgColorToken = {
  $type: "color";
  $value: {
    colorSpace: string;
    components: number[];
    hex: string;
  };
  $extensions: {
    netscript: {
      cssVar: string;
    };
  };
};

type PrimitiveTokens = {
  $description?: string;
  color: Record<string, Record<string, DtcgColorToken>>;
};

type RampSpec = {
  readonly hue: number;
  readonly chroma: number;
  readonly lightness: Readonly<Record<string, number>>;
};

const SPECS: Readonly<Record<string, RampSpec>> = {
  gray: {
    hue: 85,
    chroma: 0.006,
    lightness: {
      "1": 0.985,
      "2": 0.945,
      "3": 0.885,
      "4": 0.805,
      "5": 0.735,
      "6": 0.595,
      "7": 0.47,
      "8": 0.37,
      "9": 0.27,
      "10": 0.215,
      "11": 0.175,
      "12": 0.135,
    },
  },
  copper: {
    hue: 52,
    chroma: 0.105,
    lightness: {
      "1": 0.955,
      "2": 0.885,
      "3": 0.815,
      "4": 0.745,
      "5": 0.695,
      "6": 0.635,
      "7": 0.555,
      "8": 0.47,
    },
  },
  teal: {
    hue: 190,
    chroma: 0.082,
    lightness: {
      "1": 0.955,
      "2": 0.875,
      "3": 0.785,
      "4": 0.705,
      "5": 0.61,
      "6": 0.535,
      "7": 0.455,
    },
  },
  slate: {
    hue: 255,
    chroma: 0.028,
    lightness: {
      "1": 0.965,
      "2": 0.895,
      "3": 0.79,
      "4": 0.705,
      "5": 0.615,
      "6": 0.525,
      "7": 0.435,
    },
  },
  red: {
    hue: 28,
    chroma: 0.165,
    lightness: {
      "4": 0.705,
      "5": 0.625,
      "6": 0.545,
      "7": 0.455,
    },
  },
  amber: {
    hue: 78,
    chroma: 0.13,
    lightness: {
      "4": 0.815,
      "5": 0.735,
      "6": 0.655,
    },
  },
};

const path = "packages/fresh-ui/tokens/primitives.tokens.json";
const tokens = JSON.parse(await Deno.readTextFile(path)) as PrimitiveTokens;
const evidence: Record<string, Record<string, unknown>> = {};

for (const [family, spec] of Object.entries(SPECS)) {
  const group = tokens.color[family];
  if (!group) throw new Error(`Missing color group: ${family}`);
  evidence[family] = {};

  for (const [step, lightness] of Object.entries(spec.lightness)) {
    const token = group[step];
    if (!token) throw new Error(`Missing color token: ${family}.${step}`);
    const color = fitOklchToSrgb(lightness, spec.chroma, spec.hue);
    token.$value = {
      colorSpace: "oklch",
      components: [
        round(color.lightness, 4),
        round(color.chroma, 4),
        round(color.hue, 2),
      ],
      hex: color.hex,
    };
    evidence[family][step] = {
      cssVar: token.$extensions.netscript.cssVar,
      requested: [lightness, spec.chroma, spec.hue],
      components: token.$value.components,
      hex: color.hex,
      chromaReduced: round(spec.chroma - color.chroma, 4),
    };
  }
}

await Deno.writeTextFile(path, `${JSON.stringify(tokens, null, 2)}\n`);
await Deno.writeTextFile(
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-15-oklch-ramp-evidence.json",
  `${JSON.stringify({ source: path, ramps: evidence }, null, 2)}\n`,
);
await Deno.writeTextFile(
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-15-oklch-visual-review.html",
  renderVisualReview(evidence),
);

function fitOklchToSrgb(lightness: number, chroma: number, hue: number) {
  let candidate = chroma;
  while (candidate >= 0) {
    const rgb = oklchToSrgb(lightness, candidate, hue);
    if (rgb.every((channel) => channel >= 0 && channel <= 1)) {
      return {
        lightness,
        chroma: candidate,
        hue,
        hex: rgbToHex(rgb),
      };
    }
    candidate -= 0.001;
  }
  return {
    lightness,
    chroma: 0,
    hue,
    hex: rgbToHex(oklchToSrgb(lightness, 0, hue).map(clamp01)),
  };
}

function oklchToSrgb(lightness: number, chroma: number, hue: number) {
  const hueRadians = hue * Math.PI / 180;
  const a = Math.cos(hueRadians) * chroma;
  const b = Math.sin(hueRadians) * chroma;

  const l_ = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = lightness - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const linear = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];

  return linear.map(linearToSrgb);
}

function linearToSrgb(value: number) {
  return value <= 0.0031308
    ? 12.92 * value
    : 1.055 * value ** (1 / 2.4) - 0.055;
}

function rgbToHex(rgb: number[]) {
  return `#${
    rgb.map((channel) =>
      Math.round(clamp01(channel) * 255).toString(16).padStart(2, "0")
    ).join("")
  }`;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function renderVisualReview(evidence: Record<string, Record<string, unknown>>) {
  const sections = Object.entries(evidence).map(([family, steps]) => {
    const swatches = Object.entries(steps).map(([step, raw]) => {
      const value = raw as {
        cssVar: string;
        components: number[];
        hex: string;
      };
      const [lightness, chroma, hue] = value.components;
      const oklch = `oklch(${round(lightness * 100, 2)}% ${round(chroma, 4)} ${
        round(hue, 2)
      })`;
      return [
        `<article class="swatch">`,
        `  <div class="chip" style="background: ${value.hex}; background: ${oklch};"></div>`,
        `  <strong>${family}-${step}</strong>`,
        `  <code>${value.cssVar}</code>`,
        `  <span>${value.hex}</span>`,
        `  <span>${oklch}</span>`,
        `</article>`,
      ].join("\n");
    }).join("\n");
    return `<section><h2>${family}</h2><div class="grid">${swatches}</div></section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Slice 15 OKLCH Ramp Review</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: system-ui, sans-serif;
      background: #111110;
      color: #fafaf9;
    }
    body {
      margin: 0;
      padding: 32px;
    }
    h1,
    h2 {
      margin: 0 0 16px;
      font-weight: 700;
    }
    section {
      margin-block: 28px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    .swatch {
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
    }
    .chip {
      height: 56px;
      border-radius: 6px;
      margin-bottom: 8px;
      border: 1px solid rgba(0, 0, 0, 0.3);
    }
    strong,
    code,
    span {
      display: block;
      font-size: 12px;
      line-height: 1.35;
    }
    code {
      color: #9fd3cb;
    }
  </style>
</head>
<body>
  <h1>Slice 15 OKLCH Ramp Review</h1>
  ${sections}
</body>
</html>
`;
}
