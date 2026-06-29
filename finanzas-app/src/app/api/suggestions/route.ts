import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, message } = await req.json();
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Título y mensaje son requeridos" }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      userId:  (session.user as any).id, // eslint-disable-line @typescript-eslint/no-explicit-any
      title:   title.trim(),
      message: message.trim(),
    },
  });

  return NextResponse.json(suggestion, { status: 201 });
}
