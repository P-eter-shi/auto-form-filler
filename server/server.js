// server/server.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Voice AI server is running',
    openaiConfigured: !!process.env.OPENAI_API_KEY 
  });
});

// Voice agent endpoint
app.post("/api/voice-agent", async (req, res) => {
  const { prompt, transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ 
      error: 'Missing transcript',
      action: 'replace',
      value: '',
      type: 'text',
      confidence: 0
    });
  }

  console.log('📝 Received transcript:', transcript);

  const messages = [
    { 
      role: "system", 
      content: prompt || `You are an intelligent form-filling assistant. Analyze voice commands and return JSON only.

Rules:
1. If user says a value (name, number, text), use action: "replace"
2. If user says "add" or "append", use action: "append"
3. If user says "clear", "delete", or "remove", use action: "clear"
4. Extract the actual value from the transcript
5. Determine if it's text, number, date, or email
6. Return confidence 0-1 (higher = more certain)

Examples:
- "John Smith" → {"action": "replace", "value": "John Smith", "type": "text", "confidence": 0.95}
- "add incorporated" → {"action": "append", "value": "incorporated", "type": "text", "confidence": 0.9}
- "clear this field" → {"action": "clear", "value": "", "type": "text", "confidence": 0.95}
- "12345" → {"action": "replace", "value": "12345", "type": "number", "confidence": 0.9}

Return ONLY valid JSON, no other text.`
    },
    { 
      role: "user", 
      content: transcript 
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const output = completion.choices[0].message.content.trim();
    console.log('🤖 AI response:', output);
    
    let json;
    try {
      json = JSON.parse(output);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Fallback response
      json = {
        action: "replace",
        value: transcript,
        type: "text",
        confidence: 0.5
      };
    }

    // Validate response structure
    if (!json.action) json.action = 'replace';
    if (json.value === undefined) json.value = transcript;
    if (!json.type) json.type = 'text';
    if (json.confidence === undefined) json.confidence = 0.7;

    console.log('✅ Sending response:', json);
    res.json(json);

  } catch (err) {
    console.error('❌ OpenAI API error:', err.message);
    
    // Fallback response on error
    res.status(200).json({
      action: "replace",
      value: transcript,
      type: "text",
      confidence: 0.5,
      error: err.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n✅ Voice AI server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎤 Voice endpoint: http://localhost:${PORT}/api/voice-agent`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Missing'}\n`);
});


