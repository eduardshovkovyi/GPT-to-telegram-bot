import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import process from "nodemon";
import config from "config";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";
import { initCommand, INITIAL_SESSION } from "./utils.js";

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command("new", initCommand);
bot.command("start", initCommand);

export async function processTextToChat(ctx, content) {
  try {
    ctx.session.messages.push({ role: openai.roles.USER, content });
    const response = await openai.chat(ctx.session.messages);
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });
    await ctx.reply(response.content);
  } catch (e) {
    console.log("Error while processing text to gpt", e.message);
  }
}

bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code("Waiting to hear back from the server..."));
    await processTextToChat(ctx, ctx.message.text);
  } catch (e) {
    console.error("Error while text message", e.message);
  }
});

bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code("Waiting to hear back from the server..."));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Your request: ${text}`));

    await processTextToChat(ctx, text);
  } catch (e) {
    console.error("Error while voice message", e.message);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
