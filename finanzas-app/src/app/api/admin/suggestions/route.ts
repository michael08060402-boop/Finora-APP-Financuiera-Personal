import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, image: true } } },
  });

  return NextResponse.json(suggestions);
}
