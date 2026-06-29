import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:        true,
      name:      true,
      email:     true,
      image:     true,
      role:      true,
      isActive:  true,
      createdAt: true,
      _count: {
        select: {
          transactions: true,
          wallets:      true,
          goals:        true,
          budgets:      true,
        },
      },
    },
  });

  return NextResponse.json(users);
}
