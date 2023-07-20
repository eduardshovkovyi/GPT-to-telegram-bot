import { unlink } from "fs/promises";

export const INITIAL_SESSION = {
  messages: [],
};

export async function removeFile(path) {
  try {
    await unlink(path);
  } catch (e) {
    console.error("Error while removing file", e.message);
  }
}

export async function initCommand(ctx) {
  ctx.session = INITIAL_SESSION;
  await ctx.reply("Жду вашего голосового или текстового сообщения");
}
