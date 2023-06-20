const { message } = require("telegraf/filters");
const { code } = require("telegraf/format");

const { oggToMp3, streamToText } = require("./convertVoice");
const { removeStreams } = require("./helpers");
const { bot, INITIAL_SESSION } = require("./models");
const express = require('express');
//express
const app = express();
// the bot processes voice requests
bot.on(message("voice"), async (context) => {
  // if session is null or undefined set up initial variable
  if (!context.session) {
    context.session = INITIAL_SESSION;
  }

  try {
    await context.reply(code("sua mensagem foi recebida, aguarde a resposta..."));

    const { file_id } = context.message.voice;
    const urlFile = await context.telegram.getFileLink(file_id); // get URL-object of our stream file from Telegram storage

    const userId = context.from.id.toString(); // use user's IDs as a name of stream file .ogg

    const oggPath = await oggToMp3.createOgg(urlFile.href, userId); // create .ogg stream file from URL-object

    const mp3Path = await oggToMp3.convertToMp3(oggPath, userId); // convert .ogg to .mp3

    const text = await streamToText.transcription(mp3Path); // convert stream to text
    await context.reply(`oque entendi no áudio que você mandou: ${text}`);
    await context.reply(code("Mensagem sendo processada..."));

    const { messages } = context.session;
    messages.push({ role: streamToText.roles.USER, content: text }); // add new message to current session
    const res = await streamToText.chat(messages); // send text to chatGPT with certain role
    messages.push({ role: streamToText.roles.ASSISTANT, content: res.content }); // add new message to current session

    await context.reply(res.content); // show an answer for user

    removeStreams(mp3Path); //delete .mp3 file
  } catch (error) {
    console.log("aconteceu algum erro", error.message);
  }
});

// the bot processes text requests
bot.on(message("text"), async (context) => {
  if (!context.session) {
    context.session = INITIAL_SESSION;
  }

  const { text } = context.message;

  try {
    await context.reply(code("Mensagem sendo processada..."));

    const { messages } = context.session;
    messages.push({
      role: streamToText.roles.USER,
      content: text,
    });
    const { content } = await streamToText.chat(messages);
    messages.push({ role: streamToText.roles.ASSISTANT, content });

    await context.reply(content);
  } catch (error) {
    console.log("Aconteceu algum erro", error.message);
  }
});

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  console.log("Bot was stopped!");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  console.log("Bot was stopped!");
});

app.get('/', async (req, res) => {
res.send('online')
});


const porta = process.env.PORT || 5000;
//iniciando...
app.listen(porta, () => console.log("site Online na porta:", porta));
