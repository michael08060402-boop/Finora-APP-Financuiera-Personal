import { prisma } from "./prisma";

export type ActivityAction = "created" | "updated" | "deleted";
export type ActivityEntity = "transaction" | "budget" | "goal" | "wallet";

export async function logActivity(
  userId: string,
  action: ActivityAction,
  entity: ActivityEntity,
  description: string
) {
  try {
    await prisma.activityLog.create({ data: { userId, action, entity, description } });
  } catch {
    // logging failure never blocks the main operation
  }
}

