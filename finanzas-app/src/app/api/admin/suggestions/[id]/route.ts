import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id }    = await params;
  const { status } = await req.json();

  const updated = await prisma.suggestion.update({
    where: { id },
    data:  { status },
  });

  return NextResponse.json(updated);
}
