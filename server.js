import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.MODEL || "gpt-4o-mini";
const SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  "Du bist ein hilfreicher deutschsprachiger Firmen-Chatbot.";

if (!OPENAI_API_KEY) {
  console.warn(
    "⚠️ OPENAI_API_KEY fehlt. Setze die Umgebungsvariable oder trage sie in .env ein."
  );
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (string) ist erforderlich" });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      return res.status(500).json({ error: "OpenAI API Fehler", details: txt });
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "(Keine Antwort erhalten)";

    return res.json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Serverfehler", details: String(err) });
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`🚀 Server läuft auf http://localhost:${port}`)
);
