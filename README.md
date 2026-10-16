# Kayra Zeka

Türkçe yapay zekâ sohbet sitesi. Express ve Groq API kullanır.

## Yerel çalıştırma
1. Node.js 20+ kurun.
2. `npm install`
3. `GROQ_API_KEY` ortam değişkenini Groq Console'dan aldığınız anahtarla ayarlayın.
4. İsteğe bağlı olarak `GROQ_MODEL` değişkenini ayarlayın (varsayılan: `openai/gpt-oss-20b`).
5. `npm start`

## Render dağıtımı
Render Dashboard > kayra-zeka > Environment bölümüne `GROQ_API_KEY` adlı ortam değişkenini ekleyin ve değerine Groq Console API anahtarını yapıştırın. Anahtarı kaynak koda veya herkese açık depoya koymayın. Ardından servisi yeniden deploy edin.

Groq Console: https://console.groq.com/keys
Kullanım limitleri ve erişilebilir modeller Groq hesabına ve güncel koşullara bağlıdır.

Sağlık kontrolü: `/api/health`
