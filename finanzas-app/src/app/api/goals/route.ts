import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function getUser(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { name, description, targetAmount, deadline, color } = await req.json();
  const goal = await prisma.goal.create({
    data: { userId: user.id, name, description, targetAmount: parseFloat(targetAmount), deadline: deadline ? new Date(deadline) : null, color: color ?? "#10b981" },
  });
  await logActivity(user.id, "created", "goal", `Meta creada: "${name}"  - objetivo S/. ${parseFloat(targetAmount).toFixed(2)}`);
  return NextResponse.json(goal, { status: 201 });
}

