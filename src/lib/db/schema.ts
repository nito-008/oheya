import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const profiles = sqliteTable(
  "profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    publicId: text("public_id").notNull(),
    name: text("name").notNull(),
    icon: text("icon"),
    ogp: text("ogp"),
  },
  (profile) => [uniqueIndex("profile_public_id_lower_unique").on(sql`lower(${profile.publicId})`)],
);

export const images = sqliteTable(
  "image",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    byteSize: integer("byte_size").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (image) => [index("image_user_id_idx").on(image.userId)],
);

export const albumPhotos = sqliteTable(
  "album_photo",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (albumPhoto) => [
    uniqueIndex("album_photo_user_id_position_unique").on(albumPhoto.userId, albumPhoto.position),
    index("album_photo_image_id_idx").on(albumPhoto.imageId),
  ],
);

export const music = sqliteTable(
  "music",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: text("track_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    artworkUrl: text("artwork_url"),
    previewUrl: text("preview_url"),
    trackViewUrl: text("track_view_url"),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (music) => [
    uniqueIndex("music_user_id_position_unique").on(music.userId, music.position),
    index("music_user_id_idx").on(music.userId),
  ],
);

export const profilesRelations = relations(profiles, ({ many }) => ({
  musics: many(music),
}));

export const musicRelations = relations(music, ({ one }) => ({
  profile: one(profiles, {
    fields: [music.userId],
    references: [profiles.userId],
  }),
}));

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);
