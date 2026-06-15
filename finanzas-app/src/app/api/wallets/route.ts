import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

const WALLET_LABELS: Record<string, string> = {
  efectivo: "Efectivo", yape: "Yape", plin: "Plin",
  bancaria: "Cuenta Bancaria", credito: "Tarjeta de Crédito", ahorros: "Cuenta de Ahorros",
};

async function getUser(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const wallets = await prisma.wallet.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(wallets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { name, type, balance, color } = await req.json();
  const wallet = await prisma.wallet.create({
    data: { userId: user.id, name, type, balance: parseFloat(balance ?? 0), color: color ?? "#10b981" },
  });
  await logActivity(user.id, "created", "wallet", `Cuenta creada: "${name}" (${WALLET_LABELS[type] ?? type})  - S/. ${parseFloat(balance ?? 0).toFixed(2)}`);
  return NextResponse.json(wallet, { status: 201 });
}

