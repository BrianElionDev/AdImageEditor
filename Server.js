import express from "express";
import { generateAdImage1 } from "./Style1.js";
import { generateAdImage2 } from "./Style2.js"; // Add more styles as needed

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.get("/", (req, res) => {
  console.log("✅ GET /");
  res.send("Hello from Railway Ad API");
});

app.post("/generate-ad", async (req, res) => {
  const { imageUrl, logoUrl, headline, subtext, cta, style } = req.body;

  if (!imageUrl || !headline || !subtext || !cta || !style) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  console.log(`🎨 Requested style: ${style}`);

  let generateFn;
  if (style === "Style1") {
    generateFn = generateAdImage1;
  } else if (style === "Style2") {
    generateFn = generateAdImage2;
  } else {
    return res.status(400).json({ error: "Invalid style selected." });
  }

  // Set timeout for the entire request
  const timeout = setTimeout(() => {
    console.error("❌ Request timeout");
    if (!res.headersSent) {
      res.status(408).json({ error: "Request timeout" });
    }
  }, 30000); // 30 seconds

  try {
    const buffer = await generateFn({
      imageUrl,
      logoUrl,
      headline,
      subtext,
      cta,
    });

    clearTimeout(timeout);
    console.log("✅ Ad image generated");
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch (error) {
    clearTimeout(timeout);
    console.error("❌ Error generating ad image:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
