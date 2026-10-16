# Kayra Zeka

Türkçe yapay zekâ sohbet sitesi. Express ve OpenAI Responses API kullanır.

## Yerel çalıştırma
1. Node.js 20+ kurun.
2. `npm install`
3. `OPENAI_API_KEY` ortam değişkenini ayarlayın.
4. `npm start`

## Render dağıtımı
`render.yaml` ile Node web servisi oluşturun. Render Dashboard > Environment bölümüne `OPENAI_API_KEY` değerini güvenli şekilde ekleyin. API anahtarını kaynak koda veya herkese açık depoya koymayın. API kullanımı ücret doğurabilir.

Sağlık kontrolü: `/api/health`
