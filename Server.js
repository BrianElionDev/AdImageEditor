import express from "express";

// Try to import canvas-dependent modules with error handling
let generateAdImage1, generateAdImage2, generateAdImage3;

try {
  const style1Module = await import("./Style1.js");
  generateAdImage1 = style1Module.generateAdImage1;
  console.log("✅ Style1 loaded successfully");
} catch (error) {
  console.error("❌ Failed to load Style1:", error.message);
  generateAdImage1 = null;
}

try {
  const style2Module = await import("./Style2.js");
  generateAdImage2 = style2Module.generateAdImage2;
  console.log("✅ Style2 loaded successfully");
} catch (error) {
  console.error("❌ Failed to load Style2:", error.message);
  generateAdImage2 = null;
}

try {
  const style3Module = await import("./Style3.js");
  generateAdImage3 = style3Module.generateAdImage3;
  console.log("✅ Style3 loaded successfully");
} catch (error) {
  console.error("❌ Failed to load Style3:", error.message);
  generateAdImage3 = null;
}

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
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    styles: {
      style1: !!generateAdImage1,
      style2: !!generateAdImage2,
      style3: !!generateAdImage3
    },
  });
});

// Routes
app.get("/", (req, res) => {
  console.log("✅ GET /");
  res.json({
    message: "Hello from Railway Ad API",
    styles: {
      style1: !!generateAdImage1,
      style2: !!generateAdImage2,
      style3: !!generateAdImage3  
    },
  });
});

app.post("/generate-ad", async (req, res) => {
  const { imageUrl, logoUrl, headline, subtext, cta, style } = req.body;

  if (!imageUrl || !headline || !subtext || !cta || !style) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  console.log(`🎨 Requested style: ${style}`);

  let generateFn;
  if (style === "Style1") {
    if (!generateAdImage1) {
      return res.status(503).json({
        error: "Style1 is not available - canvas dependency failed to load",
      });
    }
    generateFn = generateAdImage1;
  } else if (style === "Style2") {
    if (!generateAdImage2) {
      return res.status(503).json({
        error: "Style2 is not available - canvas dependency failed to load",
      });
    }
    generateFn = generateAdImage2;
  } else if (style === "Style3") {  // 👈 New condition
    if (!generateAdImage3) {
      return res.status(503).json({
        error: "Style3 is not available - canvas dependency failed to load",
      });
    }
    generateFn = generateAdImage3;
  } else {
    return res.status(400).json({ 
      error: "Invalid style selected.",
      available_styles: ["Style1", "Style2", "Style3"]  // 👈 Updated list
    });
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
    console.log(`✅ ${style} ad image generated`);  // 👈 More specific log
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch (error) {
    clearTimeout(timeout);
    console.error(`❌ Error generating ${style} ad image:`, error);  // 👈 Style-specific error

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
        style: style  // 👈 Include failing style in response
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
const HOST = "0.0.0.0";

console.log(`🌐 Attempting to start server on ${HOST}:${PORT}...`);

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);

  // Verify server is listening
  const address = server.address();
  console.log("📍 Server address:", address);
});

// Handle server errors
server.on("error", (error) => {
  console.error("❌ Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle connection errors
server.on("connection", (socket) => {
  console.log("🔌 New connection from:", socket.remoteAddress);
});
