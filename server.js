import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(path.join(root, "public")));

const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const apiKey = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY_MISSING");
  return process.env.GEMINI_API_KEY;
};

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "Kayra Zeka" }));
app.get("/api/config", (_req, res) => res.json({ ready: Boolean(process.env.GEMINI_API_KEY), model, provider: "Gemini" }));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Lütfen önce bir soru yaz." });
    if (message.length > 8000) return res.status(400).json({ error: "Mesaj en fazla 8000 karakter olabilir." });

    const history = Array.isArray(req.body?.history)
      ? req.body.history.slice(-8).map(m => ({
          role: m?.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m?.content || "").slice(0, 4000) }]
        })).filter(m => m.parts[0].text.trim())
      : [];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey()
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "Sen Kayra Zeka adlı Türkçe yapay zekâ asistanısın. Matematik, kimya, astronomi, astrofizik, tarih ve genel konularda açık, öğretici ve doğru yanıt ver. Adım adım açıklama istendiğinde çözümü gerekçeleriyle anlat. Bilmediğin bilgiyi uydurma; belirsizliği belirt. Tehlikeli veya hassas konularda güvenli davran."
          }]
        },
        contents: [...history, { role: "user", parts: [{ text: message }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || "Gemini API isteği başarısız oldu.";
      const err = new Error(detail);
      err.status = response.status;
      throw err;
    }
    const answer = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();
    res.json({ answer: answer || "Bu soruya şu an yanıt oluşturamadım." });
  } catch (err) {
    console.error("chat_error", err?.status || "", err?.message || err);
    if (err?.message === "GEMINI_API_KEY_MISSING") {
      return res.status(503).json({ error: "Gemini henüz etkinleştirilmedi. Render ortam değişkenlerine GEMINI_API_KEY eklenmesi gerekiyor." });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: "Gemini ücretsiz kullanım kotası dolmuş olabilir. Biraz bekleyip tekrar dene veya Google AI Studio kota durumunu kontrol et." });
    }
    if (err?.status === 401 || err?.status === 403) {
      return res.status(502).json({ error: "Gemini API anahtarı geçersiz olabilir veya bu model için erişim yok. Render'daki GEMINI_API_KEY ve Google AI Studio ayarlarını kontrol et." });
    }
    res.status(502).json({ error: "Gemini'den yanıt alınamadı. API anahtarını, model erişimini ve Google AI Studio durumunu kontrol et." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(root, "public", "index.html")));
const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => console.log(`Kayra Zeka listening on ${port}`));
