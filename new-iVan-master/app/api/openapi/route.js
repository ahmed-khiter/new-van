import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const specPath = path.join(process.cwd(), "docs", "openapi", "openapi.yaml");
    const yamlSpec = await fs.readFile(specPath, "utf8");

    return new NextResponse(yamlSpec, {
      status: 200,
      headers: {
        "Content-Type": "application/yaml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load OpenAPI spec",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
