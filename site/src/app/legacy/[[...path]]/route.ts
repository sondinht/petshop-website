import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { legacyAllowlist } from "../../../legacy/manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicDir = path.join(process.cwd(), "public");

function toRequestedFile(rawPath: string[] | undefined): string | null {
  const joined = (rawPath ?? []).join("/").trim();

  let normalized = joined.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized === "") {
    normalized = "index.html";
  }

  if (normalized.includes("..") || normalized.includes("\0")) {
    return null;
  }

  if (!normalized.endsWith(".html")) {
    normalized = `${normalized}.html`;
  }

  if (!legacyAllowlist.has(normalized)) {
    return null;
  }

  return normalized;
}

export async function GET(
  _request: Request,
  context: { params: { path?: string[] } }
) {
  const requestedFile = toRequestedFile(context.params.path);

  if (!requestedFile) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const absolutePath = path.join(publicDir, requestedFile);

  if (!absolutePath.startsWith(publicDir)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const html = await readFile(absolutePath, "utf8");
    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8"
      }
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
