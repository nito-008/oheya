import { eq, sql } from "drizzle-orm";
import type { Db } from "./index";
import { rooms, towers } from "./schema";

export async function findRoomByUserId(db: Db, userId: string) {
  return db.select().from(rooms).where(eq(rooms.userId, userId)).get();
}

export async function incrementTowerNextFloor(db: Db, towerId: number) {
  return db
    .update(towers)
    .set({ nextFloor: sql`${towers.nextFloor} + 1` })
    .where(eq(towers.id, towerId))
    .returning({ floor: sql<number>`${towers.nextFloor} - 1` })
    .get();
}

export async function insertRoom(
  db: Db,
  values: { userId: string; towerId: number; floor: number; bio: string },
) {
  return db.insert(rooms).values(values).returning().get();
}
