# Meta Ads Image Editor

A Node.js/Express API for generating ad images with custom text, logos, and styles. Supports emoji and custom fonts (Montserrat). Designed for easy deployment on Railway using Nixpacks.

---

## 🚀 Features

- Generate ad images with headline, subtext, CTA, and logo
- Two modern styles (Style1, Style2)
- Montserrat font family included
- Emoji support (with Noto Color Emoji font, if available)
- Automatic emoji stripping if font is missing
- REST API for easy integration

---

## 🏗️ Quick Start (Local)

```bash
# Install dependencies
pnpm install

# Start the server
pnpm start

# Or use npm if you prefer
npm install
npm start
```

Server runs on `http://localhost:3000` by default.

---

## 🚢 Deploy on Railway (Nixpacks)

- All native dependencies (canvas, sharp) are handled by Nixpacks
- Montserrat and Noto Color Emoji fonts are installed automatically
- No manual Dockerfile needed

**Troubleshooting:**

- If emojis show as boxes or Unicode codes, Railway's container is missing the emoji font. The app will strip emojis so you never see fallback text or tofu.
- If you see fontconfig errors, they're safe to ignore unless text is missing.

---

## 🖼️ API Usage

### Generate an Ad Image

```http
POST /generate-ad
Content-Type: application/json

{
  "imageUrl": "https://example.com/background.jpg",
  "logoUrl": "https://example.com/logo.png",
  "headline": "🔥 Fresh Meat Frenzy!",
  "subtext": "Get 37% OFF — Only This Week.",
  "cta": "Shop Now",
  "style": "Style2"
}
```

- **imageUrl**: Background image URL (required)
- **logoUrl**: Logo image URL (optional)
- **headline**: Main text (emojis will be stripped if not supported)
- **subtext**: Subtext (emojis will be stripped if not supported)
- **cta**: Call-to-action button text
- **style**: `Style1` or `Style2`

**Returns:** JPEG image

#### Example with [api.rest](./api.rest)

You can use the included `api.rest` file with VSCode REST Client or similar tools to test endpoints quickly.

---

## 🧩 How It Works

1. **You send a POST request** to `/generate-ad` with your image, logo, and text.
2. **The server downloads the background and logo images** using Axios.
3. **Canvas is used to draw** the background, logo, and all text overlays.
4. **Fonts:**
   - Montserrat is loaded from the `/fonts` directory for all text.
   - Emoji font (Noto Color Emoji) is registered if available.
   - If emoji font is missing, all emoji/unicode symbols are stripped from your text (so you never see tofu or codepoints).
5. **Text is wrapped and styled** according to the selected style (Style1 or Style2).
6. **The final image is returned** as a JPEG.

---

## 🏛️ Architecture

- **Express.js**: Handles API endpoints and request parsing.
- **canvas**: Node.js bindings for drawing images and text.
- **sharp**: (Optional) For image manipulation if needed.
- **Montserrat fonts**: Bundled in `/fonts` for consistent branding.
- **Noto Color Emoji**: Installed via Nixpacks for emoji support (if available).
- **Nixpacks**: Handles all native dependencies and fonts for Railway deployment.

---

## 🩺 Health Check

```http
GET /health
```

Returns status, font/emoji availability, and server info.

---

## 🛠️ Troubleshooting

- **No emoji?**: Emoji font is missing in the container. The app will strip emojis so you never see tofu or codepoints.
- **Text missing?**: Make sure Montserrat fonts are present in `/fonts`.
- **Canvas errors?**: Ensure all native dependencies are installed (see `nixpacks.toml`).
- **Fontconfig error?**: Usually safe to ignore unless text is missing.

---

## ❓ FAQ

**Q: Why are my emojis missing or blank?**
A: If the emoji font is not available in the container, all emoji/unicode symbols are stripped from your text before rendering. This prevents ugly fallback boxes or codepoints.

**Q: Can I use my own fonts?**
A: Yes! Add your `.ttf` files to `/fonts` and register them in the style files.

**Q: Can I add more styles?**
A: Yes! Copy `Style1.js` or `Style2.js`, tweak the drawing logic, and register your new style in `Server.js`.

**Q: Can I use this outside Railway?**
A: Yes, but you must ensure all native dependencies and fonts are installed on your server.

---

## 📄 License

MIT
