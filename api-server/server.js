require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// OpenRouter API کو پروکسی کے ذریعے call کریں
app.post('/api/openrouter', async (req, res) => {
    try {
        const { prompt } = req.body;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.REFERER_URL,
                'X-Title': process.env.APP_NAME
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat-v3-0324:free",
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        res.json(data.choices[0].message.content);

    } catch (error) {
        console.error("Failed to fetch:", error);
        res.status(500).json({ error: "API connection failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));