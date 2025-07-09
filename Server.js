import express from 'express';
import { generateAdImage1 } from './Style1.js';
import { generateAdImage2 } from './Style2.js'; // Add more styles as needed

const app = express();
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  console.log('✅ GET /');
  res.send('Hello from Railway Ad API');
});

app.post('/generate-ad', async (req, res) => {
  const { imageUrl, logoUrl, headline, subtext, cta, style } = req.body;

  if (!imageUrl || !headline || !subtext || !cta || !style) {
    return res.status(400).send('Missing required parameters');
  }

  console.log(`🎨 Requested style: ${style}`);

  let generateFn;
  if (style === 'Style1') {
    generateFn = generateAdImage1;
  } else if (style === 'Style2') {
    generateFn = generateAdImage2;
  } else {
    return res.status(400).send('Invalid style selected.');
  }

  try {
    const buffer = await generateFn({
      imageUrl,
      logoUrl,
      headline,
      subtext,
      cta
    });
    console.log('✅ Ad image generated');
    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error generating ad image:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
