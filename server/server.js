// server/server.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/voice-agent", async (req, res) => {
  const { prompt, transcript } = req.body;
  const messages = [
    { role: "system", content: prompt },
    { role: "user", content: transcript },
  ];

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
    });

    const output = completion.choices[0].message.content.trim();
    const json = JSON.parse(output);
    res.json(json);
  } catch (err) {
    console.error(err);
    res.json({
      action: "replace",
      value: transcript,
      type: "text",
      confidence: 0.5,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Voice AI server running on port ${PORT}`));


