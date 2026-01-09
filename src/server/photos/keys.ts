import { randomUUID } from "node:crypto";
import {AllowedMimeType} from "@/lib/photos/constants";

const extByMime: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function sanitizeOriginalName(name: string) {
  // drop any path segments (Windows/macOS)
  const base = name.split(/[/\\]/).pop() ?? "file";
  // keep it short and safe-ish
  return base.replace(/[^\p{L}\p{N}._ -]+/gu, "").slice(0, 200);
}

export function makePhotoKey(contentType: AllowedMimeType) {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = randomUUID();
  const ext = extByMime[contentType];

  const prefixRaw = process.env.PHOTOS_PREFIX?.trim() || "photos";
  const prefix = prefixRaw.replace(/^\/+|\/+$/g, ""); // no leading/trailing slashes

  return `${prefix}/${yyyy}/${mm}/${uuid}.${ext}`;
}