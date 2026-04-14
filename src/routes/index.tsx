import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { asc, eq } from "drizzle-orm";
import { getDb } from "~/server/infra/db";
import { createTursoClient } from "~/server/infra/db/client";
import { rooms, towers, users } from "~/server/infra/db/schema";

export const useTowers = routeLoader$(async (ev) => {
  const env = ev.platform?.env as Env | undefined;
  if (!env?.TURSO_DATABASE_URL) return [];
  const db = getDb(createTursoClient(env));

  const towerRows = await db.select().from(towers).orderBy(asc(towers.id)).all();

  return Promise.all(
    towerRows.map(async (tower) => {
      const roomRows = await db
        .select({
          floor: rooms.floor,
          bio: rooms.bio,
          userName: users.name,
          userEmail: users.email,
        })
        .from(rooms)
        .leftJoin(users, eq(users.id, rooms.userId))
        .where(eq(rooms.towerId, tower.id))
        .orderBy(asc(rooms.floor))
        .all();
      return { tower, rooms: roomRows };
    }),
  );
});

export default component$(() => {
  const data = useTowers();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Bio Tower</h1>
      {data.value.length === 0 && <p>塔がまだありません。</p>}
      {data.value.map(({ tower, rooms }) => (
        <section key={tower.id} style={{ marginBottom: "2rem" }}>
          <h2>
            {tower.name} <small>(next floor: {tower.nextFloor})</small>
          </h2>
          {rooms.length === 0 ? (
            <p>まだ住人がいません。</p>
          ) : (
            <ul>
              {rooms.map((r) => (
                <li key={r.floor}>
                  <strong>{r.floor}F</strong> — {r.userName ?? r.userEmail ?? "(no name)"}
                  {r.bio ? `: ${r.bio}` : " (bio未設定)"}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
});

export const head: DocumentHead = {
  title: "Bio Tower",
  meta: [{ name: "description", content: "Bioが積み上がる塔" }],
};
