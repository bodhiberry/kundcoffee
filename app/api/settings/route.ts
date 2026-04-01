import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Store ID not found" },
        { status: 401 },
      );
    }

    const settings = await prisma.systemSetting.findMany({
      where: { storeId },
    });
    const settingsMap = settings.reduce(
      (acc: Record<string, string>, curr: { key: string; value: string }) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    // Default settings if not found
    if (!settingsMap.currency) settingsMap.currency = "Rs.";

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Store ID not found" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, message: "Key is required" },
        { status: 400 },
      );
    }

    const setting = await prisma.systemSetting.upsert({
      where: {
        key_storeId: {
          key,
          storeId,
        },
      },
      update: { value },
      create: { key, value, storeId },
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error("Update Setting Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
