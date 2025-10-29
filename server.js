import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// === Load Multiple Keys from .env ===
const keys = process.env.GEMINI_KEYS?.split(",").map(k => k.trim()) || [];
let currentIndex = 0;

function getNextKey() {
    if (keys.length === 0) {
        throw new Error("No API keys found in GEMINI_KEYS env variable");
    }
    const key = keys[currentIndex];
    currentIndex = (currentIndex + 1) % keys.length; // round-robin
    return key;
}

// ✅ Root route
app.get("/", (_, res) => {
    res.send(`✅ Gemini API is running!<br>Loaded ${keys.length} API keys`);
});

// ✅ Secure POST endpoint
app.post("/api/chat", async (req, res) => {
    try {
        // Password check
        const clientPassword = req.headers["x-api-password"];
        if (clientPassword !== process.env.API_PASSWORD) {
            return res.status(401).json({ error: "Unauthorized: Invalid password" });
        }

        const { prompt, model } = req.body;
        if (!prompt) return res.status(400).json({ error: "Missing prompt" });

        // === Rotate API key here per request ===
        const apiKey = getNextKey();
        const ai = new GoogleGenAI({ apiKey });

        const chosenModel = model || "gemini-2.5-flash";

        const response = await ai.models.generateContent({
            model: chosenModel,
            contents: prompt,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Gemini API error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Server running at http://localhost:${PORT}`)
);

