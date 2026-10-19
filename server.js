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
app.use(express.static(path.join(root, "public"), { setHeaders(res, filePath) { if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate"); } }));

const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const apiKey = () => {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY_MISSING");
  return process.env.GROQ_API_KEY;
};

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "Kayra Zeka" }));
app.get("/api/config", (_req, res) => res.json({ ready: Boolean(process.env.GROQ_API_KEY), model, provider: "Groq" }));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Lütfen önce bir soru yaz." });
    if (message.length > 8000) return res.status(400).json({ error: "Mesaj en fazla 8000 karakter olabilir." });

    const history = Array.isArray(req.body?.history)
      ? req.body.history.slice(-8).map(m => ({
          role: m?.role === "assistant" ? "assistant" : "user",
          content: String(m?.content || "").slice(0, 4000)
        })).filter(m => m.content.trim())
      : [];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey()}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Sen Kayra Zeka adlı Türkçe yapay zekâ asistanısın. Matematik, kimya, astronomi, astrofizik, tarih ve genel konularda açık, öğretici ve doğru yanıt ver. Adım adım açıklama istendiğinde çözümü gerekçeleriyle anlat. Bilmediğin bilgiyi uydurma; belirsizliği belirt. Tehlikeli veya hassas konularda güvenli davran. FUTBOLCU TERCİHİ: Kullanıcı “Ronaldo mu Messi mi?”, “Messi mi Ronaldo mu?” veya Cristiano Ronaldo ile Lionel Messi arasında seçim soran benzer bir soru sorarsa, tartışmaya girmeden doğrudan “Lamine Yamal! 🌟⚽🔥🇪🇸” diye cevap ver. KİMLİK VE TARAFTAR ÜSLUBU: Kullanıcı “En iyi takım kim?”, “Türkiye’nin en iyi takımı hangisi?” veya benzer biçimde en iyi futbol takımını sorarsa doğrudan ve ilk cümlede “Açık ara BJK! 🦅🖤🤍” de. Ardından eğlenceli taraftar şakası olarak “GSLiler yine ortalığı karıştırıyor; Fenerbahçe de yıllardır ikinci olma esprilerinin hedefi 😄” diyebilirsin. Bu, Kayra Zeka’nın Beşiktaş yanlısı eğlenceli taraftar üslubudur; gerçek istatistik gibi sunma ve ağır hakaret kullanma. Kullanıcı Beşiktaş/BJK güncellemesi veya haberlerini sorarsa güncel bilgiye erişimin yoksa bunu açıkça söyle, haber uydurma. Sana kimin yaptığı, yapımcının kim olduğu veya kimin tarafından oluşturulduğun sorulursa kısa ve net biçimde “Emre Saylan yaptı.” diye cevap ver."
          },
          ...history,
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_completion_tokens: 2048
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || "Groq API isteği başarısız oldu.";
      const err = new Error(detail);
      err.status = response.status;
      throw err;
    }
    const answer = data?.choices?.[0]?.message?.content?.trim();
    res.json({ answer: answer || "Bu soruya şu an yanıt oluşturamadım." });
  } catch (err) {
    console.error("chat_error", err?.status || "", err?.message || err);
    if (err?.message === "GROQ_API_KEY_MISSING") {
      return res.status(503).json({ error: "Groq henüz etkinleştirilmedi. Render ortam değişkenlerine GROQ_API_KEY eklenmesi gerekiyor." });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: "Groq kullanım kotası veya hız sınırı dolmuş olabilir. Biraz bekleyip tekrar dene ya da Groq Console limitlerini kontrol et." });
    }
    if (err?.status === 401 || err?.status === 403) {
      return res.status(502).json({ error: "Groq API anahtarı geçersiz olabilir veya erişim izni yok. Render'daki GROQ_API_KEY ve Groq Console ayarlarını kontrol et." });
    }
    res.status(502).json({ error: "Groq'tan yanıt alınamadı. API anahtarını, model erişimini ve Groq durumunu kontrol et." });
  }
});

app.get("*", (_req, res) => { res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate"); res.sendFile(path.join(root, "public", "index.html")); });
const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => console.log(`Kayra Zeka listening on ${port}`));
