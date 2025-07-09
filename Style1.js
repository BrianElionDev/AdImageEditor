import { createCanvas, loadImage } from "canvas";
import axios from "axios";
import { Vibrant } from "node-vibrant/node";

async function getVibrantFill(imageBuffer) {
  const palette = await Vibrant.from(imageBuffer).getPalette();
  const swatch = palette.Vibrant || palette.Muted;
  if (!swatch) return "#FDC830";
  const [r, g, b] = swatch.rgb;
  const avg = (r + g + b) / 3;
  return r > g && r > b ? "#FDBB2D" : avg < 120 ? "#FFC107" : "#FDC830";
}

function wrapText(ctx, text, maxWidth, fontSize) {
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

export async function generateAdImage1({
  imageUrl,
  headline = "🔥 Deal Time! Best Prices Ever!",
  subtext = "Get 37% OFF premium cuts — Limited Time Only!",
  cta = "Order Now",
}) {
  const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
  const bgImage = await loadImage(imageBuffer);

  const width = bgImage.width;
  const height = bgImage.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImage, 0, 0, width, height);

  // Text Padding & Overlay Styling
  const padding = width * 0.04;
  const maxTextWidth = width * 0.9;

  // Headline Box
  let fontSize = Math.floor(height * 0.04);
  ctx.font = `bold ${fontSize}px Sans`;
  const headlineLines = wrapText(ctx, headline, maxTextWidth);
  const headlineHeight = headlineLines.length * (fontSize + 6) + 20;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(padding - 10, padding - 10, maxTextWidth + 20, headlineHeight);

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  let cursorY = padding;
  for (const line of headlineLines) {
    ctx.fillText(line, padding, cursorY);
    cursorY += fontSize + 6;
  }

  // Subtext Box
  fontSize = Math.floor(height * 0.03);
  ctx.font = `italic ${fontSize}px Sans`;
  const subLines = wrapText(ctx, subtext, maxTextWidth);
  const subHeight = subLines.length * (fontSize + 5) + 20;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(padding - 10, cursorY, maxTextWidth + 20, subHeight);

  ctx.fillStyle = "#fff";
  cursorY += 10;
  for (const line of subLines) {
    ctx.fillText(line, padding, cursorY);
    cursorY += fontSize + 5;
  }

  // CTA Button (Bottom Center)
  const btnFontSize = Math.floor(height * 0.035);
  ctx.font = `bold ${btnFontSize}px Sans`;
  const textWidth = ctx.measureText(cta).width;
  const btnPadding = 24;
  const btnWidth = textWidth + btnPadding * 2;
  const btnHeight = btnFontSize * 1.8;
  const btnX = (width - btnWidth) / 2;
  const btnY = height - btnHeight - 30;

  ctx.fillStyle = "#b30000";
  ctx.beginPath();
  ctx.moveTo(btnX + 12, btnY);
  ctx.lineTo(btnX + btnWidth - 12, btnY);
  ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + 12);
  ctx.lineTo(btnX + btnWidth, btnY + btnHeight - 12);
  ctx.quadraticCurveTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - 12, btnY + btnHeight);
  ctx.lineTo(btnX + 12, btnY + btnHeight);
  ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - 12);
  ctx.lineTo(btnX, btnY + 12);
  ctx.quadraticCurveTo(btnX, btnY, btnX + 12, btnY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(cta, btnX + (btnWidth - textWidth) / 2, btnY + btnHeight / 2);

  return canvas.toBuffer("image/jpeg");
}
