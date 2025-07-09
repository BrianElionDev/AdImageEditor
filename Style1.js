import { createCanvas, loadImage, registerFont } from "canvas";
import axios from "axios";
import {Vibrant} from "node-vibrant/node";
import path from "path";

// Register custom Montserrat fonts
registerFont(path.join("fonts", "Montserrat-Regular.ttf"), { family: "Montserrat" });
registerFont(path.join("fonts", "Montserrat-Bold.ttf"), { family: "Montserrat", weight: "bold" });
registerFont(path.join("fonts", "Montserrat-Italic.ttf"), { family: "Montserrat", style: "italic" });

async function getVibrantWaveFill(imageBuffer) {
  const palette = await Vibrant.from(imageBuffer).getPalette();
  const vibrant = palette.Vibrant || palette.Muted;

  if (!vibrant) return "#FDC830";
  const [r, g, b] = vibrant.rgb;
  const avg = (r + g + b) / 3;

  return r > g && r > b ? "#FDBB2D" : avg < 120 ? "#FFC107" : "#FDC830";
}

export async function generateAdImage({
  imageUrl,
  logoUrl,
  headline = "🔥 Deal Time! Best Prices Ever!",
  subtext = "Get 37% OFF premium cuts — Limited Time Only!",
  cta = "Order Now",
}) {
  const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
  const bgImage = await loadImage(imageBuffer);

  const logoBuffer = logoUrl
    ? (await axios.get(logoUrl, { responseType: "arraybuffer" })).data
    : null;
  const logoImage = logoBuffer ? await loadImage(logoBuffer) : null;

  const width = bgImage.width;
  const height = bgImage.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImage, 0, 0, width, height);

  // Dynamic wave color
  const waveColor = await getVibrantWaveFill(imageBuffer);
  const waveHeight = height * 0.3;
  const waveTop = height - waveHeight;

  // Draw wave
  ctx.beginPath();
  ctx.moveTo(0, waveTop);
  ctx.bezierCurveTo(
    width * 0.25, waveTop + 60,
    width * 0.75, waveTop - 60,
    width, waveTop + 40
  );
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = waveColor;
  ctx.fill();

  // Text padding and layout
  const paddingX = width * 0.05;
  let cursorY = waveTop + 25;

  // Text styles
  ctx.textBaseline = "top";
  ctx.fillStyle = "#1e1e1e";

  // Draw logo
  if (logoImage) {
    const logoSize = waveHeight * 0.2;
    ctx.drawImage(logoImage, paddingX, cursorY, logoSize, logoSize);
    cursorY += logoSize + 10;
  }

  // Draw headline (multi-line support)
  const headlineFontSize = Math.floor(height * 0.035);
  ctx.font = `bold ${headlineFontSize}px Montserrat`;
  const headlineLines = wrapText(ctx, headline, width * 0.6);
  for (const line of headlineLines) {
    ctx.fillText(line, paddingX, cursorY);
    cursorY += headlineFontSize + 4;
  }

  // Subtext
  const subtextFontSize = Math.floor(height * 0.027);
  ctx.font = `italic ${subtextFontSize}px Montserrat`;
  const subtextLines = wrapText(ctx, subtext, width * 0.6);
  for (const line of subtextLines) {
    ctx.fillText(line, paddingX, cursorY);
    cursorY += subtextFontSize + 3;
  }

  // CTA button
  const btnPadding = 24;
  const btnFontSize = Math.floor(height * 0.028);
  ctx.font = `bold ${btnFontSize}px Montserrat`;
  const textWidth = ctx.measureText(cta).width;

  const btnWidth = textWidth + btnPadding * 2;
  const btnHeight = btnFontSize * 1.8;
  const btnX = width - btnWidth - paddingX;
  const btnY = height - btnHeight - 20;

  const radius = 12;
  ctx.fillStyle = "#b30000";
  ctx.beginPath();
  ctx.moveTo(btnX + radius, btnY);
  ctx.lineTo(btnX + btnWidth - radius, btnY);
  ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + radius);
  ctx.lineTo(btnX + btnWidth, btnY + btnHeight - radius);
  ctx.quadraticCurveTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - radius, btnY + btnHeight);
  ctx.lineTo(btnX + radius, btnY + btnHeight);
  ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - radius);
  ctx.lineTo(btnX, btnY + radius);
  ctx.quadraticCurveTo(btnX, btnY, btnX + radius, btnY);
  ctx.closePath();
  ctx.fill();

  // CTA text
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${btnFontSize}px Montserrat`;
  ctx.fillText(cta, btnX + (btnWidth - textWidth) / 2, btnY + btnHeight / 2);

  return canvas.toBuffer("image/jpeg");
}

// Utility to wrap long text
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}
