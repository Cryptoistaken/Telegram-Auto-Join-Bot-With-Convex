<div align="center">

# Telegram Auto Join Bot

**Manage multiple Telegram accounts and automate channel joining — from your bot or a remote web panel.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Telegraf](https://img.shields.io/badge/Telegraf-4.16-26A5E4?style=flat-square&logo=telegram&logoColor=white)](https://telegraf.js.org)
[![GramJS](https://img.shields.io/badge/GramJS-2.26-26A5E4?style=flat-square&logo=telegram&logoColor=white)](https://gram.js.org)
[![Convex](https://img.shields.io/badge/Convex-1.12-EE342F?style=flat-square)](https://convex.dev)

</div>

---

## Overview

Telegram Auto Join Bot manages multiple Telegram user accounts and mass-joins channels across all of them simultaneously. Everything — account creation, OTP, 2FA, joining, leaving — works from the Telegram bot **and** from a hosted React web panel accessible from anywhere.

Convex acts as the bridge between the web panel and the bot. The bot runs on your machine or server as always. The web panel is hosted on Vercel for remote access.

---

## Architecture

```
Web Panel (Vercel)  ──►  Convex (bridge + DB)  ◄──  index.js (your machine)
```

- **Convex** — stores sessions, joined channels, and a command queue
- **index.js** — runs your Telegram bot as before, polls Convex every 3s for web commands, executes them with gramjs, writes results back
- **Web panel** — reads and writes Convex only, accessible from any device

---

## Project Structure

```
project/
├── index.js                 # Bot + Convex polling (main backend)
├── package.json
├── setup-apikey.mjs         # One-time run — generates your web login key
├── .env.example
├── data/
│   └── .env                 # Your environment variables
└── convex/
│   ├── schema.ts            # Database schema
│   ├── queries.ts           # Read operations
│   └── mutations.ts         # Write operations
└── web/                     # React frontend (deploy to Vercel)
    ├── src/
    │   ├── main.jsx
    │   └── App.jsx
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json
    └── .env.example
```

---

## Requirements

- **Node.js** 18 or higher
- **Bot token** — from [@BotFather](https://t.me/BotFather)
- **API credentials** — `API_ID` and `API_HASH` from [my.telegram.org](https://my.telegram.org)
- **Your user ID** — from [@userinfobot](https://t.me/userinfobot)
- **Convex account** — free at [convex.dev](https://convex.dev)
- **Vercel account** — free at [vercel.com](https://vercel.com)

---

## Setup

### 1 — Install bot dependencies

```bash
npm install
```

### 2 — Create your Convex project

```bash
npx convex dev
```

This will open a browser to log in or create a free Convex account, then create a project and print your `CONVEX_URL`. Keep the terminal open — it deploys schema changes automatically while running.

### 3 — Configure environment

```bash
cp .env.example data/.env
```

Open `data/.env` and fill in all values:

```env
BOT_TOKEN=your_bot_token
AUTHORIZED_USER_ID=your_telegram_user_id
API_ID=your_api_id
API_HASH=your_api_hash
CONVEX_URL=https://your-deployment.convex.cloud
JOIN_DELAY_SECONDS=3
```

### 4 — Deploy the Convex schema

```bash
npx convex deploy
```

### 5 — Generate your web login key

```bash
node setup-apikey.mjs
```

This generates a random API key, saves it to Convex, and prints it once. **Copy it** — this is your password for the web panel.

### 6 — Start the bot

```bash
npm start
```

The bot is now live and polling Convex every 3 seconds for web commands.

### 7 — Deploy the web panel

```bash
cd web
npm install
npx vercel
```

When prompted, set the environment variable:

```
VITE_CONVEX_URL = https://your-deployment.convex.cloud
```

Vercel gives you a URL like `https://tg-bot-panel.vercel.app`. Open it, enter your API key, and you have full remote access.

---

## Configuration

| Variable             | Required | Default | Description                                |
| -------------------- | :------: | :-----: | ------------------------------------------ |
| `BOT_TOKEN`          |   Yes    |    —    | Bot token from @BotFather                  |
| `AUTHORIZED_USER_ID` |   Yes    |    —    | Your Telegram user ID                      |
| `API_ID`             |   Yes    |    —    | API ID from my.telegram.org                |
| `API_HASH`           |   Yes    |    —    | API Hash from my.telegram.org              |
| `CONVEX_URL`         |   Yes    |    —    | Your Convex deployment URL                 |
| `JOIN_DELAY_SECONDS` |    No    |   `3`   | Delay between accounts when joining        |

---

## Usage

Both the Telegram bot and the web panel expose the same features.

### Telegram Bot

Send `/start` to open the menu:

```
Sessions      Add Session
Join Channel  Joined List
Leave All     Delete Session
```

### Web Panel

Log in with your API key at your Vercel URL. Tabs mirror the bot menu exactly — Sessions, Add Session, Join Channel, Joined List, Leave All.

---

### Adding an Account

Start from **Add Session** in the bot or web panel.

```
Step 1 — Phone number    +8801234567890
Step 2 — Verification    Enter the OTP sent to the account
Step 3 — 2FA (if set)    Enter the account password
```

The session is named from the account's Telegram display name. After saving, the bot asks for the next number — send one to continue or press **Done**.

---

### Joining a Channel or Group

Send one or more links in the bot, or enter a link in the Join Channel tab:

```
https://t.me/channelname
@channelname
```

The bot joins with all sessions sequentially with the configured delay.

---

### Leaving All Channels

Press **Leave All** in the bot or web panel, review the summary, and confirm. A 2-second delay is applied between leaves per session.

---

## Data Storage

All data is stored in Convex. The old JSON files (`joined_channels.json`, `sessions_info.json`) and `.session` files are no longer used.

| Convex Table      | Contents                                          |
| ----------------- | ------------------------------------------------- |
| `sessions`        | Name, phone, username, session string, created at |
| `joinedChannels`  | Session name → channel link mappings              |
| `commands`        | Web-issued command queue with status and results  |
| `authFlows`       | Active add-session flows (OTP state machine)      |
| `config`          | API key for web panel login                       |

---

## Security

- Only `AUTHORIZED_USER_ID` can interact with the Telegram bot.
- The web panel requires the API key generated by `setup-apikey.mjs`.
- Session strings stored in Convex are equivalent to logged-in credentials — keep your Convex project private.
- Add to `.gitignore` before pushing:

```gitignore
data/
node_modules/
web/node_modules/
web/.env
```

---

## Dependencies

### Bot

| Package    | Version  | Role                                       |
| ---------- | -------- | ------------------------------------------ |
| `telegraf` | ^4.16.3  | Telegram Bot API framework                 |
| `telegram` | ^2.26.21 | MTProto client for user account operations |
| `convex`   | ^1.12.0  | Convex client for DB + command queue       |
| `dotenv`   | ^17.3.1  | Environment variable loading               |

### Web

| Package     | Version | Role                    |
| ----------- | ------- | ----------------------- |
| `react`     | ^18.3.1 | UI framework            |
| `convex`    | ^1.12.0 | Real-time Convex client |
| `vite`      | ^5.4.1  | Build tool              |
