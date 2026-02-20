<div align="center">

# Telegram Auto Join Bot

**Manage multiple Telegram accounts and automate channel joining — from your Telegram bot or a remote web panel.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Telegraf](https://img.shields.io/badge/Telegraf-4.16-26A5E4?style=flat-square&logo=telegram&logoColor=white)](https://telegraf.js.org)
[![GramJS](https://img.shields.io/badge/GramJS-2.26-26A5E4?style=flat-square&logo=telegram&logoColor=white)](https://gram.js.org)
[![Convex](https://img.shields.io/badge/Convex-1.12-EE342F?style=flat-square)](https://convex.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

![Demo](https://img.shields.io/badge/Web_Panel-Vercel-black?style=flat-square&logo=vercel)

</div>

---

## Overview

Telegram Auto Join Bot lets you manage multiple Telegram user accounts and mass-join channels across all of them simultaneously. Everything — account creation, OTP verification, 2FA, joining, and leaving — works from both the **Telegram bot** and a **hosted React web panel** accessible from any device.

[Convex](https://convex.dev) acts as the real-time bridge between the web panel and the bot backend. The bot runs on your own machine or server. The web panel deploys to Vercel for remote access from anywhere.

---

## Architecture

```
Web Panel (Vercel)
      │
      ▼  WebSocket (real-time)
  Convex DB
  (command queue + session store)
      │
      ▼  WebSocket (real-time)
  index.js
  (your machine / server)
      │
      ▼  MTProto
  Telegram accounts
```

- **Convex** — real-time database storing sessions, joined channels, and a command queue. The web panel and backend both connect via persistent WebSocket — no polling.
- **index.js** — runs the Telegram bot and listens for web commands via Convex. Executes joins/leaves using GramJS (MTProto), writes results back instantly.
- **Web panel** — React app on Vercel. Reads and writes Convex only — accessible from any device, no server required.

---

## Features

- Add unlimited Telegram accounts (sessions) with phone + OTP + optional 2FA
- Join public channels (`@username`, `t.me/channel`) and private invite links (`t.me/+hash`)
- Mass-join with all sessions simultaneously with configurable delay
- Leave all tracked channels in one click
- Full remote control via web panel (Vercel) — no need to be near the machine
- Real-time command execution via WebSocket — no polling delay
- Multiple authorized Telegram user IDs supported
- All data stored in Convex — no local JSON files or `.session` files

---

## Project Structure

```
telegram-auto-join-bot/
├── index.js                 # Bot backend — handles Telegram + Convex commands
├── package.json
├── setup-apikey.mjs         # One-time run — generates your web panel login key
├── .env.example             # Template for your environment variables
├── data/
│   └── .env                 # Your actual credentials (gitignored)
├── convex/
│   ├── schema.ts            # Convex database schema
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
- **Telegram Bot token** — create one via [@BotFather](https://t.me/BotFather)
- **Telegram API credentials** — `API_ID` and `API_HASH` from [my.telegram.org](https://my.telegram.org)
- **Your Telegram user ID** — get it from [@userinfobot](https://t.me/userinfobot)
- **Convex account** — free at [convex.dev](https://convex.dev)
- **Vercel account** — free at [vercel.com](https://vercel.com) (for the web panel)

---

## Setup

### 1 — Clone and install

```bash
git clone https://github.com/Cryptoistaken/Telegram-Auto-Join-Bot-With-Convex.git
cd Telegram-Auto-Join-Bot-With-Convex
npm install
```

### 2 — Create your Convex project

```bash
npx convex dev
```

This opens a browser to log in or create a free Convex account, creates a project, and prints your `CONVEX_URL`. Keep this terminal open — it auto-deploys schema changes while developing.

### 3 — Configure environment

```bash
cp .env.example data/.env
```

Open `data/.env` and fill in all values:

```env
BOT_TOKEN=your_bot_token_from_botfather
AUTHORIZED_USER_ID=123456789
API_ID=your_api_id
API_HASH=your_api_hash
CONVEX_URL=https://your-deployment.convex.cloud
JOIN_DELAY_SECONDS=3
```

> **Multiple authorized users:** Comma-separate the IDs:
> ```env
> AUTHORIZED_USER_ID=123456789,987654321,555555555
> ```

### 4 — Deploy Convex schema

```bash
npx convex deploy
```

### 5 — Generate your web panel login key

```bash
node setup-apikey.mjs
```

This generates a random API key, saves it to Convex, and prints it once. **Copy it** — this is your password for the web panel.

### 6 — Start the bot

```bash
npm start
```

You should see:

```
[INFO]  Initializing bot...
[INFO]  Backend heartbeat started (15s interval)
[INFO]  Web command watcher started (real-time)
[INFO]  Launching Telegram bot...
[OK]    Bot launched (polling for updates)
```

### 7 — Deploy the web panel

```bash
cd web
npm install
npx vercel
```

When Vercel asks for environment variables, set:

```
VITE_CONVEX_URL = https://your-deployment.convex.cloud
```

Vercel gives you a URL like `https://your-project.vercel.app`. Open it, enter your API key, and you have full remote access from any device.

---

## Configuration

| Variable             | Required | Default | Description                                      |
| -------------------- | :------: | :-----: | ------------------------------------------------ |
| `BOT_TOKEN`          |   Yes    |    —    | Bot token from @BotFather                        |
| `AUTHORIZED_USER_ID` |   Yes    |    —    | Comma-separated Telegram user ID(s)              |
| `API_ID`             |   Yes    |    —    | API ID from my.telegram.org                      |
| `API_HASH`           |   Yes    |    —    | API Hash from my.telegram.org                    |
| `CONVEX_URL`         |   Yes    |    —    | Your Convex deployment URL                       |
| `JOIN_DELAY_SECONDS` |    No    |   `3`   | Delay in seconds between accounts when joining   |

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

Log in with your API key at your Vercel URL. Tabs mirror the bot menu — Sessions, Add Session, Join Channel, Joined, Leave All.

---

### Adding an Account

Open **Add Session** from the bot or web panel:

```
Step 1 — Enter phone number    e.g. +8801234567890
Step 2 — Enter OTP             sent to the Telegram account
Step 3 — Enter 2FA password    (only if the account has 2FA enabled)
```

The session is named from the account's Telegram display name and saved to Convex immediately. From the bot, you can add another account right after or press **Done**.

---

### Joining a Channel or Group

Send a link in the bot chat, or enter it in the **Join Channel** tab:

```
https://t.me/channelname        ← public channel
@channelname                    ← public channel
https://t.me/+AbCdEfGhIjKl      ← private invite link
```

The bot joins with all sessions sequentially, with the configured delay between each.

---

### Leaving All Channels

Press **Leave All** in the bot or web panel, review the summary, and confirm. A 2-second delay is applied between leaves to avoid rate limiting.

---

## Data Storage

All data is stored in Convex — no local files, no `.session` files, no JSON.

| Table            | Contents                                               |
| ---------------- | ------------------------------------------------------ |
| `sessions`       | Account name, phone, username, session string, created |
| `joinedChannels` | Session name → channel link mappings                   |
| `commands`       | Web-issued command queue with status and results       |
| `authFlows`      | Active add-session flows (OTP/2FA state machine)       |
| `config`         | Web panel API key and backend heartbeat timestamp      |

---

## Security

- Only IDs listed in `AUTHORIZED_USER_ID` can interact with the Telegram bot.
- The web panel requires the API key generated by `setup-apikey.mjs` to log in.
- Session strings stored in Convex are equivalent to full login credentials — **keep your Convex project private and never share your `CONVEX_URL` with others.**
- `data/.env` is gitignored and will never be committed.
- Never commit real credentials — always use the `.env.example` template as reference.

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository at [github.com/Cryptoistaken/Telegram-Auto-Join-Bot-With-Convex](https://github.com/Cryptoistaken/Telegram-Auto-Join-Bot-With-Convex)
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test them
4. Commit with a clear message: `git commit -m "feat: add my feature"`
5. Push and open a Pull Request

Please open an issue first for major changes so we can discuss the approach.

---

## License

MIT — see [LICENSE](LICENSE) for details.
