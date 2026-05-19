import { createClient } from "@libsql/client";
import { chromium, type Browser, type Page } from "playwright";
import { and, asc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import * as schema from "../src/lib/db/schema.ts";

type ProfileRow = {
  userId: string;
  publicId: string;
  name: string;
  icon: string | null;
};

type Options = {
  appOrigin: string;
  apply: boolean;
  bucket: string;
  chromiumExecutablePath: string | null;
  limit: number;
  publicId: string | null;
};

const jpegContentType = "image/jpeg";
const envFilePath = ".env.prod.local";
const defaultLimit = 20;
const defaultBucket = "oheya";

const usage = `Usage:
  vp run ogp:backfill -- [--apply] [--limit 20] [--public-id USER_ID] [--app-origin URL] [--bucket BUCKET] [--chromium-executable-path PATH]

Examples:
  vp run ogp:backfill -- --limit 5
  vp run ogp:backfill -- --apply --limit 20

The script loads production credentials from ${envFilePath}.
Set OHEYA_CHROMIUM_EXECUTABLE_PATH when Playwright's bundled browser is unavailable.
The script is dry-run by default. Pass --apply to write images to R2 and update the database.`;

const loadEnvFile = async (path: string, options: { required?: boolean } = {}) => {
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch {
    if (options.required) {
      throw new Error(`${path} is required`);
    }
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    const value = rawValue
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .replace(/\\n/g, "\n");
    process.env[key] = value;
  }
};

const parseArgs = (argv: string[]): Options => {
  const options: Options = {
    appOrigin: process.env.OHEYA_APP_ORIGIN ?? "",
    apply: false,
    bucket: process.env.OHEYA_R2_BUCKET ?? defaultBucket,
    chromiumExecutablePath: process.env.OHEYA_CHROMIUM_EXECUTABLE_PATH ?? null,
    limit: Number(process.env.OHEYA_OGP_BACKFILL_LIMIT ?? defaultLimit),
    publicId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      return value;
    };

    if (arg === "--") {
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    }
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.apply = false;
      continue;
    }
    if (arg === "--limit") {
      options.limit = Number(next());
      continue;
    }
    if (arg === "--public-id") {
      options.publicId = next();
      continue;
    }
    if (arg === "--app-origin") {
      options.appOrigin = next();
      continue;
    }
    if (arg === "--bucket") {
      options.bucket = next();
      continue;
    }
    if (arg === "--chromium-executable-path") {
      options.chromiumExecutablePath = next();
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error("--limit must be a positive integer");
  }
  if (!options.appOrigin) {
    throw new Error("OHEYA_APP_ORIGIN is required in .env.prod.local or via --app-origin");
  }

  options.appOrigin = options.appOrigin.replace(/\/+$/, "");
  return options;
};

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
};

const toDataUrl = (contentType: string, bytes: Buffer) =>
  `data:${contentType};base64,${bytes.toString("base64")}`;

const createRenderer = async (browser: Browser, appOrigin: string) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`${appOrigin}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    (globalThis as unknown as { __name?: <T>(value: T) => T }).__name = (value) => value;
  });
  await page.addStyleTag({
    content: `
      @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap");
      @font-face {
        font-family: "Uzura";
        src: url("${appOrigin}/fonts/uzura.ttf") format("truetype");
        font-display: swap;
      }
    `,
  });

  const [iconFrame, iconPlaceholder, brandIcon] = await Promise.all([
    readFile(resolve("src/media/icon-frame.svg")),
    readFile(resolve("src/media/icon-placeholder.svg")),
    readFile(resolve("public/favicon.svg")),
  ]);

  return {
    page,
    assets: {
      brandIcon: toDataUrl("image/svg+xml", brandIcon),
      iconFrame: toDataUrl("image/svg+xml", iconFrame),
      iconPlaceholder: toDataUrl("image/svg+xml", iconPlaceholder),
    },
  };
};

const createProfileOgpJpeg = async (
  page: Page,
  assets: { brandIcon: string; iconFrame: string; iconPlaceholder: string },
  profile: ProfileRow,
) => {
  const bytes = await page.evaluate(
    async ({ assets, profile }) => {
      const OGP_WIDTH = 1200;
      const OGP_HEIGHT = 630;
      const OGP_QUALITY = 0.9;
      const BACKGROUND_COLOR = "#ffffff";
      const INK_COLOR = "#222222";
      const MUTED_COLOR = "#6f6a5f";
      const BODY_FONT = `"Uzura", "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", sans-serif`;
      const TITLE_FONT = `"Caveat", ${BODY_FONT}, cursive`;
      const TEXT_MAX_WIDTH = 520;
      const TEXT_BLOCK_OFFSET_Y = 16;
      const AVATAR_FRAME_SIZE = 470;
      const AVATAR_IMAGE_SIZE = 404;
      const AVATAR_OFFSET_X = 32;
      const NAME_FONT_SIZE = 82;
      const NAME_LINE_HEIGHT = 90;
      const PUBLIC_ID_MAX_FONT_SIZE = 60;
      const PUBLIC_ID_TOP_GAP = 24;
      const BRAND_ICON_SIZE = 68;
      const BRAND_ICON_BOTTOM_GAP = 30;

      const loadImage = (src: string) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.addEventListener("load", () => resolve(image), { once: true });
          image.addEventListener("error", () => resolve(null), { once: true });
          image.src = src;
        });

      const drawRoundImage = (
        context: CanvasRenderingContext2D,
        image: HTMLImageElement,
        x: number,
        y: number,
        size: number,
      ) => {
        const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;

        context.save();
        context.beginPath();
        context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        context.clip();
        context.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height);
        context.restore();
      };

      const drawAvatarPlaceholder = async (
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
      ) => {
        context.save();
        context.beginPath();
        context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        context.clip();
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(x, y, size, size);

        const checkerSize = size / 6.6;
        context.fillStyle = "rgb(47 47 47 / 0.08)";
        for (let row = -1; row < 8; row += 1) {
          for (let column = -1; column < 8; column += 1) {
            if ((row + column) % 2 === 0) {
              context.fillRect(
                x + column * checkerSize,
                y + row * checkerSize,
                checkerSize,
                checkerSize,
              );
            }
          }
        }

        const placeholderImage = await loadImage(assets.iconPlaceholder);
        if (placeholderImage) {
          const placeholderSize = size * 0.7;
          context.globalAlpha = 0.8;
          context.drawImage(
            placeholderImage,
            x + (size - placeholderSize) / 2,
            y + (size - placeholderSize) / 2,
            placeholderSize,
            placeholderSize,
          );
        }
        context.restore();
      };

      const getTextSegments = (text: string) => {
        if ("Segmenter" in Intl) {
          const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
          return [...segmenter.segment(text)].map((segment) => segment.segment);
        }

        return Array.from(text);
      };

      const truncateLine = (context: CanvasRenderingContext2D, line: string, maxWidth: number) => {
        if (context.measureText(line).width <= maxWidth) return line;

        const ellipsis = "…";
        const segments = getTextSegments(line);
        while (segments.length > 0) {
          segments.pop();
          const nextLine = `${segments.join("")}${ellipsis}`;
          if (context.measureText(nextLine).width <= maxWidth) return nextLine;
        }

        return ellipsis;
      };

      const appendEllipsis = (
        context: CanvasRenderingContext2D,
        line: string,
        maxWidth: number,
      ) => {
        const ellipsis = "…";
        if (context.measureText(`${line}${ellipsis}`).width <= maxWidth) {
          return `${line}${ellipsis}`;
        }

        return truncateLine(context, `${line}${ellipsis}`, maxWidth);
      };

      const wrapText = (
        context: CanvasRenderingContext2D,
        text: string,
        maxWidth: number,
        maxLines: number,
      ) => {
        const trimmedText = text.trim();
        const words = trimmedText.split(/(\s+)/).filter(Boolean);
        const lines: string[] = [];
        let currentLine = "";
        let overflowed = false;

        const pushSegment = (segment: string) => {
          if (overflowed) return;

          const hasVisibleText = segment.trim().length > 0;
          if (!hasVisibleText && !currentLine) return;

          const nextLine = `${currentLine}${segment}`;
          if (!currentLine || context.measureText(nextLine).width <= maxWidth) {
            currentLine = nextLine;
            return;
          }

          if (!hasVisibleText) return;

          if (lines.length >= maxLines - 1) {
            lines.push(currentLine.trimEnd());
            currentLine = segment.trimStart();
            overflowed = true;
            return;
          }

          lines.push(currentLine.trimEnd());
          currentLine = segment.trimStart();
        };

        for (const word of words.length > 0 ? words : [trimmedText]) {
          if (context.measureText(word).width <= maxWidth) {
            pushSegment(word);
            continue;
          }

          for (const segment of getTextSegments(word)) {
            pushSegment(segment);
          }
        }

        if (currentLine && lines.length < maxLines) {
          lines.push(currentLine.trimEnd());
        }

        if (overflowed && lines.length > 0) {
          lines[lines.length - 1] = appendEllipsis(context, lines[lines.length - 1], maxWidth);
        }

        return lines.length > 0 ? lines : [""];
      };

      const fitText = (
        context: CanvasRenderingContext2D,
        text: string,
        maxWidth: number,
        fontSize: number,
        fontWeight = "400",
        fontFamily = BODY_FONT,
      ) => {
        const previousFont = context.font;
        let nextFontSize = fontSize;
        do {
          context.font = `${fontWeight} ${nextFontSize}px ${fontFamily}`;
          if (context.measureText(text).width <= maxWidth) {
            context.font = previousFont;
            return nextFontSize;
          }
          nextFontSize -= 4;
        } while (nextFontSize > 40);

        context.font = previousFont;
        return nextFontSize;
      };

      const canvas = document.createElement("canvas");
      canvas.width = OGP_WIDTH;
      canvas.height = OGP_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context is unavailable");

      await Promise.all([
        document.fonts.load(`400 ${NAME_FONT_SIZE}px ${BODY_FONT}`),
        document.fonts.load(`400 64px ${TITLE_FONT}`),
        document.fonts.load(`400 ${PUBLIC_ID_MAX_FONT_SIZE}px ${TITLE_FONT}`),
      ]);

      context.fillStyle = BACKGROUND_COLOR;
      context.fillRect(0, 0, OGP_WIDTH, OGP_HEIGHT);

      const columnWidth = OGP_WIDTH / 2;
      const leftColumnCenterX = columnWidth / 2;
      const rightColumnCenterX = columnWidth + columnWidth / 2;
      const columnCenterY = OGP_HEIGHT / 2;

      const avatarFrameX = leftColumnCenterX + AVATAR_OFFSET_X - AVATAR_FRAME_SIZE / 2;
      const avatarFrameY = columnCenterY - AVATAR_FRAME_SIZE / 2;
      const avatarImageX = avatarFrameX + (AVATAR_FRAME_SIZE - AVATAR_IMAGE_SIZE) / 2;
      const avatarImageY = avatarFrameY + (AVATAR_FRAME_SIZE - AVATAR_IMAGE_SIZE) / 2;
      const iconImageUrl = profile.icon ? `/api/images/${profile.icon}` : null;
      const iconImage = iconImageUrl ? await loadImage(iconImageUrl) : null;
      if (iconImage) {
        drawRoundImage(context, iconImage, avatarImageX, avatarImageY, AVATAR_IMAGE_SIZE);
      } else {
        await drawAvatarPlaceholder(context, avatarImageX, avatarImageY, AVATAR_IMAGE_SIZE);
      }

      const avatarFrame = await loadImage(assets.iconFrame);
      if (avatarFrame) {
        context.drawImage(
          avatarFrame,
          avatarFrameX,
          avatarFrameY,
          AVATAR_FRAME_SIZE,
          AVATAR_FRAME_SIZE,
        );
      }

      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      context.fillStyle = INK_COLOR;
      const textOffsetX = -32;
      const textCenterX = rightColumnCenterX + textOffsetX;
      const nameFont = `400 ${NAME_FONT_SIZE}px ${BODY_FONT}`;
      context.font = nameFont;
      const nameLines = wrapText(context, profile.name, TEXT_MAX_WIDTH, 2);

      const publicIdFontSize = fitText(
        context,
        `@${profile.publicId}`,
        TEXT_MAX_WIDTH,
        PUBLIC_ID_MAX_FONT_SIZE,
        "400",
        TITLE_FONT,
      );
      const textBlockHeight =
        nameLines.length * NAME_LINE_HEIGHT + PUBLIC_ID_TOP_GAP + publicIdFontSize;
      const textBlockTop = columnCenterY - textBlockHeight / 2 + TEXT_BLOCK_OFFSET_Y;
      const nameStartY = textBlockTop + NAME_FONT_SIZE;

      const brandIcon = await loadImage(assets.brandIcon);
      if (brandIcon) {
        context.drawImage(
          brandIcon,
          textCenterX - BRAND_ICON_SIZE / 2,
          textBlockTop - BRAND_ICON_BOTTOM_GAP - BRAND_ICON_SIZE,
          BRAND_ICON_SIZE,
          BRAND_ICON_SIZE,
        );
      }

      context.font = nameFont;
      nameLines.forEach((line, index) => {
        context.fillText(line, textCenterX, nameStartY + index * NAME_LINE_HEIGHT);
      });

      context.fillStyle = MUTED_COLOR;
      context.font = `400 ${publicIdFontSize}px ${TITLE_FONT}`;
      context.fillText(
        `@${profile.publicId}`,
        textCenterX,
        nameStartY +
          (nameLines.length - 1) * NAME_LINE_HEIGHT +
          PUBLIC_ID_TOP_GAP +
          publicIdFontSize,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", OGP_QUALITY),
      );
      if (!blob) throw new Error("Failed to encode OGP JPEG");

      return [...new Uint8Array(await blob.arrayBuffer())];
    },
    { assets, profile },
  );

  return Buffer.from(bytes);
};

const runWrangler = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn("wrangler", args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`wrangler ${args.join(" ")} failed with exit code ${code}`));
    });
  });

const putR2Object = async (bucket: string, key: string, content: Buffer) => {
  const dir = await mkdtemp(join(tmpdir(), "oheya-ogp-"));
  const path = join(dir, "ogp.jpg");
  try {
    await writeFile(path, content);
    await runWrangler([
      "r2",
      "object",
      "put",
      `${bucket}/${key}`,
      "--file",
      path,
      "--content-type",
      jpegContentType,
      "--remote",
      "--force",
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const deleteR2Object = (bucket: string, key: string) =>
  runWrangler(["r2", "object", "delete", `${bucket}/${key}`, "--remote", "--force"]);

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    parseArgs(argv);
  }

  await loadEnvFile(resolve(envFilePath), { required: true });

  const options = parseArgs(argv);
  const db = drizzle(
    createClient({
      url: requireEnv("TURSO_DATABASE_URL"),
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    { schema },
  );

  const conditions = [isNull(schema.profiles.ogp)];
  if (options.publicId) {
    conditions.push(eq(schema.profiles.publicId, options.publicId));
  }

  const targets = await db
    .select({
      userId: schema.profiles.userId,
      publicId: schema.profiles.publicId,
      name: schema.profiles.name,
      icon: schema.profiles.icon,
    })
    .from(schema.profiles)
    .where(and(...conditions))
    .orderBy(asc(schema.profiles.userId))
    .limit(options.limit);

  if (targets.length === 0) {
    console.log("No profiles need OGP backfill.");
    return;
  }

  console.log(
    `${options.apply ? "Applying" : "Dry-run"} OGP backfill for ${targets.length} profile(s).`,
  );

  const browser = await chromium.launch({
    executablePath: options.chromiumExecutablePath ?? undefined,
  });
  const { page, assets } = await createRenderer(browser, options.appOrigin);
  try {
    for (const target of targets) {
      const imageId = crypto.randomUUID();
      const objectKey = `${target.userId}/${imageId}`;
      const jpeg = await createProfileOgpJpeg(page, assets, target);
      console.log(`- ${target.publicId}: generated ${jpeg.byteLength} bytes`);

      if (!options.apply) continue;

      await putR2Object(options.bucket, objectKey, jpeg);
      try {
        await db.transaction(async (tx) => {
          await tx.insert(schema.images).values({
            id: imageId,
            userId: target.userId,
            byteSize: jpeg.byteLength,
          });

          const updated = await tx
            .update(schema.profiles)
            .set({ ogp: imageId })
            .where(and(eq(schema.profiles.userId, target.userId), isNull(schema.profiles.ogp)))
            .returning({ userId: schema.profiles.userId });

          if (updated.length === 0) {
            throw new Error(`Profile already has OGP: ${target.publicId}`);
          }
        });
      } catch (error) {
        await deleteR2Object(options.bucket, objectKey);
        throw error;
      }

      console.log(`  saved ${imageId}`);
    }
  } finally {
    await browser.close();
  }

  if (!options.apply) {
    console.log("Dry-run complete. Re-run with --apply to write R2 and DB changes.");
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
