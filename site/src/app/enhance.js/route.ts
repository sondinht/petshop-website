import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enhanceScriptPath = path.join(process.cwd(), "src", "enhance", "enhance.js");

export async function GET() {
  try {
    const source = await readFile(enhanceScriptPath, "utf8");
    return new NextResponse(source, {
      status: 200,
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  } catch {
    return new NextResponse("console.error('enhance module missing');", {
      status: 500,
      headers: {
        "content-type": "application/javascript; charset=utf-8"
      }
    });
  }
}
