import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

type ImportRow = {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { rows }: { rows: ImportRow[] } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No hay filas válidas" }, { status: 400 });
  }

  const created = await prisma.transaction.createMany({
    data: rows.map(r => ({
      userId: user.id,
      date: new Date(r.date),
      description: r.description,
      amount: Math.abs(r.amount),
      type: r.type,
      category: r.category,
    })),
    skipDuplicates: false,
  });

  await logActivity(user.id, "created", "transaction", `${created.count} transacciones importadas desde CSV`);
  return NextResponse.json({ imported: created.count }, { status: 201 });
}

