import type { Db } from "../../infra/db";
import {
  findRoomByUserId,
  incrementTowerNextFloor,
  insertRoom,
} from "../../infra/db/roomsRepo";

export const DEFAULT_TOWER_ID = 1;

export async function allocateRoom(db: Db, userId: string, towerId = DEFAULT_TOWER_ID) {
  const existing = await findRoomByUserId(db, userId);
  if (existing) return existing;

  const updated = await incrementTowerNextFloor(db, towerId);

  if (!updated) throw new Error(`Tower ${towerId} not found`);

  const inserted = await insertRoom(db, {
    userId,
    towerId,
    floor: updated.floor,
    bio: "",
  });

  return inserted;
}
