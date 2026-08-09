import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


export async function  DELETE(req:NextRequest) {
  try {
    
    const session =  await getServerSession(authOptions);
    const storeId =  session?.user?.storeId;

    if(!storeId)return NextResponse.json({success:false,message:"Unauthorized"},{status:400})
    
      const {stockId} =  await req.json();

    if (!stockId)return NextResponse.json({
      success:false,messagea:"Select a Stock Item"
    },{status:400});

    const stockItem = await prisma.stock.findUnique({
      where:stockId
    })
    if (!stockItem)return NextResponse.json({
      success:false,messagea:"Stock Item not found"
    },{status:400});
    
    await  prisma.stock.delete({
      where:stockItem
    })
  } catch (error) {
    
  }
}

export async function PATCH(req:NextRequest) {
  try {
        const session =  await getServerSession(authOptions);
    const storeId =  session?.user?.storeId;

    if(!storeId)return NextResponse.json({success:false,message:"Unauthorized"},{status:400})

      const {stockId,dishId} = await req.json();

      if (!stockId)return NextResponse.json({
      success:false,messagea:"Select a Stock Item"
    },{status:400});
  } catch (error) {
    
  }
}