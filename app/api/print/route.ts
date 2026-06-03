import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import net from "net";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ipAddress, port, base64Data } = body;

    if (!ipAddress) {
      return NextResponse.json(
        { success: false, message: "IP address is required" },
        { status: 400 }
      );
    }

    if (!base64Data) {
      return NextResponse.json(
        { success: false, message: "Print data is required" },
        { status: 400 }
      );
    }

    const portNum = port ? parseInt(port, 10) : 9100;
    const buffer = Buffer.from(base64Data, "base64");

    await new Promise<void>((resolve, reject) => {
      const client = new net.Socket();

      // Set timeout for connection
      client.setTimeout(5000);

      client.connect(portNum, ipAddress, () => {
        client.write(buffer, () => {
          client.end();
          resolve();
        });
      });

      client.on("error", (err) => {
        client.destroy();
        reject(new Error(`Socket error: ${err.message}`));
      });

      client.on("timeout", () => {
        client.destroy();
        reject(new Error("Connection timed out (printer might be offline or unreachable)"));
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/print error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to print to network printer" },
      { status: 500 }
    );
  }
}
