import { vValidator } from "@hono/valibot-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "~/hono/middleware/auth";
import type { Bindings } from "~/hono/types";
import { getDb } from "~/lib/db";
import { profiles } from "~/lib/db/schema";
import { type MusicTrack, musicSelectionSchema } from "~/schema/music";
import { userSchema } from "~/schema/user";

const musicSelection = {
  id: profiles.musicTrackId,
  title: profiles.musicTitle,
  artist: profiles.musicArtist,
  artworkUrl: profiles.musicArtworkUrl,
  previewUrl: profiles.musicPreviewUrl,
  trackViewUrl: profiles.musicTrackViewUrl,
} as const;

type MusicSelectionRow = {
  id: string | null;
  title: string | null;
  artist: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
  trackViewUrl: string | null;
};

const toMusicTrack = (row: MusicSelectionRow): MusicTrack | null => {
  if (!row.id || !row.title || !row.artist) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artworkUrl: row.artworkUrl ?? null,
    previewUrl: row.previewUrl ?? null,
    trackViewUrl: row.trackViewUrl ?? null,
  };
};

export const usersRouter = new Hono<{ Bindings: Bindings }>()
  .get("/me", authMiddleware, async (c) => {
    const userId = c.var.userId;
    const db = getDb(c.env);
    const [row] = await db
      .select({
        publicId: profiles.publicId,
        name: profiles.name,
        icon: profiles.icon,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({
      publicId: row.publicId,
      name: row.name,
      icon: row.icon,
    });
  })
  .get("/me/music", authMiddleware, async (c) => {
    const userId = c.var.userId;
    const db = getDb(c.env);
    const [row] = await db.select(musicSelection).from(profiles).where(eq(profiles.userId, userId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({ track: toMusicTrack(row) });
  })
  .patch("/me/music", authMiddleware, vValidator("json", musicSelectionSchema), async (c) => {
    const userId = c.var.userId;
    const { track } = c.req.valid("json");
    const db = getDb(c.env);
    const [profile] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    if (!profile) {
      return c.json({ message: "User not found" } as const, 404);
    }

    await db
      .update(profiles)
      .set({
        musicTrackId: track?.id ?? null,
        musicTitle: track?.title ?? null,
        musicArtist: track?.artist ?? null,
        musicArtworkUrl: track?.artworkUrl ?? null,
        musicPreviewUrl: track?.previewUrl ?? null,
        musicTrackViewUrl: track?.trackViewUrl ?? null,
      })
      .where(eq(profiles.userId, userId));

    return c.body(null, 204);
  })
  .get("/:publicId", async (c) => {
    const publicId = c.req.param("publicId");
    const db = getDb(c.env);
    const [row] = await db
      .select({
        publicId: profiles.publicId,
        name: profiles.name,
        icon: profiles.icon,
      })
      .from(profiles)
      .where(eq(profiles.publicId, publicId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({
      publicId: row.publicId,
      name: row.name,
      icon: row.icon,
    });
  })
  .get("/:publicId/music", async (c) => {
    const publicId = c.req.param("publicId");
    const db = getDb(c.env);
    const [row] = await db
      .select(musicSelection)
      .from(profiles)
      .where(eq(profiles.publicId, publicId));
    if (!row) {
      return c.json({ message: "User not found" } as const, 404);
    }
    return c.json({ track: toMusicTrack(row) });
  })
  .patch("/me", authMiddleware, vValidator("json", userSchema), async (c) => {
    const userId = c.var.userId;
    const values = c.req.valid("json");
    const db = getDb(c.env);
    const [profile] = await db
      .select({ userId: profiles.userId, icon: profiles.icon })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const [existing] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.publicId, values.publicId));
    if (existing && existing.userId !== userId) {
      return c.json({ message: "User ID already exists" } as const, 409);
    }

    const icon = values.icon || null;

    const profileValues = {
      publicId: values.publicId,
      name: values.name,
      icon,
    };

    if (profile) {
      await db.update(profiles).set(profileValues).where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId,
        ...profileValues,
      });
    }

    if (profile?.icon && profile.icon !== icon) {
      await c.env.R2_BUCKET.delete(profile.icon);
    }

    return c.body(null, 204);
  });
