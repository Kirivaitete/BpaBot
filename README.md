# 🤖 nightcore_mizo

WhatsApp bot — **Baileys** + **Gemini AI**. Mizo quiz, game, sticker, group tools, IG downloader, lyrics leh a dangte nen.

👑 Creator: **Bawihpuia**

---

## ✨ Features

- 🧠 Gemini AI chat (model 2 fallback - pakhat a buai chuan a pahnih hman a ni)
- 🎯 Mizo Quiz, TicTacToe, RPS, Puzzle game
- 🖼️ Sticker / toimg / tovid / emoji mix
- 📥 `/ig` Instagram Reels/Post, `/fb` Facebook video, `/wadl` media download, `/sent` status download
- 🎵 `/lyrics <hla hming>`, 🌐 Translate, 🤖 `/tobebot` (mi dangte bot ni ve tir)
- 👥 Group tools: welcome/bye, anti-badword, warn, kick, rank
- 🗑️ Anti-delete (Unsent message detect)
- ⚙️ Public / Self mode

---

## 📋 Requirements

| Thil | Version |
|------|---------|
| Node.js | 18 aia sang (20 / 22 a tha) |
| Git | `npm install` ah a kal tul thei |
| ffmpeg | Sticker / tovid atan (a awm lo chuan `ffmpeg-static` in a kal ang) |

---

## 🚀 Panel ah host dan (Pterodactyl etc.)

1. **Zip download** la, panel **File Manager** ah upload la **Unarchive** rawh.
2. `.env.example` hi **`.env`** ah rename la, hei hi dah rawh:
   ```env
   GEMINI_API_KEY=i_gemini_api_key
   ```
3. **Startup command**: `npm install && npm start`
   (Install zawh veleh `npm start` mai hmang rawh.)
4. Bot **Start** la, **Console** en rawh.

---

## 🔗 Pairing (Link Device)

1. Panel ah file upload la **Start** hmet rawh.
2. Console ah hei hi a lo lang ang:
   ```
   📱 WhatsApp number dah rawh (country code nen, + hmang lo):
   ```
3. **I duh number** (country code nen, `+` hmang lo) dah la **Enter** hmet rawh. Number engpawh type theih a ni.
4. **PAIRING CODE** a lo chhuak ang (entirnan `ABCD-EFGH`).
5. WhatsApp ah: **Settings → Linked Devices → Link a Device → Link with phone number instead** → code dah rawh.
6. Console ah `ONLINE` a lo lang chuan a zo!

> 💡 Console input hman theih loh panel a nih chuan `.env` ah `PAIRING_NUMBER=` dah rawh.

**Browser:** `["Ubuntu", "Chrome", "20.0.04"]`

---

## 🔑 Gemini API Key

1. https://aistudio.google.com/apikey ah kal la **Create API key** hmet rawh.
2. `.env` file ah `GEMINI_API_KEY=` hnu ah dah rawh.
3. Model thlak duh chuan `GEMINI_MODEL_1` / `GEMINI_MODEL_2` dah rawh.

---

## 📥 Download / Lyrics / Blacklist / Tobebot

| Command | Eng nge a tih |
|---------|---------------|
| `/ig <link>` | Instagram Reels / Post download |
| `/fb <link>` | Facebook video download |
| `/wadl` | Thlalak / Video / Audio / Sticker / File / Status ah reply la `/wadl` ti rawh (`/wadl doc` = file in) |
| `/sent` | I mahni status (up tawh) bot in download a, i DM ah a thawn |
| `/sent` *(status ah reply)* | Status reply a download a, DM ah thawn |
| `/sent auto` / `/sent off` | I status thar zawng zawng ka thawn zel ang / tihtawp |
| `/lyrics <hla hming>` | Hla lyrics (`/lyrics hla - phuahtu` pawh a ni) |
| `/blacklist @user` | Bot hmang thei lo tur a siam (Creator only) |
| `/unblack @user` | Blacklist atang a la chhuak |
| `/black` | Blacklist a ni te list en |
| `/tobebot [number]` | WhatsApp number automatic in link a, Pairing Code DM ah a thawn → bot a ni ve |
| `/stopbot` | Sub-bot tihtawp / unlink |
| `/botlist` | Sub-bot list (Creator only) |

> ℹ️ `/sent` hian bot number i **contact ah save** a, i status a hmuh hunah chauh a hnial thei (WhatsApp rule).
> 🚫 OnceView / View-once download hi a **awm tawh lo**.

### 🤖 /tobebot engtin nge?
1. Mi tu pawhin bot ah `/tobebot` (emaw `/tobebot 919xxxxxxxxx`) ti rawh. Mahni number chauh a link theih (Creator ni lo chuan).
2. Bot in **Pairing Code** a siam a, DM ah a thawn.
3. WhatsApp → **Linked Devices → Link a Device → Link with phone number instead** → code dah rawh.
4. Link zo chuan a number hi bot a ni ta! `sessions/` folder ah a vawng a, bot restart hunah a lo online leh ang.
5. Limit: `.env` ah `MAX_SUBBOTS=10` (default 10).

## 💻 Local / Termux

```bash
git clone https://github.com/<i-username>/<repo-name>.git
cd <repo-name>
npm install
cp .env.example .env     # a chhungah API key dah rawh
npm start
```

---

## 🛠️ Buaina chingte

| Buaina | Dawhtheihna |
|--------|-------------|
| `❌ GEMINI_API_KEY .env ah a awm lo` | `.env` file siam la key dah rawh |
| `❌ Model a awm lo` | `.env` ah `GEMINI_MODEL_1/2` thlak rawh |
| `Logged out!` | `auth_info` folder delete la restart rawh, pairing hmasa lamin ti nawn rawh |
| Sticker a thlen loh | ffmpeg install rawh (Termux: `pkg install ffmpeg`) |
| `npm install` a fail | Panel ah Git a awm lo ang, host hnenah Git enable tir rawh |

---

## 📁 Files

```
index.js        → Bot code
package.json    → Dependencies
.env.example    → .env atana template
.gitignore      → GitHub ah chhawn lo tur
README.md       → He file
```

⚠️ **`.env`** leh **`auth_info/`** hi GitHub ah **upload kher suh** (.gitignore in a block tawh).

--- 

## 📜 License

MIT © Bawihpuia
