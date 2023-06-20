const { Telegraf, session } = require("telegraf");
require("dotenv").config();

const INITIAL_SESSION = {
  messages: [],
};

const bot = new Telegraf("6022917340:AAHycOOnMbvxUHa0wDy9uUmLsomKuALJlRE");

bot.launch(); // launch our bot

bot.use(session()); // set sessions in our bot to be able to ask many questions within one request

// launch when new user connected  - writes '/start'
bot.command("start", async (context) => {
  context.session = INITIAL_SESSION;
  await context.reply(
    "Olá sou assistente virtual kasumi, liberada apenas para usuários premium, me pergunte alguma coisa em audio ou em texto e eu irei le auxiliar :)"
  );
});

// launch new session when user starts new session - writes '/new'
bot.command("new", async (context) => {
  context.session = INITIAL_SESSION;
  await context.reply("Estou aguardando seu novo áudio ou mensagem de texto...");
});

module.exports = { bot, INITIAL_SESSION };
