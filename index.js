const express = require('express');
const app = express();
app.use(express.json());

const N8N_WEBHOOK_URL = 'https://oenciso.app.n8n.cloud/webhook/whatsapp';
const VERIFY_TOKEN = 'probo123';

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
        if (!message) return;
        console.log('MESSAGE TYPE:', message.type);
        console.log('MESSAGE FULL:', JSON.stringify(message));

        const from = message.from;
        let text = '';
        let type = message.type;
        let button_id = '';

        if (message.type === 'text') {
            text = message.text.body;
        } else if (message.type === 'interactive') {
            const interactive = message.interactive;
            if (interactive.type === 'button_reply') {
                button_id = interactive.button_reply.id;
                text = interactive.button_reply.title;
            } else if (interactive.type === 'list_reply') {
                button_id = interactive.list_reply.id;
                text = interactive.list_reply.title;
            }
        } else {
            return;
        }

        console.log(`Mensaje de ${from}: ${text} [type: ${type}] [button: ${button_id}]`);

        await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, text, type, button_id })
        });

    } catch (err) {
        console.error(err);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook corriendo en puerto ${PORT}`));
