import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const cwd = process.cwd();

function parseArgs(argv) {
  const out = {
    outFile: "project_dump.txt",
    maxFileKB: 1024, // 1MB per file (защита от случайных больших файлов)
    maxTotalMB: 50,  // 50MB total (чтобы txt не улетел в космос)
    includeGitIgnored: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" || a === "-o") out.outFile = argv[++i] ?? out.outFile;
    if (a === "--max-file-kb") out.maxFileKB = Number(argv[++i] ?? out.maxFileKB);
    if (a === "--max-total-mb") out.maxTotalMB = Number(argv[++i] ?? out.maxTotalMB);
    if (a === "--include-ignored") out.includeGitIgnored = true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const EXCLUDE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  ".vercel",
  ".turbo",
  ".output",
  ".cache",
  ".pulumi",
  "dist",
  "build",
  "out",
  "coverage",
  ".pnpm-store",
]);

const EXCLUDE_FILE_PREFIXES = [
  ".env",
];

const EXCLUDE_EXTS = new Set([
  // binaries & big assets
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico",
  ".pdf", ".zip", ".gz", ".tar", ".7z",
  ".mp4", ".mov", ".avi", ".mkv",
  ".mp3", ".wav",
  ".ttf", ".otf", ".woff", ".woff2",
  ".lockb",
]);

const EXCLUDE_EXACT = new Set([
  "pnpm-lock.yaml", // опционально: если хочешь включить, убери отсюда
]);

const EXCLUDE_GLOBS_LIKE = [
  "prisma/migrations", // если миграций много — можно убрать; если хочешь включить, удали эту строку
];

function hasExcludedDir(filePath) {
  const parts = filePath.split("/").filter(Boolean);
  return parts.some((p) => EXCLUDE_DIRS.has(p));
}

function hasExcludedPrefix(filePath) {
  const base = path.posix.basename(filePath);
  return EXCLUDE_FILE_PREFIXES.some((p) => base === p || base.startsWith(p + "."));
}

function hasExcludedExt(filePath) {
  const ext = path.posix.extname(filePath).toLowerCase();
  return EXCLUDE_EXTS.has(ext);
}

function isExcludedByGlobLike(filePath) {
  return EXCLUDE_GLOBS_LIKE.some((p) => filePath.startsWith(p + "/") || filePath === p);
}

function shouldSkip(filePath) {
  if (!filePath) return true;
  if (filePath.includes("\0")) return true;
  if (hasExcludedDir(filePath)) return true;
  if (hasExcludedPrefix(filePath)) return true;
  if (hasExcludedExt(filePath)) return true;
  if (EXCLUDE_EXACT.has(filePath)) return true;
  if (isExcludedByGlobLike(filePath)) return true;
  return false;
}

function isProbablyBinary(buf) {
  const slice = buf.subarray(0, Math.min(buf.length, 8000));
  if (slice.length === 0) return false;

  let suspicious = 0;
  for (const b of slice) {
    if (b === 0) return true; // NULL byte
    // allow \t \n \r
    if (b < 9) suspicious++;
    else if (b > 13 && b < 32) suspicious++;
  }
  // если слишком много управляющих — вероятно бинарь
  return suspicious / slice.length > 0.25;
}

function safeRel(p) {
  // always use posix-like separators in output
  return p.split(path.sep).join("/");
}

function tryGitListFiles(includeIgnored) {
  const cmd = includeIgnored
    ? "git ls-files -co --exclude-standard --ignored --others"
    : "git ls-files -co --exclude-standard";

  const out = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

async function main() {
  // 1) Collect candidate files
  let files = [];
  try {
    files = tryGitListFiles(args.includeGitIgnored);
  } catch {
    // fallback: naive walk
    console.error("WARN: git not available. Falling back to directory walk.");
    files = await walkDir(".");
  }

  files = files
    .map(safeRel)
    .filter((f) => !shouldSkip(f));

  // 2) Build dump
  const outPath = path.resolve(cwd, args.outFile);
  const maxTotalBytes = Math.max(1, args.maxTotalMB) * 1024 * 1024;
  const maxFileBytes = Math.max(1, args.maxFileKB) * 1024;

  const header = [
    `# Project dump`,
    `# root: ${cwd}`,
    `# createdAt: ${new Date().toISOString()}`,
    `# files: ${files.length}`,
    `# NOTE: secrets (.env*) and binaries are excluded.`,
    ``,
  ].join("\n");

  await fs.writeFile(outPath, header, "utf8");

  let totalBytes = Buffer.byteLength(header, "utf8");
  const skipped = [];

  for (const file of files) {
    try {
      const abs = path.resolve(cwd, file);
      const st = await fs.stat(abs);
      if (!st.isFile()) continue;

      if (st.size > maxFileBytes) {
        skipped.push({ file, reason: `too large (${st.size} bytes > ${maxFileBytes})` });
        continue;
      }

      const buf = await fs.readFile(abs);
      if (isProbablyBinary(buf)) {
        skipped.push({ file, reason: "binary" });
        continue;
      }

      const content = buf.toString("utf8");

      const chunk = [
        ``,
        `// file: ${file}`,
        content.replace(/\u0000/g, ""),
        ``,
      ].join("\n");

      const chunkBytes = Buffer.byteLength(chunk, "utf8");
      if (totalBytes + chunkBytes > maxTotalBytes) {
        skipped.push({ file, reason: `total limit reached (${args.maxTotalMB}MB)` });
        break;
      }

      await fs.appendFile(outPath, chunk, "utf8");
      totalBytes += chunkBytes;
    } catch (e) {
      skipped.push({ file, reason: `read error: ${String(e?.message ?? e)}` });
    }
  }

  // 3) Append summary
  const summary = [
    ``,
    `# ---- SUMMARY ----`,
    `# writtenBytes: ${totalBytes}`,
    `# skipped: ${skipped.length}`,
    skipped.length
      ? `# skippedFiles:\n${skipped
        .slice(0, 2000)
        .map((s) => `# - ${s.file} (${s.reason})`)
        .join("\n")}`
      : `# skippedFiles: none`,
    ``,
  ].join("\n");

  await fs.appendFile(outPath, summary, "utf8");

  // 4) fingerprint
  const outBuf = await fs.readFile(outPath);
  const hash = crypto.createHash("sha256").update(outBuf).digest("hex");

  console.log(`OK: wrote ${args.outFile}`);
  console.log(`SHA256: ${hash}`);
  console.log(`Bytes: ${totalBytes}`);
  if (skipped.length) console.log(`Skipped: ${skipped.length} (see summary at end of file)`);
}

async function walkDir(root) {
  const out = [];
  async function rec(dir) {
    const abs = path.resolve(cwd, dir);
    const entries = await fs.readdir(abs, { withFileTypes: true });
    for (const e of entries) {
      const rel = safeRel(path.join(dir, e.name));
      if (shouldSkip(rel)) continue;
      if (e.isDirectory()) await rec(rel);
      else if (e.isFile()) out.push(rel);
    }
  }
  await rec(root);
  return out;
}

await main();