import { createCanvas, loadImage, registerFont } from "canvas";
import axios from "axios";
import { Vibrant } from "node-vibrant/node";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Montserrat fonts
try {
  registerFont(path.join(__dirname, "fonts", "Montserrat-Bold.ttf"), {
    family: "Montserrat",
    weight: "bold",
  });
  registerFont(path.join(__dirname, "fonts", "Montserrat-Regular.ttf"), {
    family: "Montserrat",
    weight: "normal",
  });
  registerFont(path.join(__dirname, "fonts", "Montserrat-Italic.ttf"), {
    family: "Montserrat",
    weight: "normal",
    style: "italic",
  });
  console.log("✅ Montserrat fonts registered successfully");
} catch (error) {
  console.warn(
    "⚠️ Could not register Montserrat fonts, falling back to system fonts:",
    error.message
  );
}

// Register emoji fonts for Railway
try {
  // Try to register Noto Color Emoji font
  registerFont("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", {
    family: "Noto Color Emoji",
  });
  console.log("✅ Noto Color Emoji font registered successfully");
} catch (error) {
  console.warn("⚠️ Could not register Noto Color Emoji font:", error.message);
}

async function getVibrantWaveFill(imageBuffer) {
  const palette = await Vibrant.from(imageBuffer).getPalette();
  const vibrant = palette.Vibrant || palette.Muted;
  if (!vibrant) return "#FDC830";
  const [r, g, b] = vibrant.rgb;
  const avgBrightness = (r + g + b) / 3;
  return r > g && r > b
    ? "#FDBB2D"
    : avgBrightness < 120
    ? "#FFC107"
    : "#FDC830";
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

export async function generateAdImage2({
  imageUrl,
  headline = "🔥 Deal Time!",
  subtext = "Get yours today!",
  cta = "Order Now",
}) {
  const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const imageBuffer = imageRes.data;
  const bgImage = await loadImage(imageBuffer);

  const width = bgImage.width;
  const height = bgImage.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImage, 0, 0, width, height);

  const waveColor = await getVibrantWaveFill(imageBuffer);
  const waveHeight = height * 0.35;
  const waveTop = height - waveHeight;

  // Wave background
  ctx.beginPath();
  ctx.moveTo(0, waveTop);
  ctx.bezierCurveTo(
    width * 0.25,
    waveTop + 60,
    width * 0.75,
    waveTop - 60,
    width,
    waveTop + 40
  );
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = waveColor;
  ctx.fill();

  // Text styling
  ctx.fillStyle = "#1e1e1e";
  ctx.textBaseline = "top";

  const paddingX = width * 0.05;
  let cursorY = waveTop + 25;

  // Headline
  const headlineFontSize = Math.floor(height * 0.04);
  ctx.font = `bold ${headlineFontSize}px Montserrat, "Noto Color Emoji", Arial, sans-serif`;
  cursorY = wrapText(
    ctx,
    headline,
    paddingX,
    cursorY,
    width - paddingX * 2,
    headlineFontSize * 1.3
  );

  // Subtext
  const subFontSize = Math.floor(height * 0.03);
  ctx.font = `${subFontSize}px Montserrat, "Noto Color Emoji", Arial, sans-serif`;
  cursorY = wrapText(
    ctx,
    subtext,
    paddingX,
    cursorY + 10,
    width - paddingX * 2,
    subFontSize * 1.4
  );

  // CTA Button
  const btnFontSize = Math.floor(height * 0.03);
  ctx.font = `bold ${btnFontSize}px Montserrat, "Noto Color Emoji", Arial, sans-serif`;
  const textMetrics = ctx.measureText(cta);
  const btnPaddingX = 28;
  const btnPaddingY = 14;
  const btnWidth = textMetrics.width + btnPaddingX * 2;
  const btnHeight = btnFontSize + btnPaddingY * 2;
  const btnX = width - btnWidth - paddingX;
  const btnY = height - btnHeight - 20;
  const radius = 14;

  ctx.fillStyle = "#b30000";
  ctx.beginPath();
  ctx.moveTo(btnX + radius, btnY);
  ctx.lineTo(btnX + btnWidth - radius, btnY);
  ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + radius);
  ctx.lineTo(btnX + btnWidth, btnY + btnHeight - radius);
  ctx.quadraticCurveTo(
    btnX + btnWidth,
    btnY + btnHeight,
    btnX + btnWidth - radius,
    btnY + btnHeight
  );
  ctx.lineTo(btnX + radius, btnY + btnHeight);
  ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - radius);
  ctx.lineTo(btnX, btnY + radius);
  ctx.quadraticCurveTo(btnX, btnY, btnX + radius, btnY);
  ctx.closePath();
  ctx.fill();

  // CTA text
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(
    cta,
    btnX + (btnWidth - textMetrics.width) / 2,
    btnY + btnHeight / 2
  );

  return canvas.toBuffer("image/jpeg");
}
