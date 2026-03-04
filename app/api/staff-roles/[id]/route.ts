import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if any staff are using this role
    const staffWithRole = await prisma.staff.count({
      where: { roleId: id },
    });

    if (staffWithRole > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete role while staff are assigned to it",
        },
        { status: 400 },
      );
    }

    await prisma.staffRole.delete({
      where: { id, storeId },
    });

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Delete Staff Role Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
