import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { name, email, password: hashed },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

