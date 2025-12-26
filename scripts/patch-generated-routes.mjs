// file: scripts/patch-generated-routes.mjs
import fs from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";

const TARGETS = [
  "src/routes/makeRoute.tsx",
  "src/routes/utils.ts",
];

const HEADER = `// @ts-nocheck
/* eslint-disable */
`;

async function patchFile(relPath) {
  const absPath = path.join(process.cwd(), relPath);

  try {
    let content = await fs.readFile(absPath, "utf8");

    // Idempotent
    if (content.startsWith("// @ts-nocheck")) return;

    // Keep "use client" directive valid (comments before it are allowed)
    content = HEADER + content;

    await fs.writeFile(absPath, content, "utf8");
    console.log(`[patch-routes] added @ts-nocheck to ${relPath}`);
  } catch (err) {
    // File might not exist yet (first run / partial generation) — ignore
  }
}

async function patchAll() {
  await Promise.all(TARGETS.map(patchFile));
}

const isWatch = process.argv.includes("--watch");

await patchAll();

if (isWatch) {
  const dir = path.join(process.cwd(), "src/routes");
  console.log(`[patch-routes] watching ${dir}`);

  let timer;

  watch(dir, { persistent: true }, (event, filename) => {
    if (!filename) return;
    if (filename === "makeRoute.tsx" || filename === "utils.ts") {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void patchAll();
      }, 80);
    }
  });

  // keep process alive
  await new Promise(() => {});
}