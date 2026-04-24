const express = require('express');
const app = express();
app.use(express.json());

const N8N_WEBHOOK_URL = 'https://oenciso.app.n8n.cloud/webhook-test/whatsapp';
const VERIFY_TOKEN = 'probo123';
const WHATSAPP_TOKEN = 'EAANZBUe4D0PABRf1d8hV3Ds5eLCvBitRbsSdu7FAZBhCoald5WEUlujNnSuK7xhSaxFWeXZBtx5ZBAw0cMdgPQdmD81fRx3A6DZBKq5KScUhAOZBXBcUc2DiD7mB7wR37kuny5OZBPis1mpyBIQ7b3GJ9iPhpZClgFAmQBVhy1yRkHzdGCsVxIoM1xjH2ZAUD40zOLgZDZD';
const PHONE_NUMBER_ID = '993471470525797';

app.get('/webhook', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    const body = req.body;
    res.sendStatus(200);

    try {
        const changes = body.entry?.[0]?.changes?.[0]?.value;
        const message = changes?.messages?.[0];
        if (!message || message.type !== 'text') return;

        const from = message.from;
        const text = message.text.body;
        console.log(`Mensaje de ${from}: ${text}`);

        // Reenviar a N8N
        await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, text })
        });

        // Respuesta automática
        await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: from,
                type: 'text',
                text: { body: `Hola! Recibimos tu mensaje: "${text}". Te responderemos pronto.` }
            })
        });

    } catch (err) {
        console.error(err);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook corriendo en puerto ${PORT}`));
