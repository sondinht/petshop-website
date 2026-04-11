import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { legacyAllowlist } from "@/src/legacy/manifest";
import { getCurrentAdmin } from "@/src/server/auth/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicDir = path.join(process.cwd(), "public");

function toRequestedFile(rawPath: string[] | undefined): string | null {
  const joined = (rawPath ?? []).join("/").trim();

  let normalized = joined.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized === "") {
    normalized = "index.html";
  }

  if (normalized.includes("..") || normalized.includes("\0") || normalized.includes("/")) {
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

function injectEnhancement(html: string, page: string): string {
  const pageScript = `<script>window.__PAGE__=${JSON.stringify(page)};</script>`;
  const enhanceScript = '<script type="module" src="/enhance.js"></script>';

  if (html.includes("</body>")) {
    return html.replace("</body>", `${pageScript}${enhanceScript}</body>`);
  }

  return `${html}\n${pageScript}${enhanceScript}`;
}

export async function GET(
  request: NextRequest,
  context: { params: { path?: string[] } }
) {
  const requestedFile = toRequestedFile(context.params.path);

  if (!requestedFile) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const isAdminPage =
    requestedFile.startsWith("admin-") && requestedFile !== "admin-login.html";

  if (isAdminPage) {
    const admin = await getCurrentAdmin(request);

    if (!admin || admin.status !== "ENABLED") {
      const redirectUrl = request.nextUrl.clone();
      const nextPath = `/${requestedFile}${request.nextUrl.search}`;

      redirectUrl.pathname = "/admin-login.html";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("next", nextPath);

      return NextResponse.redirect(redirectUrl, { status: 302 });
    }
  }

  const fileToServe = isAdminPage ? "admin-shell.html" : requestedFile;
  const absolutePath = path.join(publicDir, fileToServe);

  if (!absolutePath.startsWith(publicDir)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const html = await readFile(absolutePath, "utf8");
    return new NextResponse(injectEnhancement(html, requestedFile), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8"
      }
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
