import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "node-html-parser";
import { NextRequest, NextResponse } from "next/server";
import { legacyAllowlist } from "@/src/legacy/manifest";
import { getCurrentAdmin } from "@/src/server/auth/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicDir = path.join(process.cwd(), "public");

function normalizeAdminPage(rawPage: string | null): string | null {
  const page = (rawPage || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");

  if (!page || page.includes("/") || page.includes("..") || page.includes("\0")) {
    return null;
  }

  if (!page.startsWith("admin-") || page === "admin-login.html") {
    return null;
  }

  if (!legacyAllowlist.has(page)) {
    return null;
  }

  return page;
}

export async function GET(request: NextRequest) {
  const page = normalizeAdminPage(request.nextUrl.searchParams.get("page"));

  if (!page) {
    return NextResponse.json({ error: "Invalid admin page" }, { status: 400 });
  }

  const admin = await getCurrentAdmin(request);

  if (!admin || admin.status !== "ENABLED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const absolutePath = path.join(publicDir, page);

  if (!absolutePath.startsWith(publicDir)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const html = await readFile(absolutePath, "utf8");
    const root = parse(html);
    const title = root.querySelector("title")?.text.trim() || "";
    const main =
      root.querySelector('main[data-ps-admin-fragment="content"]') ||
      root.querySelector("main.ps-admin-main");

    if (!main) {
      return NextResponse.json({ error: "Fragment root not found" }, { status: 422 });
    }

    const inlineCss = root
      .querySelectorAll("head style")
      .map((styleTag) => styleTag.innerHTML)
      .join("\n\n");

    return NextResponse.json(
      {
        page,
        title,
        mainInnerHtml: main.innerHTML,
        inlineCss
      },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
}
