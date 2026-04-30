import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const tmpDir = path.join(rootDir, "tmp");

const inputFiles = {
  colorSemantic: "agent-color-semantic.json",
  colorRaw: "agent-color-raw.json",
  colorCore: "agent-color-core.json",
  border: "agent-border.json",
  icon: "agent-icon.json",
  text: "agent-text.json",
  radius: "agent-radius.json",
  spacing: "agent-spacing.json",
  styles: "agent-styles.json",
};

function loadMatches(filename) {
  const filePath = path.join(tmpDir, filename);
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return payload?.result?.matches ?? [];
}

function uniqueSortedNames(matches) {
  return [...new Set(matches.map((match) => match.name))].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base", numeric: true }),
  );
}

function titleCase(value) {
  return value
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugToWords(value) {
  return value
    .split("/")
    .filter(Boolean)
    .map((part) => titleCase(part))
    .join(" / ");
}

function groupBy(names, resolver) {
  const map = new Map();
  for (const name of names) {
    const key = resolver(name);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(name);
  }
  return map;
}

function sortMapEntries(map) {
  return [...map.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "en", { sensitivity: "base", numeric: true }),
  );
}

function inferColorUsage(name) {
  if (name.startsWith("Color/bg/interactive/")) {
    return "Interactive background state";
  }
  if (name.startsWith("Color/bg/")) {
    return "Semantic background or surface";
  }
  if (name.startsWith("Color/text/interactive/")) {
    return "Interactive text state";
  }
  if (name.startsWith("Color/text/")) {
    return "Semantic text color";
  }
  if (name.startsWith("Color/border/interactive/")) {
    return "Interactive border state";
  }
  if (name.startsWith("Color/border/")) {
    return "Semantic border and divider";
  }
  if (name.startsWith("Color/icon/interactive/")) {
    return "Interactive icon state";
  }
  if (name.startsWith("Color/icon/")) {
    return "Semantic icon color";
  }
  if (name.startsWith("Color/avatar/")) {
    return "Avatar or club badge semantic token";
  }
  if (name.startsWith("color/avatar/")) {
    return "Avatar raw palette token";
  }
  if (name.startsWith("color/brand/")) {
    return "Brand core palette token";
  }
  if (name.startsWith("light/")) {
    return "Light theme raw palette token";
  }
  return "FDS color token";
}

function inferTokenValue(name) {
  if (name.startsWith("spacing/")) {
    const suffix = name.split("/").pop();
    const parsed = Number(suffix);
    return Number.isFinite(parsed) ? `${parsed}px` : null;
  }
  if (name.startsWith("radius/")) {
    const suffix = name.split("/").pop();
    if (suffix === "circle") {
      return "9999px";
    }
    const parsed = Number(suffix);
    return Number.isFinite(parsed) ? `${parsed}px` : null;
  }
  return null;
}

function usageFromStyleName(name) {
  if (name.startsWith("Server/Heading/")) {
    return "Heading hierarchy";
  }
  if (name.startsWith("Server/Sub title/")) {
    return "Section subtitle";
  }
  if (name.startsWith("Server/Body")) {
    return "Body copy";
  }
  if (name.startsWith("Server/Caption")) {
    return "Caption and helper text";
  }
  if (name.startsWith("Breakpoint/")) {
    return "Grid breakpoint rule";
  }
  if (name.startsWith("Elevation/")) {
    return "Shadow or elevation";
  }
  if (name.startsWith("테이블/") || name.startsWith("테이블 ")) {
    return "Table layout guidance";
  }
  return "Design system style";
}

function styleCategory(name) {
  if (name.startsWith("Server/")) {
    return "text";
  }
  if (name.startsWith("Breakpoint/")) {
    return "breakpoint";
  }
  if (name.startsWith("Elevation/")) {
    return "elevation";
  }
  if (name.startsWith("테이블")) {
    return "table";
  }
  return "other";
}

function toTokenEntry(name, extra = {}) {
  return {
    name,
    value: inferTokenValue(name),
    usage: inferColorUsage(name),
    ...extra,
  };
}

const colorSemanticNames = uniqueSortedNames(loadMatches(inputFiles.colorSemantic)).filter((name) =>
  name.startsWith("Color/"),
);
const colorRawNames = uniqueSortedNames(loadMatches(inputFiles.colorRaw)).filter((name) =>
  name.startsWith("light/"),
);
const colorCoreNames = uniqueSortedNames(loadMatches(inputFiles.colorCore)).filter((name) =>
  name.startsWith("color/"),
);
const borderNames = uniqueSortedNames(loadMatches(inputFiles.border));
const iconNames = uniqueSortedNames(loadMatches(inputFiles.icon));
const textNames = uniqueSortedNames(loadMatches(inputFiles.text)).filter((name) =>
  name.startsWith("Color/text/"),
);
const radiusNames = uniqueSortedNames(loadMatches(inputFiles.radius));
const spacingNames = uniqueSortedNames(loadMatches(inputFiles.spacing));
const styleNames = uniqueSortedNames(loadMatches(inputFiles.styles));

const semanticGroups = groupBy(
  [...new Set([...colorSemanticNames, ...borderNames, ...iconNames, ...textNames])],
  (name) => {
    if (name.startsWith("Color/bg/")) return "background";
    if (name.startsWith("Color/text/")) return "text";
    if (name.startsWith("Color/border/")) return "border";
    if (name.startsWith("Color/icon/")) return "icon";
    if (name.startsWith("Color/avatar/")) return "avatar";
    return "other";
  },
);

const rawGroups = groupBy([...new Set([...colorRawNames, ...colorCoreNames])], (name) => {
  if (name.startsWith("color/brand/")) return "brand";
  if (name.startsWith("color/avatar/")) return "avatar";
  if (name.startsWith("light/")) {
    return name.split("/").slice(0, 2).join("/");
  }
  return "other";
});

const styleGroups = groupBy(styleNames, styleCategory);

const designTokens = {
  name: "Agent_skill_test",
  source: {
    file: "Agent_skill_test",
    origin: "Figma local variable catalog via xbridge search-design-system",
    generatedAt: new Date().toISOString(),
  },
  notes: {
    naming: "Original FDS token names and slash-based hierarchy are preserved.",
    colorValues:
      "Current xbridge local-file search exposes token names, types, and collections but not resolved color hex values for the full file catalog. Color value fields remain null until a value-capable export is used.",
    preferredUsage:
      "Use semantic tokens first, component-scoped families second, and raw palette tokens only when semantic tokens are unavailable.",
  },
  colors: {
    semantic: Object.fromEntries(
      sortMapEntries(semanticGroups).map(([group, names]) => [
        group,
        names.map((name) => ({
          name,
          value: null,
          valueStatus: "unresolved-from-current-bridge-read",
          usage: inferColorUsage(name),
        })),
      ]),
    ),
    raw: Object.fromEntries(
      sortMapEntries(rawGroups).map(([group, names]) => [
        group,
        names.map((name) => ({
          name,
          value: null,
          valueStatus: "unresolved-from-current-bridge-read",
          usage: inferColorUsage(name),
        })),
      ]),
    ),
  },
  spacing: spacingNames.map((name) => ({
    name,
    value: inferTokenValue(name),
    usage: "Spacing scale token",
  })),
  radius: radiusNames.map((name) => ({
    name,
    value: inferTokenValue(name),
    usage: name === "radius/circle" ? "Full-round or pill radius" : "Corner radius scale token",
  })),
  styles: {
    text: (styleGroups.get("text") ?? []).map((name) => ({
      name,
      usage: usageFromStyleName(name),
    })),
    breakpoint: (styleGroups.get("breakpoint") ?? []).map((name) => ({
      name,
      usage: usageFromStyleName(name),
    })),
    elevation: (styleGroups.get("elevation") ?? []).map((name) => ({
      name,
      usage: usageFromStyleName(name),
    })),
    table: (styleGroups.get("table") ?? []).map((name) => ({
      name,
      usage: usageFromStyleName(name),
    })),
    other: (styleGroups.get("other") ?? []).map((name) => ({
      name,
      usage: usageFromStyleName(name),
    })),
  },
};

function renderTable(rows, headers) {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [headerLine, separator, body].filter(Boolean).join("\n");
}

function renderTokenTable(names, { includeValue = true } = {}) {
  const rows = names.map((name) => [
    `\`${name}\``,
    includeValue ? `\`${inferTokenValue(name) ?? "n/a"}\`` : "`n/a`",
    inferColorUsage(name),
  ]);
  return renderTable(rows, ["Token", "Value", "Usage"]);
}

function renderStyleTable(names) {
  const rows = names.map((name) => [`\`${name}\``, usageFromStyleName(name)]);
  return renderTable(rows, ["Style", "Usage"]);
}

const semanticPriority = [
  "background",
  "text",
  "border",
  "icon",
  "avatar",
  "other",
];

const rawPriority = ["brand", "avatar"];

const designMarkdownParts = [
  "# DESIGN.md - Agent_skill_test",
  "",
  "## Overview",
  "Agent_skill_test is a local FDS-derived design system source used to preserve original token names and hierarchy for downstream design generation. The naming model intentionally keeps the original slash-based FDS token structure so tools like Stitch can reference the same vocabulary used in Figma.",
  "",
  "This export was generated from the local variable catalog inside the `Agent_skill_test` Figma file through xbridge. Color token names were read successfully, but full-file raw color values were not exposed by the current local-file search endpoint. Because of that limitation, color sections below preserve the original names, hierarchy, and intended usage while leaving color values unresolved.",
  "",
  "## Token Rules",
  "- Preserve original FDS token names exactly.",
  "- Preserve original slash-based hierarchy exactly.",
  "- Prefer semantic tokens such as `Color/bg/*`, `Color/text/*`, `Color/border/*`, and `Color/icon/*` before raw palette tokens.",
  "- Use component-scoped families such as `Color/avatar/*` directly when designing avatars, club badges, or similar identity elements.",
  "- Use raw palette tokens only when semantic tokens are unavailable.",
  "",
  "## Colors",
  "",
  "### Semantic Colors",
];

for (const group of semanticPriority) {
  const names = semanticGroups.get(group);
  if (!names || names.length === 0) continue;
  designMarkdownParts.push(`#### ${titleCase(group)}`);
  designMarkdownParts.push(renderTokenTable(names, { includeValue: false }));
  designMarkdownParts.push("");
}

designMarkdownParts.push("### Raw Palette");
designMarkdownParts.push("");

for (const group of rawPriority) {
  const names = rawGroups.get(group);
  if (!names || names.length === 0) continue;
  designMarkdownParts.push(`#### ${titleCase(group)}`);
  designMarkdownParts.push(renderTokenTable(names, { includeValue: false }));
  designMarkdownParts.push("");
}

for (const [group, names] of sortMapEntries(rawGroups)) {
  if (rawPriority.includes(group)) continue;
  designMarkdownParts.push(`#### ${slugToWords(group)}`);
  designMarkdownParts.push(renderTokenTable(names, { includeValue: false }));
  designMarkdownParts.push("");
}

designMarkdownParts.push("## Spacing");
designMarkdownParts.push("");
designMarkdownParts.push(
  renderTable(
    spacingNames.map((name) => [`\`${name}\``, `\`${inferTokenValue(name)}\``, "Spacing scale token"]),
    ["Token", "Value", "Usage"],
  ),
);
designMarkdownParts.push("");
designMarkdownParts.push("## Radius");
designMarkdownParts.push("");
designMarkdownParts.push(
  renderTable(
    radiusNames.map((name) => [
      `\`${name}\``,
      `\`${inferTokenValue(name) ?? "n/a"}\``,
      name === "radius/circle" ? "Full-round or pill radius" : "Corner radius scale token",
    ]),
    ["Token", "Value", "Usage"],
  ),
);
designMarkdownParts.push("");
designMarkdownParts.push("## Typography and Styles");
designMarkdownParts.push("");

for (const [group, names] of sortMapEntries(styleGroups)) {
  if (names.length === 0) continue;
  designMarkdownParts.push(`### ${titleCase(group)}`);
  designMarkdownParts.push(renderStyleTable(names));
  designMarkdownParts.push("");
}

designMarkdownParts.push("## Guidance");
designMarkdownParts.push("- Use semantic tokens first whenever they exist.");
designMarkdownParts.push("- Keep raw palette tokens as implementation references, not as a replacement naming system.");
designMarkdownParts.push("- Maintain enterprise clarity, dense information layout, and predictable interaction states.");
designMarkdownParts.push("- Preserve avatar and badge token families consistently within a single component set.");
designMarkdownParts.push("");
designMarkdownParts.push("## Export Notes");
designMarkdownParts.push("- File source: `Agent_skill_test`");
designMarkdownParts.push("- Export method: xbridge `search-design-system` on `local-file`");
designMarkdownParts.push("- Color values are intentionally left unresolved in this export because the current bridge response did not include file-wide resolved color values.");

const designMarkdown = designMarkdownParts.join("\n");

fs.writeFileSync(path.join(rootDir, "design.md"), designMarkdown);
fs.writeFileSync(
  path.join(rootDir, "design-tokens.json"),
  JSON.stringify(designTokens, null, 2) + "\n",
);

console.log("Generated design.md and design-tokens.json");
