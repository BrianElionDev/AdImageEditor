import express from 'express';
const app = express();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get('/', (req, res) => {
    console.log('Hello World');
    res.send('Hello World');
});

app.use(express.json());

app.post('/generate-ad', async (req, res) => {
    const { imageUrl, logoUrl, headline, subtext, cta, style } = req.body;

    if (!imageUrl || !headline || !subtext || !cta) {
        return res.status(400).send('Missing required parameters');
    }

    try {
        console.log(`generating ad image with style ${style}`);
        const { generateAdImage } = await import(`./${style}.js`);
        const buffer = await generateAdImage({
            imageUrl,
            logoUrl,
            headline,
            subtext,
            cta
        });
        console.log('Ad image generated successfully');
        res.set('Content-Type', 'image/jpeg');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating ad image:', error);
        res.status(500).send('Internal Server Error');
    }
});