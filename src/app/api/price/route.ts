import { getPriceOfProject } from "@/app/db/utils";
import { NextResponse } from "next/server";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectName = url.searchParams.get("projectName");

    if (!projectName) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      );
    }

    const price = await getPriceOfProject(projectName);

    if (!price) {
      return NextResponse.json(
        { success: false, error: "Price not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: price });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
