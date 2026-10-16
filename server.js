import express from "express";
import OpenAI from "openai";
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
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const client = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_MISSING");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "Kayra Zeka" }));
app.get("/api/config", (_req, res) => res.json({ ready: Boolean(process.env.OPENAI_API_KEY), model }));
app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Lütfen önce bir soru yaz." });
    if (message.length > 8000) return res.status(400).json({ error: "Mesaj en fazla 8000 karakter olabilir." });
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8).map(m => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content || "").slice(0, 4000)
    })) : [];
    const response = await client().responses.create({
      model,
      instructions: "Sen Kayra Zeka adlı Türkçe yapay zekâ asistanısın. Matematik, kimya, astronomi, astrofizik, tarih ve genel konularda açık, öğretici ve doğru yanıt ver. Adım adım açıklama istendiğinde çözümü gerekçeleriyle anlat. Bilmediğin bilgiyi uydurma; belirsizliği belirt. Tehlikeli veya hassas konularda güvenli davran.",
      input: [...history, { role: "user", content: message }]
    });
    res.json({ answer: response.output_text || "Bu soruya şu an yanıt oluşturamadım." });
  } catch (err) {
    console.error("chat_error", err?.message || err);
    if (err?.message === "OPENAI_API_KEY_MISSING") return res.status(503).json({ error: "Yapay zekâ henüz etkinleştirilmedi. Site yöneticisinin Render ortam değişkenlerine OPENAI_API_KEY eklemesi gerekiyor." });
    if (err?.status === 429) return res.status(429).json({ error: "Yapay zekâ kullanım sınırına ulaşıldı. Biraz sonra tekrar dene." });
    res.status(502).json({ error: "Yanıt alınamadı. API anahtarı, model ve sağlayıcı durumunu kontrol et." });
  }
});
app.get("*", (_req, res) => res.sendFile(path.join(root, "public", "index.html")));
const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => console.log(`Kayra Zeka listening on ${port}`));
