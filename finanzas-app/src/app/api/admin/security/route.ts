import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now        = new Date();
  const h1ago      = new Date(now.getTime() - 60  * 60 * 1000);
  const h24ago     = new Date(now.getTime() - 24  * 60 * 60 * 1000);
  const d7ago      = new Date(now.getTime() - 7   * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

  const [recentLogins, auditLogs] = await Promise.all([
    prisma.loginHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  // Compute stats from recentLogins
  const todayLogins   = recentLogins.filter(l => l.createdAt >= todayStart);
  const failedToday   = todayLogins.filter(l => !l.success).length;
  const successToday  = todayLogins.filter(l =>  l.success).length;

  // Failed in last hour — detect suspicious accounts (≥3 attempts)
  const failedLastHour = recentLogins.filter(l => !l.success && l.createdAt >= h1ago);
  const suspiciousMap  = new Map<string, number>();
  failedLastHour.forEach(l => suspiciousMap.set(l.email, (suspiciousMap.get(l.email) ?? 0) + 1));
  const suspicious = Array.from(suspiciousMap.entries())
    .filter(([, count]) => count >= 3)
    .map(([email, attempts]) => ({ email, attempts }));

  // Failed per day (last 7 days)
  const failedPerDay = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(d7ago.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const count = recentLogins.filter(l => !l.success && l.createdAt.toISOString().slice(0, 10) === key).length;
    return { day: key, count };
  });

  // Failed per hour (last 24h)
  const failedPerHour = Array.from({ length: 24 }, (_, i) => {
    const hStart = new Date(h24ago.getTime() + i * 60 * 60 * 1000);
    const hEnd   = new Date(hStart.getTime() + 60 * 60 * 1000);
    const label  = `${String(hStart.getHours()).padStart(2, "0")}:00`;
    const count  = recentLogins.filter(l => !l.success && l.createdAt >= hStart && l.createdAt < hEnd).length;
    return { hour: label, count };
  });

  return NextResponse.json({
    recentLogins,
    stats: {
      failedToday,
      successToday,
      suspiciousCount: suspicious.length,
      totalToday: failedToday + successToday,
    },
    suspicious,
    failedPerDay,
    failedPerHour,
    auditLogs: auditLogs.map(l => ({
      id:          l.id,
      action:      l.action,
      entity:      l.entity,
      description: l.description,
      createdAt:   l.createdAt,
      user:        l.user,
    })),
  });
}
