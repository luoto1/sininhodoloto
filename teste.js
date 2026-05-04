const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_TOKEN = process.env.TWITCH_TOKEN;

// 👇 canais que você quer monitorar
const canais = ["fernandemiguels", "cellbit", "caionomichi", "7mz_lucasart", "batzera", "canalbyspeed"];

let avisados = new Set();

async function enviarTelegram(msg) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: msg
  });
}

async function checarLives() {
  try {
    const query = canais.map(c => `user_login=${c}`).join("&");

    const res = await axios.get(`https://api.twitch.tv/helix/streams?${query}`, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${TWITCH_TOKEN}`
      }
    });

    const lives = res.data.data;

    for (const live of lives) {
      if (!avisados.has(live.user_login)) {
        avisados.add(live.user_login);

        const mensagem = 
`🔴 ${live.user_name} entrou ao vivo!

📺 ${live.title}
🎮 ${live.game_name}

https://twitch.tv/${live.user_login}`;

        await enviarTelegram(mensagem);
        console.log("Aviso enviado:", live.user_name);
      }
    }

    // limpa quem saiu da live
    const online = lives.map(l => l.user_login);
    avisados.forEach(user => {
      if (!online.includes(user)) avisados.delete(user);
    });

  } catch (err) {
    console.log("ERRO:", err.response?.data || err.message);
  }
}

console.log("Bot rodando...");

checarLives();
setInterval(checarLives, 60000);
