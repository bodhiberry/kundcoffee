import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, description, image, sortOrder, showInOrderingApp, isActive } = await req.json();
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          message: "Category name is required",
        },
        { status: 400 },
      );
    }

    const existingCategoryName = await prisma.category.findFirst({
      where: {
        name,
        storeId,
      },
    });

    if (existingCategoryName)
      return NextResponse.json(
        {
          success: false,
          message: `Category "${name}" already exists`,
        },
        { status: 400 },
      );

    // Calculate next sortOrder within this store
    let finalSortOrder = parseInt(String(sortOrder));
    if (!finalSortOrder) {
      const lastCategory = await prisma.category.findFirst({
        where: { storeId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 1;
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        sortOrder: finalSortOrder,
        storeId,
        showInOrderingApp: showInOrderingApp !== undefined ? showInOrderingApp : true,
        isActive: isActive !== undefined ? isActive : true,
        image: image || null,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Category Created",
      data: category,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const category = await prisma.category.findMany({
      where: { storeId },
      include: {
        dishes: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}

// export async function PUT(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { id, name, image, description } = body;

//     if (!id || !name) {
//       return NextResponse.json(
//         { success: false, message: "ID and Name are required" },
//         { status: 400 },
//       );
//     }

//     const category = await prisma.category.update({
//       where: { id },
//       data: {
//         name,
//         image,
//         description,
//       },
//     });

//     return NextResponse.json({ success: true, data: category });
//   } catch (error) {
//     console.error("Failed to update category:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to update category" },
//       { status: 500 },
//     );
//   }
// }

// export async function DELETE(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get("id");

//     if (id) {
//       // Single Delete
//       const category = await prisma.category.findUnique({
//         where: { id },
//         include: { dishes: true },
//       });

//       if (category && category.dishes.length > 0) {
//         return NextResponse.json(
//           { success: false, message: "Cannot delete category with dishes" },
//           { status: 409 },
//         );
//       }

//       await prisma.category.delete({ where: { id } });
//       return NextResponse.json({ success: true, message: "Category deleted" });
//     }

//     // Bulk Delete (Legacy logic kept but might be dangerous without ID)
//     const dishCount = await prisma.dish.count();

//     if (dishCount > 0) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Cannot delete categories while dishes exist",
//         },
//         { status: 409 },
//       );
//     }

//     await prisma.category.deleteMany();

//     return NextResponse.json(
//       {
//         success: true,
//         message: "All categories deleted successfully",
//       },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { success: false, message: "Something went wrong" },
//       { status: 500 },
//     );
//   }
// }
