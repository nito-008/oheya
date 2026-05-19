import { jpegContentType, jpegExtension } from "~/lib/canvas-image";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import { getImageUrl } from "~/schema/image";

const OGP_WIDTH = 1200;
const OGP_HEIGHT = 630;
const OGP_QUALITY = 0.9;
const BACKGROUND_COLOR = "#ffffff";
const INK_COLOR = "#222222";
const MUTED_COLOR = "#6f6a5f";
const BRAND_ICON_SRC = "/favicon.svg";
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

type ProfileOgpImageOptions = {
  icon: string | null;
  name: string;
  publicId: string;
};

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

const loadProfileFonts = async () => {
  await Promise.all([
    document.fonts.load(`400 ${NAME_FONT_SIZE}px ${BODY_FONT}`),
    document.fonts.load(`400 64px ${TITLE_FONT}`),
    document.fonts.load(`400 ${PUBLIC_ID_MAX_FONT_SIZE}px ${TITLE_FONT}`),
  ]);
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

  const placeholderImage = await loadImage(iconPlaceholderSvg);
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

const appendEllipsis = (context: CanvasRenderingContext2D, line: string, maxWidth: number) => {
  const ellipsis = "…";
  if (context.measureText(`${line}${ellipsis}`).width <= maxWidth) return `${line}${ellipsis}`;

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

const dataUrlToFile = async (dataUrl: string, filename: string) => {
  const blob = await fetch(dataUrl).then((response) => response.blob());
  return new File([blob], filename, { type: jpegContentType });
};

export const createProfileOgpImageFile = async ({
  icon,
  name,
  publicId,
}: ProfileOgpImageOptions) => {
  const canvas = document.createElement("canvas");
  canvas.width = OGP_WIDTH;
  canvas.height = OGP_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("OGP画像を生成できませんでした");
  }

  await loadProfileFonts();

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
  const iconImageUrl = icon ? getImageUrl(icon) : null;
  const iconImage = iconImageUrl ? await loadImage(iconImageUrl) : null;
  if (iconImage) {
    drawRoundImage(context, iconImage, avatarImageX, avatarImageY, AVATAR_IMAGE_SIZE);
  } else {
    await drawAvatarPlaceholder(context, avatarImageX, avatarImageY, AVATAR_IMAGE_SIZE);
  }

  const avatarFrame = await loadImage(iconFrameSvg);
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
  const nameLines = wrapText(context, name, TEXT_MAX_WIDTH, 2);

  const publicIdFontSize = fitText(
    context,
    `@${publicId}`,
    TEXT_MAX_WIDTH,
    PUBLIC_ID_MAX_FONT_SIZE,
    "400",
    TITLE_FONT,
  );
  const textBlockHeight =
    nameLines.length * NAME_LINE_HEIGHT + PUBLIC_ID_TOP_GAP + publicIdFontSize;
  const textBlockTop = columnCenterY - textBlockHeight / 2 + TEXT_BLOCK_OFFSET_Y;
  const nameStartY = textBlockTop + NAME_FONT_SIZE;

  const brandIcon = await loadImage(BRAND_ICON_SRC);
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
    `@${publicId}`,
    textCenterX,
    nameStartY +
      (nameLines.length - 1) * NAME_LINE_HEIGHT +
      PUBLIC_ID_TOP_GAP +
      publicIdFontSize,
  );

  const dataUrl = canvas.toDataURL(jpegContentType, OGP_QUALITY);
  if (!dataUrl.startsWith(`data:${jpegContentType}`)) {
    throw new Error("このブラウザはOGP画像の保存形式に対応していません");
  }

  return dataUrlToFile(dataUrl, `ogp.${jpegExtension}`);
};
