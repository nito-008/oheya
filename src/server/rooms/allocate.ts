import { eq, sql } from "drizzle-orm";
import type { Db } from "../db";
import { rooms, towers } from "../db/schema";

export const DEFAULT_TOWER_ID = 1;

export async function allocateRoom(db: Db, userId: string, towerId = DEFAULT_TOWER_ID) {
  const existing = await db.select().from(rooms).where(eq(rooms.userId, userId)).get();
  if (existing) return existing;

  const updated = await db
    .update(towers)
    .set({ nextFloor: sql`${towers.nextFloor} + 1` })
    .where(eq(towers.id, towerId))
    .returning({ floor: sql<number>`${towers.nextFloor} - 1` })
    .get();

  if (!updated) throw new Error(`Tower ${towerId} not found`);

  const inserted = await db
    .insert(rooms)
    .values({ userId, towerId, floor: updated.floor, bio: "" })
    .returning()
    .get();

  return inserted;
}
