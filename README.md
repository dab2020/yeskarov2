# yesKaro

yesKaro is a cross-platform milestone escrow demo for Pakistani clients and freelancers. Buyers fund an agreement with a bank-transfer receipt, sellers submit milestone deliverables, buyers approve them, and an admin manually verifies simulated funding and payouts. Disputes use an admin-only AI recommendation before any final ruling.

> Demo notice: no real payment gateway or bank rail is connected. Every transfer and payout in the interface is clearly simulated.

## What is included

- Expo SDK 57, React Native, TypeScript, and Expo Router for iOS, Android, and static web
- Phone, tablet, and desktop layouts; project milestones use a two-pane tablet/desktop layout
- Buyer, seller, and hidden admin experiences with runnable seeded in-app data
- Four-step agreement wizard with editable AI terms, milestone allocation validation, and receipt upload
- Native recording via the SDK 57 `expo-audio` API and web recording via `MediaRecorder`, abstracted by `useVoiceRecorder()`
- Urdu/English language hints, two-minute limit, timer, recording indicator, transcription state, and editable transcript
- Hono Cloudflare Worker with D1, private R2 objects, PBKDF2 password hashing, signed JWTs, and role gates
- Groq Whisper transcription, per-user/IP rate limiting, 25-second timeout, size validation, and privacy-safe logs
- OpenRouter terms, milestone, and dispute prompts with server-side shape checks and a single strict JSON retry
- Full D1 schema, demo seed records, and Cloudflare configuration

The UI follows the supplied **yesKaro Interactive Prototype** in Figma: Poppins typography, the plum `#672844` brand palette, compact mobile layouts, cards, filters, headers, and bottom navigation. Exact exported Figma navigation and header assets are committed under `assets/figma`.

## Demo accounts

All seeded accounts use password `Demo123!`:

| Role | Email |
| --- | --- |
| Buyer | `buyer@yeskaro.demo` |
| Seller | `seller@yeskaro.demo` |
| Admin | `admin@yeskaro.demo` |

The client also provides one-tap local demo-role buttons, so interface review does not require a running Worker.

## Local setup on Windows

Use **PowerShell** from the repository directory. Requirements are Node.js 22.22.2 or newer and pnpm 11. If Node is not already installed, open PowerShell as Administrator and run:

```powershell
winget install OpenJS.NodeJS.LTS
corepack disable
npm install --global corepack@latest
corepack enable
corepack install --global pnpm@11.25.0
```

If you use **NVM for Windows**, select the project's supported Node version instead. This is also the fix if `node --version` reports Node 18 or pnpm fails with `TypeError: Invalid host defined options`:

```powershell
nvm install 22.22.2
nvm use 22.22.2
corepack disable
npm install --global corepack@latest
corepack enable
corepack install --global pnpm@11.25.0
```

Older Node 22 releases can bundle a Corepack version whose signing keys fail with `Cannot find matching keyid` when installing current pnpm releases. The `npm install --global corepack@latest` step upgrades Corepack before it downloads pnpm. Type `pnpm@11.25.0` exactly—PowerShell does not require a backslash before `@`.

Close and reopen PowerShell after `nvm use` if the old Node version remains active. `where.exe node` should then point to the NVM-managed Node installation. The repository includes `.nvmrc`, and `package.json` enforces the minimum Node version.

Close and reopen PowerShell after installing Node.js. Then confirm the tools and install the project:

```powershell
node --version
pnpm --version
pnpm install
Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
```

Create `.dev.vars` for local Worker secrets. This file is excluded from Git:

```powershell
@'
JWT_SECRET=replace-with-a-long-random-value
OPENROUTER_API_KEY=your-openrouter-key
GROQ_API_KEY=your-groq-key
'@ | Set-Content -LiteralPath '.dev.vars' -Encoding utf8
```

Initialize and seed the local D1 database:

```powershell
pnpm db:migrate:local
pnpm db:seed:local
```

Run the Worker and Expo in two PowerShell windows opened in the repository directory.

Terminal 1 — Cloudflare Worker:

```powershell
pnpm worker:dev
```

Terminal 2 — Expo web app:

```powershell
pnpm web
```

The web app normally opens at `http://localhost:8081` and calls the Worker at `http://localhost:8787`. If Expo selects a different port, update `ALLOWED_ORIGIN` in `wrangler.toml`. To use a different Worker URL, set `EXPO_PUBLIC_API_URL` in `.env.local`, then restart Expo.

For Android, start an Android Studio emulator or connect a device with USB debugging enabled, then run:

```powershell
pnpm android
```

Native iOS builds cannot run locally on Windows. Use Expo Go for compatible development workflows or an EAS cloud build from Windows.

If PowerShell blocks `pnpm.ps1` because of the execution policy, use `pnpm.cmd` in the same commands—for example, `pnpm.cmd install` and `pnpm.cmd web`.

## Voice transcription

Create a Groq account and API key in the Groq console, then store it only as a Worker secret:

```bash
pnpm wrangler secret put GROQ_API_KEY
```

`POST /api/ai/transcribe` accepts `multipart/form-data`:

- `file`: required audio file; web sends WebM/Opus, native sends M4A
- `language`: optional `ur` or `en`; omit it for automatic detection
- maximum file size: 25 MB
- rate limit: five requests per authenticated user or source IP per rolling minute

Successful response:

```json
{
  "transcript": "Editable transcript text",
  "detectedLanguage": "ur"
}
```

The Worker forwards audio to Groq using the configurable `GROQ_WHISPER_MODEL` (default `whisper-large-v3`). It logs duration, byte count, language, status, and errors—but never audio content or transcript text.

The client flow composes as follows:

`record → /api/ai/transcribe → user edits transcript → /api/ai/structure-terms → user edits structured terms`

### Manual bilingual recording check

1. Start the Worker and client with valid Groq/OpenRouter secrets.
2. Open **New agreement → Terms**, select **Urdu**, and record a 10–20 second Urdu project description.
3. Stop recording, confirm the transcript appears, edit one phrase, and choose **Structure with AI**.
4. Confirm scope, deliverables, exclusions, deadline, amount, and PKR currency are editable.
5. Repeat with **English** selected.
6. Confirm recording stops at 02:00 and a clear UI error appears for denied permission or failed transcription.

This checklist requires a real microphone and valid provider keys; it cannot be completed by the automated build verification alone.

## Cloudflare resources and deployment

Authenticate and create the resources:

```bash
pnpm wrangler login
pnpm wrangler d1 create yeskaro-db
pnpm wrangler r2 bucket create yeskaro-files
```

Copy the returned D1 database ID into `wrangler.toml`, then apply and seed the remote database:

```bash
pnpm wrangler d1 migrations apply yeskaro-db --remote
pnpm wrangler d1 execute yeskaro-db --remote --file=worker/seed.sql
```

Set production secrets:

```bash
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put OPENROUTER_API_KEY
pnpm wrangler secret put GROQ_API_KEY
```

Adjust `ALLOWED_ORIGIN`, `OPENROUTER_MODEL`, and `GROQ_WHISPER_MODEL` in `wrangler.toml`, then deploy:

```bash
pnpm worker:deploy
```

Set `EXPO_PUBLIC_API_URL` to the deployed Worker URL and build the static site:

```bash
pnpm export:web
```

Create a Cloudflare Pages project connected to the repository with:

- Build command: `pnpm export:web`
- Output directory: `dist`
- Environment variable: `EXPO_PUBLIC_API_URL=https://<worker-name>.<account>.workers.dev`

No OpenRouter, Groq, JWT, or bank data secrets belong in Expo or Pages environment variables.

## Useful checks

```bash
pnpm typecheck
pnpm export:web
```

The Worker health endpoint is `GET /api/health`. The complete endpoint implementation lives in `worker/index.ts`, the schema in `worker/migrations/0001_initial.sql`, and seed data in `worker/seed.sql`.
