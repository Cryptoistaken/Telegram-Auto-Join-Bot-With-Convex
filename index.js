const { Telegraf, Markup, session } = require("telegraf");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram/tl");
const { ConvexClient } = require("convex/browser");
const path = require("path");

const _origLog = console.log;
console.log = () => {};
require("dotenv").config({ path: path.join(__dirname, "data", ".env") });
console.log = _origLog;

const BOT_TOKEN = process.env.BOT_TOKEN;
const AUTHORIZED_USER_ID = parseInt(process.env.AUTHORIZED_USER_ID);
const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;
const CONVEX_URL = process.env.CONVEX_URL;

const JOIN_DELAY_MS = parseInt(process.env.JOIN_DELAY_SECONDS || "3") * 1000;

const convex = new ConvexClient(CONVEX_URL);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const _lastErrorMsg = { text: "", count: 0 };

function suppressOrLog(err) {
  const msg = err && err.message ? err.message : String(err);
  if (_lastErrorMsg.text === msg) {
    _lastErrorMsg.count++;
    return;
  }
  _lastErrorMsg.text = msg;
  _lastErrorMsg.count = 1;
  logger.error(msg);
}

const pad = (s, n) => String(s).padEnd(n);

function log(level, msg) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  process.stdout.write(`${ts}  ${pad(`[${level}]`, 9)}  ${msg}\n`);
}

const logger = {
  info: (msg) => log("INFO", msg),
  ok: (msg) => log("OK", msg),
  warn: (msg) => log("WARN", msg),
  error: (msg) => log("ERROR", msg),
  step: (msg) => log("STEP", msg),
};

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const pendingFlows = new Map();

async function getSessions() {
  return await convex.query("queries:getSessions");
}

async function saveSession(data) {
  await convex.mutation("mutations:upsertSession", data);
}

// ── Heartbeat ──────────────────────────────────────────────────────────
async function startHeartbeat() {
  const ping = async () => {
    try { await convex.mutation("mutations:heartbeat", {}); } catch (_) {}
  };
  await ping();
  setInterval(ping, 15000);
}

async function removeSession(name) {
  await convex.mutation("mutations:deleteSession", { name });
}

async function getJoinedChannels() {
  const rows = await convex.query("queries:getJoinedChannels");
  const map = {};
  for (const row of rows) {
    if (!map[row.sessionName]) map[row.sessionName] = [];
    map[row.sessionName].push(row.channelLink);
  }
  return map;
}

async function addJoined(sessionName, channelLink) {
  await convex.mutation("mutations:addJoinedChannel", { sessionName, channelLink });
}

async function removeJoined(sessionName, channelLink) {
  await convex.mutation("mutations:removeJoinedChannel", { sessionName, channelLink });
}

async function clearAllJoined() {
  await convex.mutation("mutations:clearAllJoinedChannels");
}

function authorize(ctx, next) {
  if (ctx.from.id !== AUTHORIZED_USER_ID) {
    logger.warn(`Unauthorized access — user ID: ${ctx.from.id}`);
    return ctx.reply("Unauthorized.");
  }
  return next();
}

function mainMenu() {
  return {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("Sessions", "view_sessions"),
        Markup.button.callback("Add Session", "add_session"),
      ],
      [
        Markup.button.callback("Join Channel", "join_channel"),
        Markup.button.callback("Joined List", "view_joined"),
      ],
      [
        Markup.button.callback("Leave All", "leave_all"),
        Markup.button.callback("Delete Session", "delete_session"),
      ],
    ]),
  };
}

function backButton() {
  return Markup.inlineKeyboard([[Markup.button.callback("Back", "back_to_menu")]]);
}

const SESSIONS_PAGE_SIZE = 5;
const JOINED_PAGE_SIZE = 10;

function buildSessionsPage(sessions, page) {
  const total = sessions.length;
  const totalPages = Math.max(1, Math.ceil(total / SESSIONS_PAGE_SIZE));
  const start = page * SESSIONS_PAGE_SIZE;
  const slice = sessions.slice(start, start + SESSIONS_PAGE_SIZE);

  let text = `*Sessions (${total}) — Page ${page + 1}/${totalPages}*\n\n`;
  for (let i = 0; i < slice.length; i++) {
    const s = slice[i];
    const name = s.name;
    text += `${start + i + 1}. *${name}*\n`;
    text += `   Phone: ${s.phone}\n`;
    text += `   Name: ${(s.firstName + " " + (s.lastName || "")).trimEnd()}\n`;
    text += `   Username: @${s.username}\n`;
    text += `   Created: ${new Date(s.createdAt).toLocaleString()}\n\n`;
  }

  const nav = [];
  if (page > 0) nav.push(Markup.button.callback("Back", `sess_p_${page - 1}`));
  if (page < totalPages - 1) nav.push(Markup.button.callback("Next", `sess_p_${page + 1}`));
  const buttons = [];
  if (nav.length > 0) buttons.push(nav);
  buttons.push([Markup.button.callback("Menu", "back_to_menu")]);

  return { text, keyboard: Markup.inlineKeyboard(buttons) };
}

function buildJoinedPage(joinedChannels, page) {
  const allEntries = [];
  for (const [name, channels] of Object.entries(joinedChannels)) {
    for (const ch of channels) allEntries.push({ session: name, channel: ch });
  }

  const total = allEntries.length;
  const totalPages = Math.max(1, Math.ceil(total / JOINED_PAGE_SIZE));
  const start = page * JOINED_PAGE_SIZE;
  const slice = allEntries.slice(start, start + JOINED_PAGE_SIZE);

  let text = `*Joined Channels (${total}) — Page ${page + 1}/${totalPages}*\n\n`;
  for (const entry of slice) text += `[${entry.session}] ${entry.channel}\n`;

  const nav = [];
  if (page > 0) nav.push(Markup.button.callback("Back", `join_p_${page - 1}`));
  if (page < totalPages - 1) nav.push(Markup.button.callback("Next", `join_p_${page + 1}`));
  const buttons = [];
  if (nav.length > 0) buttons.push(nav);
  buttons.push([Markup.button.callback("Menu", "back_to_menu")]);

  return { text, keyboard: Markup.inlineKeyboard(buttons) };
}

bot.start(authorize, (ctx) => {
  logger.info(`/start — user ${ctx.from.id} (${ctx.from.username || "no username"})`);
  ctx.reply("*Telegram Auto Join Bot*\n\nChoose an option:", mainMenu());
});

bot.action("back_to_menu", authorize, (ctx) => {
  pendingFlows.delete(ctx.from.id);
  ctx.editMessageText("*Menu*", mainMenu());
});

bot.action("view_sessions", authorize, async (ctx) => {
  const sessions = await getSessions();
  if (sessions.length === 0) {
    return ctx.editMessageText("No sessions found.\n\nUse *Add Session* to create one.", {
      parse_mode: "Markdown",
      ...backButton(),
    });
  }
  const { text, keyboard } = buildSessionsPage(sessions, 0);
  ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^sess_p_(\d+)$/, authorize, async (ctx) => {
  const page = parseInt(ctx.match[1]);
  const sessions = await getSessions();
  const { text, keyboard } = buildSessionsPage(sessions, page);
  ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
});

bot.action("add_session", authorize, (ctx) => {
  const userId = ctx.from.id;
  pendingFlows.set(userId, { step: "phone", chatId: ctx.chat.id });
  ctx.editMessageText(
    "*Add Session — Step 1 of 2*\n\nEnter the phone number with country code:\n\nExample: `+8801234567890`",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("Cancel", "back_to_menu")]]),
    }
  );
});

bot.action("join_channel", authorize, async (ctx) => {
  const sessions = await getSessions();
  if (sessions.length === 0) {
    return ctx.editMessageText("No sessions found. Add a session first.", {
      parse_mode: "Markdown",
      ...backButton(),
    });
  }
  const userId = ctx.from.id;
  pendingFlows.set(userId, { step: "join_link", chatId: ctx.chat.id });
  ctx.editMessageText(
    "*Join Channel*\n\nSend the channel link or username:\n\n`https://t.me/channel`\n`@channel`",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("Cancel", "back_to_menu")]]),
    }
  );
});

bot.action("view_joined", authorize, async (ctx) => {
  const joinedChannels = await getJoinedChannels();
  const hasAny = Object.values(joinedChannels).some((arr) => arr.length > 0);
  if (!hasAny) {
    return ctx.editMessageText("No channels joined yet.", { ...backButton() });
  }
  const { text, keyboard } = buildJoinedPage(joinedChannels, 0);
  ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^join_p_(\d+)$/, authorize, async (ctx) => {
  const page = parseInt(ctx.match[1]);
  const joinedChannels = await getJoinedChannels();
  const { text, keyboard } = buildJoinedPage(joinedChannels, page);
  ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
});

bot.action("leave_all", authorize, async (ctx) => {
  const joinedChannels = await getJoinedChannels();
  const totalChannels = Object.values(joinedChannels).reduce((sum, arr) => sum + arr.length, 0);
  if (totalChannels === 0) {
    return ctx.editMessageText("No tracked channels to leave.", { ...backButton() });
  }
  const sessionCount = Object.keys(joinedChannels).filter((k) => joinedChannels[k].length > 0).length;
  ctx.editMessageText(
    `*Leave All Channels*\n\nThis will leave *${totalChannels}* tracked channel(s) across *${sessionCount}* session(s).\n\nConfirm?`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("Confirm — Leave All", "confirm_leave_all")],
        [Markup.button.callback("Cancel", "back_to_menu")],
      ]),
    }
  );
});

bot.action("confirm_leave_all", authorize, async (ctx) => {
  await ctx.editMessageText("Leaving all tracked channels... Please wait.", { parse_mode: "Markdown" });
  const result = await executeLeaveAll();
  ctx.editMessageText(result.text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([[Markup.button.callback("Back to Menu", "back_to_menu")]]),
  });
});

bot.action("delete_session", authorize, async (ctx) => {
  const sessions = await getSessions();
  if (sessions.length === 0) {
    return ctx.editMessageText("No sessions to delete.", { ...backButton() });
  }
  const buttons = sessions.map((s) => [Markup.button.callback(s.name, `del_${s.name}`)]);
  buttons.push([Markup.button.callback("Cancel", "back_to_menu")]);
  ctx.editMessageText("*Delete Session*\n\nSelect session to delete:", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
});

bot.action(/^del_(.+)$/, authorize, async (ctx) => {
  const name = ctx.match[1];
  try {
    await removeSession(name);
    logger.ok(`Session deleted: ${name}`);
    ctx.editMessageText(`Session *${name}* deleted.`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("Back to Menu", "back_to_menu")]]),
    });
  } catch (err) {
    ctx.editMessageText(`Failed to delete session: ${err.message}`, { ...backButton() });
  }
});

bot.action(/^force_join_(.+)$/, authorize, async (ctx) => {
  const link = decodeURIComponent(ctx.match[1]);
  await processJoinRequest(ctx, link, true);
});

bot.on("text", authorize, async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const flow = pendingFlows.get(userId);

  if (flow) {
    await handleFlow(ctx, userId, text, flow);
    return;
  }

  const lines = text.split(/\s+|\n+/).map((l) => l.trim()).filter(Boolean);
  const links = [...new Set(lines.filter((l) => l.includes("t.me/") || l.startsWith("@")))];

  if (links.length > 0) {
    for (const link of links) await handleChannelJoinRequest(ctx, link);
    return;
  }

  const looksLikePhone = /^\+?\d{10,15}$/.test(text.replace(/[\s\-().]/g, ""));
  if (looksLikePhone) {
    const autoFlow = { step: "phone", chatId: ctx.chat.id };
    pendingFlows.set(userId, autoFlow);
    await handleFlow(ctx, userId, text, autoFlow);
    return;
  }

  ctx.reply("Send a channel link to join, or use /start to open the menu.");
});

async function handleFlow(ctx, userId, text, flow) {
  if (flow.step === "join_link") {
    if (!text.includes("t.me/") && !text.startsWith("@")) {
      return ctx.reply("Invalid format. Send a channel link:\n\n`https://t.me/channel`\n`@channel`", {
        parse_mode: "Markdown",
      });
    }
    pendingFlows.delete(userId);
    await handleChannelJoinRequest(ctx, text);
    return;
  }

  if (flow.step === "phone") {
    let phone = text.replace(/[^\d+]/g, "");
    if (!phone.startsWith("+")) phone = "+" + phone;
    if (!/^\+\d{10,15}$/.test(phone)) {
      return ctx.reply("Invalid format. Enter your number with country code (example: `+8801234567890`):", {
        parse_mode: "Markdown",
      });
    }

    flow.phone = phone;
    flow.step = "connecting";
    pendingFlows.set(userId, flow);

    ctx.reply(
      `*Add Session — Step 2 of 2*\n\nConnecting to Telegram for \`${phone}\`...\n\nA verification code will be sent.`,
      { parse_mode: "Markdown" }
    );

    initiateSessionCreation(userId, flow).catch((err) => {
      logger.error(`Session creation failed for ${flow.phone}: ${err.message}`);
      pendingFlows.delete(userId);
      bot.telegram.sendMessage(flow.chatId, `Session creation failed:\n\n${err.message}\n\nUse /start to try again.`);
    });
    return;
  }

  if (flow.step === "code" || flow.step === "password") {
    if (flow.resolver) {
      const resolver = flow.resolver;
      flow.resolver = null;
      pendingFlows.set(userId, flow);
      resolver(text);
    }
    return;
  }
}

async function initiateSessionCreation(userId, flow) {
  const client = new TelegramClient(new StringSession(""), API_ID, API_HASH, {
    connectionRetries: 5,
    retryDelay: 1000,
    timeout: 60000,
    requestRetries: 3,
  });

  client.setLogLevel("none");
  flow.client = client;

  await client.start({
    phoneNumber: async () => flow.phone,

    phoneCode: async () => {
      return new Promise((resolve) => {
        flow.step = "code";
        flow.resolver = resolve;
        pendingFlows.set(userId, flow);
        bot.telegram.sendMessage(
          flow.chatId,
          `Verification code sent to \`${flow.phone}\`.\n\nEnter the code:`,
          { parse_mode: "Markdown" }
        );
      });
    },

    password: async (hint) => {
      return new Promise((resolve) => {
        flow.step = "password";
        flow.resolver = resolve;
        pendingFlows.set(userId, flow);
        const hintText = hint ? ` (hint: ${hint})` : "";
        bot.telegram.sendMessage(
          flow.chatId,
          `Two-factor authentication required${hintText}.\n\nEnter your 2FA password:`,
          { parse_mode: "Markdown" }
        );
      });
    },

    onError: (err) => logger.error(`Auth error for ${flow.phone}: ${err.message}`),
  });

  const userInfo = await client.getMe();
  const rawName = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim();
  let sessionName = rawName || null;

  if (!sessionName) {
    const existing = await getSessions();
    sessionName = `Account ${existing.length + 1}`;
  } else {
    const sanitized = sessionName.replace(/[/\\?%*:|"<>]/g, "-");
    const existing = await getSessions();
    const taken = existing.some((s) => s.name === sanitized);
    sessionName = taken ? `${sanitized} (${flow.phone.slice(-4)})` : sanitized;
  }

  const sessionString = client.session.save();

  await saveSession({
    name: sessionName,
    phone: flow.phone,
    userId: userInfo.id.toString(),
    username: userInfo.username || "N/A",
    firstName: userInfo.firstName || "N/A",
    lastName: userInfo.lastName || "",
    sessionString,
    createdAt: new Date().toISOString(),
  });

  await client.disconnect();
  pendingFlows.delete(userId);

  logger.ok(`Session created: ${sessionName}`);

  await bot.telegram.sendMessage(
    flow.chatId,
    `*Session Created*\n\nSession: ${sessionName}\nPhone: ${flow.phone}\nUser: ${rawName || "N/A"}\nUsername: @${userInfo.username || "None"}`,
    { parse_mode: "Markdown" }
  );

  pendingFlows.set(userId, { step: "phone", chatId: flow.chatId });

  bot.telegram.sendMessage(
    flow.chatId,
    `Add another account? Send the next phone number, or press Done.`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("Done", "back_to_menu")]]),
    }
  );
}

async function handleChannelJoinRequest(ctx, link) {
  const sessions = await getSessions();
  if (sessions.length === 0) {
    return ctx.reply("No sessions available. Add a session first.");
  }

  const joinedChannels = await getJoinedChannels();
  const alreadyJoined = [];
  for (const [name, channels] of Object.entries(joinedChannels)) {
    if (channels.some((ch) => ch.toLowerCase() === link.toLowerCase())) {
      alreadyJoined.push(name);
    }
  }

  const encodedLink = encodeURIComponent(link);
  let username = link;
  if (link.includes("t.me/")) username = "@" + link.split("t.me/")[1].split("?")[0].split("/")[0];
  else if (!link.startsWith("@")) username = "@" + link;

  if (alreadyJoined.length > 0) {
    const sessionList = alreadyJoined.map((s) => `- ${s}`).join("\n");
    return ctx.reply(
      `*Already Joined*\n\nChannel: \`${username}\`\n\nAlready joined by:\n${sessionList}\n\nForce join with all ${sessions.length} session?`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback(`Proceed — ${sessions.length} session`, `force_join_${encodedLink}`)],
          [Markup.button.callback("Cancel", "back_to_menu")],
        ]),
      }
    );
  }

  ctx.reply(
    `*Confirm Join*\n\nChannel: \`${username}\`\nSessions available: *${sessions.length}*\n\nProceed?`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback(`Proceed — ${sessions.length} session`, `force_join_${encodedLink}`)],
        [Markup.button.callback("Cancel", "back_to_menu")],
      ]),
    }
  );
}

async function processJoinRequest(ctx, link, isCallback) {
  const sessions = await getSessions();
  let msg;

  if (isCallback) {
    msg = await ctx.editMessageText(`Joining: \`${link}\`\n\nPlease wait...`, { parse_mode: "Markdown" });
  } else {
    msg = await ctx.replyWithMarkdown(`Joining: \`${link}\`\n\nPlease wait...`);
  }

  const results = [];
  let successCount = 0;

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    if (i > 0) await sleep(JOIN_DELAY_MS);
    try {
      const result = await joinChannelWithSession(session, link);
      if (result.success) {
        results.push(`+ ${session.name}`);
        successCount++;
      } else {
        results.push(`- ${session.name}: ${result.error}`);
      }
    } catch (err) {
      results.push(`- ${session.name}: ${err.message}`);
    }
  }

  const resultText =
    `*Join Results*\n\`${link}\`\n\n${results.join("\n")}\n\n` +
    `Success: ${successCount}/${sessions.length}`;

  const keyboard = Markup.inlineKeyboard([[Markup.button.callback("Back to Menu", "back_to_menu")]]);

  if (isCallback) {
    ctx.editMessageText(resultText, { parse_mode: "Markdown", ...keyboard });
  } else {
    bot.telegram.editMessageText(ctx.chat.id, msg.message_id, undefined, resultText, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  }
}

async function joinChannelWithSession(sessionData, link) {
  try {
    const client = new TelegramClient(
      new StringSession(sessionData.sessionString),
      API_ID,
      API_HASH,
      { connectionRetries: 3, retryDelay: 1000, timeout: 30000 }
    );
    client.setLogLevel("none");
    await client.connect();

    let username = link;
    if (link.includes("t.me/")) username = link.split("t.me/")[1].split("?")[0].split("/")[0];
    else if (link.startsWith("@")) username = link.substring(1);

    try {
      await client.invoke(new Api.channels.JoinChannel({ channel: username }));
    } catch {
      await client.invoke(new Api.messages.ImportChatInvite({ hash: username }));
    }

    await addJoined(sessionData.name, link);
    await client.disconnect();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function executeLeaveAll() {
  const sessions = await getSessions();
  const joinedChannels = await getJoinedChannels();
  const results = [];
  let totalSuccess = 0;
  let totalFail = 0;

  for (const session of sessions) {
    const channels = [...(joinedChannels[session.name] || [])];
    if (channels.length === 0) continue;

    let sessionSuccess = 0;
    let sessionFail = 0;

    try {
      const client = new TelegramClient(
        new StringSession(session.sessionString),
        API_ID,
        API_HASH,
        { connectionRetries: 3, retryDelay: 1000, timeout: 30000 }
      );
      client.setLogLevel("none");
      await client.connect();

      for (let li = 0; li < channels.length; li++) {
        const link = channels[li];
        if (li > 0) await sleep(2000);
        try {
          let username = link;
          if (link.includes("t.me/")) username = link.split("t.me/")[1].split("?")[0].split("/")[0];
          else if (link.startsWith("@")) username = link.substring(1);

          try {
            await client.invoke(new Api.channels.LeaveChannel({ channel: username }));
          } catch {
            const me = await client.getMe();
            const entity = await client.getEntity(username);
            await client.invoke(new Api.messages.DeleteChatUser({ chatId: entity.id, userId: me.id }));
          }

          await removeJoined(session.name, link);
          sessionSuccess++;
          totalSuccess++;
        } catch (err) {
          sessionFail++;
          totalFail++;
          logger.error(`Failed to leave: ${link} — ${session.name}: ${err.message}`);
        }
      }

      await client.disconnect();
    } catch (err) {
      logger.error(`Connection failed for session ${session.name}: ${err.message}`);
      sessionFail += channels.length;
      totalFail += channels.length;
    }

    results.push(`*${session.name}*: ${sessionSuccess} left, ${sessionFail} failed`);
  }

  return {
    text:
      `*Leave All — Complete*\n\n${results.join("\n")}\n\n` +
      `Total: ${totalSuccess} left, ${totalFail} failed`,
  };
}

async function processWebCommand(cmd) {
  logger.info(`Processing web command: ${cmd.type} — ${cmd._id}`);

  try {
    await convex.mutation("mutations:updateCommandStatus", { id: cmd._id, status: "running" });

    let result;

    if (cmd.type === "join") {
      const sessions = await getSessions();
      const results = [];
      let successCount = 0;
      for (let i = 0; i < sessions.length; i++) {
        if (i > 0) await sleep(JOIN_DELAY_MS);
        const r = await joinChannelWithSession(sessions[i], cmd.payload.link);
        if (r.success) {
          results.push({ session: sessions[i].name, success: true });
          successCount++;
        } else {
          results.push({ session: sessions[i].name, success: false, error: r.error });
        }
      }
      result = { results, successCount, total: sessions.length };
    }

    if (cmd.type === "leave_all") {
      const r = await executeLeaveAll();
      result = { message: r.text };
    }

    if (cmd.type === "delete_session") {
      await removeSession(cmd.payload.name);
      result = { deleted: cmd.payload.name };
    }

    if (cmd.type === "auth_start") {
      const flowId = cmd.payload.flowId;
      await convex.mutation("mutations:updateAuthFlow", { flowId, step: "waiting_code" });

      const flow = {
        phone: cmd.payload.phone,
        flowId,
        step: "connecting",
        chatId: null,
        isWebFlow: true,
      };
      pendingFlows.set(`web_${flowId}`, flow);

      initiateWebSessionCreation(flowId, flow).catch(async (err) => {
        logger.error(`Web session creation failed: ${err.message}`);
        await convex.mutation("mutations:updateAuthFlow", {
          flowId,
          step: "error",
          error: err.message,
        });
      });

      result = { started: true };
    }

    if (cmd.type === "auth_submit") {
      const flowId = cmd.payload.flowId;
      const flow = pendingFlows.get(`web_${flowId}`);
      if (flow && flow.resolver) {
        const resolver = flow.resolver;
        flow.resolver = null;
        pendingFlows.set(`web_${flowId}`, flow);
        resolver(cmd.payload.value);
        result = { submitted: true };
      } else {
        result = { error: "Flow not found or already resolved" };
      }
    }

    await convex.mutation("mutations:updateCommandStatus", { id: cmd._id, status: "done", result });
  } catch (err) {
    logger.error(`Command failed: ${cmd.type} — ${err.message}`);
    await convex.mutation("mutations:updateCommandStatus", {
      id: cmd._id,
      status: "error",
      result: { error: err.message },
    });
  }
}

async function initiateWebSessionCreation(flowId, flow) {
  const client = new TelegramClient(new StringSession(""), API_ID, API_HASH, {
    connectionRetries: 5,
    retryDelay: 1000,
    timeout: 60000,
  });
  client.setLogLevel("none");
  flow.client = client;

  await client.start({
    phoneNumber: async () => flow.phone,

    phoneCode: async () => {
      return new Promise(async (resolve) => {
        flow.step = "code";
        flow.resolver = resolve;
        pendingFlows.set(`web_${flowId}`, flow);
        await convex.mutation("mutations:updateAuthFlow", { flowId, step: "waiting_code" });
      });
    },

    password: async (hint) => {
      return new Promise(async (resolve) => {
        flow.step = "password";
        flow.resolver = resolve;
        pendingFlows.set(`web_${flowId}`, flow);
        await convex.mutation("mutations:updateAuthFlow", {
          flowId,
          step: "waiting_password",
          inputValue: hint || "",
        });
      });
    },

    onError: (err) => logger.error(`Web auth error: ${err.message}`),
  });

  const userInfo = await client.getMe();
  const rawName = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim();
  let sessionName = rawName || null;

  if (!sessionName) {
    const existing = await getSessions();
    sessionName = `Account ${existing.length + 1}`;
  } else {
    const sanitized = sessionName.replace(/[/\\?%*:|"<>]/g, "-");
    const existing = await getSessions();
    const taken = existing.some((s) => s.name === sanitized);
    sessionName = taken ? `${sanitized} (${flow.phone.slice(-4)})` : sanitized;
  }

  await saveSession({
    name: sessionName,
    phone: flow.phone,
    userId: userInfo.id.toString(),
    username: userInfo.username || "N/A",
    firstName: userInfo.firstName || "N/A",
    lastName: userInfo.lastName || "",
    sessionString: client.session.save(),
    createdAt: new Date().toISOString(),
  });

  await client.disconnect();
  pendingFlows.delete(`web_${flowId}`);

  await convex.mutation("mutations:updateAuthFlow", {
    flowId,
    step: "done",
    sessionName,
    result: sessionName,
  });

  logger.ok(`Web session created: ${sessionName}`);
}

async function pollWebCommands() {
  try {
    const cmds = await convex.query("queries:getPendingCommands");
    for (const cmd of cmds) {
      processWebCommand(cmd).catch(suppressOrLog);
    }
  } catch (err) {
    suppressOrLog(err);
  }
}

bot.catch((err, ctx) => {
  logger.error(`Unhandled bot error: ${err.message}`);
  if (ctx) ctx.reply("An error occurred. Please try again.").catch(() => {});
});

async function start() {
  logger.info("Initializing bot...");

  if (!BOT_TOKEN || !AUTHORIZED_USER_ID || !API_ID || !API_HASH || !CONVEX_URL) {
    logger.error("Missing required environment variables in data/.env");
    logger.error("Required: BOT_TOKEN, AUTHORIZED_USER_ID, API_ID, API_HASH, CONVEX_URL");
    process.exit(1);
  }

  logger.info("Launching Telegram bot...");
  await bot.launch();
  logger.ok("Bot is live and polling for updates");

  setInterval(pollWebCommands, 3000);
  logger.info("Web command polling started (3s interval)");

  await startHeartbeat();
  logger.info("Backend heartbeat started (15s interval)");
}

start().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});

process.once("SIGINT", () => { logger.warn("SIGINT received"); bot.stop("SIGINT"); });
process.once("SIGTERM", () => { logger.warn("SIGTERM received"); bot.stop("SIGTERM"); });
process.on("unhandledRejection", (reason) => suppressOrLog(reason));
process.on("uncaughtException", (err) => suppressOrLog(err));
