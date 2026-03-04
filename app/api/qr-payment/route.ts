import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const qrPayment = await prisma.qrPayment.findFirst({
      where: { storeId },
    });

    return NextResponse.json({
      success: true,
      data: qrPayment,
    });
  } catch (error) {
    console.error("Get QR Payment Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { image } = body; // Expecting string or string[]

    const images = Array.isArray(image) ? image : [image].filter(Boolean);

    const qrPayment = await prisma.qrPayment.upsert({
      where: {
        id:
          (await prisma.qrPayment.findFirst({ where: { storeId } }))?.id ||
          "new-qr",
      },
      update: {
        image: images,
      },
      create: {
        storeId,
        image: images,
      },
    });

    return NextResponse.json({
      success: true,
      data: qrPayment,
      message: "QR Payment updated successfully",
    });
  } catch (error) {
    console.error("Update QR Payment Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
