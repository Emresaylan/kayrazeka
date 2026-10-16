# Kayra Zeka

Türkçe yapay zekâ sohbet sitesi. Express ve Google Gemini API kullanır.

## Yerel çalıştırma
1. Node.js 20+ kurun.
2. `npm install`
3. `GEMINI_API_KEY` ortam değişkenini Google AI Studio'dan aldığınız anahtarla ayarlayın.
4. İsteğe bağlı olarak `GEMINI_MODEL` değişkenini ayarlayın (varsayılan: `gemini-3.8-flash`).
5. `npm start`

## Render dağıtımı
Render Dashboard > kayra-zeka > Environment bölümüne `GEMINI_API_KEY` adlı ortam değişkenini ekleyin ve değerine Google AI Studio API anahtarını yapıştırın. Anahtarı kaynak koda veya herkese açık depoya koymayın. Ardından servisi yeniden deploy edin.

Google AI Studio: https://aistudio.google.com/
Gemini API ücretlendirme ve ücretsiz kullanım kotası modele, bölgeye ve Google'ın güncel koşullarına bağlıdır; ücretsiz kullanım sınırsız değildir.

Sağlık kontrolü: `/api/health`
