import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, image, currentPassword, newPassword } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (image !== undefined) updateData.image = image;

  if (newPassword) {
    if (!user.password) return NextResponse.json({ error: "No tienes contraseña configurada" }, { status: 400 });
    if (!currentPassword) return NextResponse.json({ error: "Ingresa tu contraseña actual" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({ where: { email: session.user.email }, data: updateData });
  return NextResponse.json({ name: updated.name, image: updated.image });
}

