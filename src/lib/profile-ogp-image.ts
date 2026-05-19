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
const TEXT_MAX_WIDTH = 560;
const TEXT_BLOCK_OFFSET_Y = 16;

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
    document.fonts.load(`400 72px ${BODY_FONT}`),
    document.fonts.load(`400 64px ${TITLE_FONT}`),
    document.fonts.load(`700 54px ${TITLE_FONT}`),
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
  const words = text.trim().split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";
  let overflowed = false;

  const pushSegment = (segment: string) => {
    if (overflowed) return;

    const nextLine = `${currentLine}${segment}`;
    if (!currentLine || context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    if (lines.length >= maxLines - 1) {
      lines.push(appendEllipsis(context, currentLine.trimEnd(), maxWidth));
      currentLine = "";
      overflowed = true;
      return;
    }

    lines.push(currentLine.trimEnd());
    currentLine = segment.trimStart();
  };

  for (const word of words.length > 0 ? words : [text]) {
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

  if (currentLine && lines.length >= maxLines) {
    overflowed = true;
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

  const avatarFrameSize = 450;
  const avatarImageSize = 386;
  const avatarOffsetX = 36;
  const avatarFrameX = leftColumnCenterX + avatarOffsetX - avatarFrameSize / 2;
  const avatarFrameY = columnCenterY - avatarFrameSize / 2;
  const avatarImageX = avatarFrameX + (avatarFrameSize - avatarImageSize) / 2;
  const avatarImageY = avatarFrameY + (avatarFrameSize - avatarImageSize) / 2;
  const iconImageUrl = icon ? getImageUrl(icon) : null;
  const iconImage = iconImageUrl ? await loadImage(iconImageUrl) : null;
  if (iconImage) {
    drawRoundImage(context, iconImage, avatarImageX, avatarImageY, avatarImageSize);
  } else {
    await drawAvatarPlaceholder(context, avatarImageX, avatarImageY, avatarImageSize);
  }

  const avatarFrame = await loadImage(iconFrameSvg);
  if (avatarFrame) {
    context.drawImage(avatarFrame, avatarFrameX, avatarFrameY, avatarFrameSize, avatarFrameSize);
  }

  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = INK_COLOR;
  const textOffsetX = -32;
  const textCenterX = rightColumnCenterX + textOffsetX;
  const nameFontSize = 72;
  const nameLineHeight = 78;
  const nameFont = `400 ${nameFontSize}px ${BODY_FONT}`;
  context.font = nameFont;
  const nameLines = wrapText(context, name, TEXT_MAX_WIDTH, 2);

  const publicIdFontSize = fitText(context, `@${publicId}`, TEXT_MAX_WIDTH, 60, "400", TITLE_FONT);
  const publicIdTopGap = 24;
  const textBlockHeight = nameLines.length * nameLineHeight + publicIdTopGap + publicIdFontSize;
  const textBlockTop = columnCenterY - textBlockHeight / 2 + TEXT_BLOCK_OFFSET_Y;
  const nameStartY = textBlockTop + nameFontSize;

  const brandIcon = await loadImage(BRAND_ICON_SRC);
  if (brandIcon) {
    const brandIconSize = 52;
    const brandIconBottomGap = 34;
    context.drawImage(
      brandIcon,
      textCenterX - brandIconSize / 2,
      textBlockTop - brandIconBottomGap - brandIconSize,
      brandIconSize,
      brandIconSize,
    );
  }

  context.font = nameFont;
  nameLines.forEach((line, index) => {
    context.fillText(line, textCenterX, nameStartY + index * nameLineHeight);
  });

  context.fillStyle = MUTED_COLOR;
  context.font = `400 ${publicIdFontSize}px ${TITLE_FONT}`;
  context.fillText(
    `@${publicId}`,
    textCenterX,
    nameStartY + (nameLines.length - 1) * nameLineHeight + publicIdTopGap + publicIdFontSize,
  );

  const dataUrl = canvas.toDataURL(jpegContentType, OGP_QUALITY);
  if (!dataUrl.startsWith(`data:${jpegContentType}`)) {
    throw new Error("このブラウザはOGP画像の保存形式に対応していません");
  }

  return dataUrlToFile(dataUrl, `ogp.${jpegExtension}`);
};
