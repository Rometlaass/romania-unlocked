# ROMANIA: UNLOCKED — host guide

A live, projected cultural game: 8 levels, XP for teams, phones as voting buttons.

- `index.html` — the **host screen** (open on the laptop that goes to the projector)
- `play.html` — the **player page** (participants open it on their phones by scanning the QR code)
- `js/content.js` — all questions, facts and presenter notes (edit text here)

## 1. Put it online (needed for phones)

Phones must reach the site over the internet, so the folder has to be hosted on any static host with **https**. Two free options:

**GitHub Pages**
1. Create a new public repository and upload the whole folder's contents (keep the `css`, `js`, `vendor` folders).
2. Settings → Pages → Source: *Deploy from a branch* → `main` / root → Save.
3. After a minute the site is at `https://<your-user>.github.io/<repo>/`.

**Netlify**
1. Log in at netlify.com → *Add new site* → *Deploy manually*.
2. Drag the folder onto the page. You get an `https://….netlify.app` address.

Open the hosted `index.html` on the presentation laptop. The QR code and join link are generated automatically from that address.

## 2. How phones connect

- The host screen opens a **room** (4-letter code, e.g. `KQRT`) through the free public PeerJS relay. No accounts, no keys, no database.
- Players scan the QR, type their name, and get auto-placed in the smallest team (they can switch team on the waiting screen).
- Scores and progress are saved in the laptop browser, so an accidental refresh is safe. Phones reconnect by themselves.

**Do one real test before the event:** open the hosted `index.html` on the laptop, scan the QR with your phone, answer one question.

If the venue Wi-Fi blocks the connection, phones on mobile data usually still work. If nothing connects, the game still runs: the room votes by show of hands and you give XP from the host panel.

## 3. Rehearse offline (no phones needed)

In the folder, run `python3 -m http.server 8000`, then open:
- `http://localhost:8000/` (host)
- `http://localhost:8000/play.html?local#ROOM` in a few more tabs of the same browser (replace `ROOM` with the code on screen)

`?local` makes the tabs talk to the host directly inside the browser.

## 4. Running the show

| Key | Action |
|---|---|
| Space | next step (reveals first if a question is open) |
| Enter | reveal the answer |
| ← / → | previous / next step |
| T / R | start-pause / reset countdown |
| S | big scoreboard |
| J | join screen (QR) for latecomers |
| H | host panel (XP, teams, jump to any level, notes) |
| F / M | fullscreen / mute |
| U | undo last XP change |
| 1–6 | select a team · `+` gives it 100 XP, `−` takes 50 |
| Esc | close overlay / panel |

**Scoring.** When you reveal a question, each team gets XP based on the **share of its members who answered correctly** (100 XP if everyone on the team was right, 50 if half were) — team size doesn't matter. Bonus rounds in the final boss give ×2 / ×3. At the end of each level, the team that gained the most XP gets **+200 (level MVP)**. Everything can be adjusted or undone in the host panel.

**Presenter notes and answers** are in the host panel (H). The panel shows on the projector too if the screen is mirrored, so open it between questions.

**Level 4 volunteers:** select the volunteer's team with the on-screen chips, then press *Brave attempt +100* or *Nailed it +150*.

## 5. Photos

Photos load live from Wikimedia Commons (Creative Commons / public-domain licences). If a photo can't load, an embroidered-pattern placeholder appears instead — never a broken image. Full file list: host panel → *Photo credits*.

## 6. Facts

Every fact is in `js/content.js` with a source note in the presenter notes. Jokes and stereotypes are labelled on screen (JOKE / STEREOTYPE / TRADITION / MYTH / FACT).
