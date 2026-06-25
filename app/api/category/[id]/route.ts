import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    console.log("this is my params id ", id);
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category Id is required",
        },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: id },
      include: {
        dishes: true,
        combos: true,
      },
    });

    if (!category)
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 400 },
      );

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Category Id is required" },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category does not exist" },
        { status: 404 },
      );
    }

    // ADD sortOrder HERE
    const { name, description, sortOrder, image, showInOrderingApp } = await req.json();
    
    if (name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { success: false, message: `Category "${name}" already exists` },
          { status: 400 },
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(image && { image }),
        // ADD THIS LINE
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        showInOrderingApp: showInOrderingApp !== undefined ? showInOrderingApp : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;

    if (!id)
      return NextResponse.json(
        {
          success: false,
          message: "Item not found",
        },
        { status: 400 },
      );

    const dishCount = await prisma.dish.count({
      where: { categoryId: id },
    });
    if (dishCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category has dishes. Remove them first.",
        },
        { status: 409 },
      );
    }

    const subMenuCount = await prisma.subMenu.count({
      where: { categoryId: id },
    });
    if (subMenuCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category has sub-menus. Remove them first.",
        },
        { status: 409 },
      );
    }

    const comboCount = await prisma.comboOffer.count({
      where: { categoryId: id },
    });
    if (comboCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category has combo offers. Remove them first.",
        },
        { status: 409 },
      );
    }

    const addOnCount = await prisma.addOn.count({
      where: { categoryId: id },
    });
    if (addOnCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category has add-ons. Remove them first.",
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}
