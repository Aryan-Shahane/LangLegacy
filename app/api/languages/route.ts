import { NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/cloudant";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const languages = (await getAllDocuments("languages")) as Language[];
    return NextResponse.json(languages);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch languages" },
      { status: 500 }
    );
  }
}
