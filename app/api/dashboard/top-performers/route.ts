import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
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

    // Check for an active session
    const activeSession = await prisma.dailySession.findFirst({
      where: {
        storeId,
        status: "OPEN",
      },
    });

    if (!activeSession) {
      return NextResponse.json({
        success: true,
        data: {
          topCustomers: [],
          topStaff: [],
        },
      });
    }

    const sessionId = activeSession.id;

    // Top Customers by Sales Volume (Completed Orders in current session)
    const topCustomersGroups = await prisma.order.groupBy({
      by: ["customerId"],
      _sum: {
        total: true,
      },
      where: {
        storeId,
        dailySessionId: sessionId,
        status: "COMPLETED",
        customerId: { not: null },
        isDeleted: false,
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 5,
    });

    const customerIds = topCustomersGroups
      .map((g) => g.customerId)
      .filter((id): id is string => id !== null);

    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        storeId,
      },
    });

    const topCustomers = topCustomersGroups.map((group) => {
      const customer = customers.find((c) => c.id === group.customerId);
      return {
        id: group.customerId,
        name: customer?.fullName || "Unknown",
        image: null,
        totalSpent: group._sum.total || 0,
        orderCount: 0,
      };
    });

    // Top Staff by Order Count or Volume in current session
    const topStaffGroups = await prisma.order.groupBy({
      by: ["staffId"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      where: {
        storeId,
        dailySessionId: sessionId,
        staffId: { not: null },
        isDeleted: false,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const staffIds = topStaffGroups
      .map((g) => g.staffId)
      .filter((id): id is string => id !== null);

    const staffMembers = await prisma.staff.findMany({
      where: {
        id: { in: staffIds },
        storeId,
      },
    });

    const topStaff = topStaffGroups.map((group) => {
      const staff = staffMembers.find((s) => s.id === group.staffId);
      return {
        id: group.staffId,
        name: staff?.name || "Unknown",
        role: staff?.role || "Staff",
        image: staff?.image,
        ordersHandled: group._count.id,
        totalSales: group._sum.total || 0,
      };
    });

    const response: ApiResponse = {
      success: true,
      data: {
        topCustomers,
        topStaff,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Top Performers API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
