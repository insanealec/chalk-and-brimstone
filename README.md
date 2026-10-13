# Chalk & Brimstone

A browser game about summoning and binding spirits in 1893 Chicago, where a political machine of magicians runs City Hall. It's inspired by Jonathan Stroud's *Bartimaeus* trilogy, but all the spirits, characters and text are original.

## Running

Open `public/index.html` in a browser. There's no build step. You can also serve the repo with `python -m http.server 8765` and open `http://localhost:8765/public/`. Progress autosaves to `localStorage`.

## How it plays

- **Journal:** spend an hour studying to uncover lore fragments. Each one gives part of a spirit's requirements: syllables of its true name, its runes, and the incense it likes or hates. Each spirit's notebook sheet fills itself in from lore and from what happens in the chamber, and works out what it can by elimination.
- **Chamber:** pick a spirit, speak its true name syllable by syllable, and set out a circle, up to 3 runes and an incense.
  - Each syllable rings true, belongs elsewhere in the name, or means nothing. The notebook records all of it.
  - Wrong name: nothing answers, and the incense is wasted. If you happen to speak another spirit's name, that spirit answers instead.
  - Circle too weak for the spirit's class, or a required rune missing: the spirit breaks free.
  - Otherwise the binding is scored as wrong runes (−1 each), plus incense (liked +2, hated −2), plus how far the circle outclasses the spirit (+1 per tier, max +2). A score of 2 or more binds it **firmly**, 0–1 binds it **uneasily**, and below 0 it **breaks free**.
  - Your pentacle decides how hurt you get when a spirit breaks free, or when an uneasy one tests you.
  - **Overreaching:** if your notebook shows a perfect binding, you can gamble on holding a spirit one class too strong for your circle, with familiars bracing the circle to improve the odds. Success gives a strained servant that may break loose any night; failure is spectacular.
- **City:** a map of Chicago, starting Monday, April 3, 1893. Each district has places with things to do, and most can be wandered for random street encounters. Every action takes an hour. *The Chicago Clarion* prints the day's news, and current events (a packinghouse strike, a ward election, the World's Fair opening, a police crackdown) add new actions to particular places for a while and play out in stages depending on what you do. Your hidden standing with the Machine, the workers and the police shapes what's possible.
- **Workshop:** every incantation ends in a binding clause. *Of Service* makes a timed servant; later you learn *of the Vessel*, which seals a spirit into a tool (scrying glass, lantern, sword-cane, pocket watch, signet ring) whose power grows with the spirit inside, and *of the Familiar*, which binds a companion that follows you and helps. Both need a firm binding.
- **Ithzar:** a djinni bound to a rival magician starts taking an interest in you. It comments on your work (with footnotes), trades barbs with your familiar, and asks favors that build a hidden trust. Earn enough of it and you can work out how its master bound it, free it with a rite of Release, and, if you accept its terms, gain it as a second familiar that answers questions (not always truthfully) and runs the odd errand as a favor. One of its terms is that you let it go when it asks, and it will ask before the end.
- **Servants:** bound spirits run errands overnight (coin, stolen incense, gossip, spying) until their patience runs out. Uneasily bound spirits sometimes twist their orders against you.
- **City Hall:** a chain of commissions that raises your rank. Rank unlocks stronger circles, rarer incense and new districts. The last commission is the marid under the lake: you prepare it in the chamber, then row out to the Water Crib and call it up in a scene of its own. If your binding holds, you choose whether to hand it to City Hall or let it go back to sleep. Either ends the game.

## Development

- **Playtesting:** serve the folder (`python -m http.server 8765`) and open `http://localhost:8765/tools/playtest.html`. It plays whole games with a scripted player and summarizes them: win rate, when each commission lands, how long Ithzar stays, injuries, and each game's log. Games are seeded, so a seed always replays the same game, and nothing there touches your saved game.
- **Content checks:** the same page checks the game's data: lore facts match their spirits, names are unique and the right length, and commissions, events and districts only refer to things that exist. Run it after editing content.
- **Randomness:** game code must roll dice with `random()` from `js/engine/core.js` (not `Math.random()`), so seeded playtests stay reproducible.
- **Deploying:** the game is a static-assets Cloudflare Worker (`wrangler.jsonc`) that publishes only `public/`. `npx wrangler dev` runs it locally and `npx wrangler deploy` publishes it.

## Files

- `docs/DESIGN.md`: the design document. Vision, current systems and the roadmap.
- `public/`: the game itself, and the only folder that gets deployed. The paths below are inside it.

- `js/data.js`: all content (spirits, lore, items, errands, commissions). Add new spirits here.
- `js/districts.js`: city districts, their places and street encounters. The header comment documents the effect format.
- `js/events.js`: the calendar, the newspaper and current events.
- `js/ithzar.js`: Ithzar's lines, banter and story arc.
- `js/finale.js`: the text of the last summoning, at the Water Crib, and the two endings.
- `js/engine/`: the rules. `core.js` (state, saving, dice), `notebook.js` (lore and deduction), `spirits.js` (servants, errands, vessels, familiars), `companion.js` (Ithzar), `chamber.js` (summoning), `city.js` (calendar, events, places, effects), `day.js` (nightfall, commissions, market), `finale.js` (the last summoning).
- `js/ui/`: drawing the game. `shell.js` (stats, tabs, chronicle and most tabs), `chamber.js`, `city.js`.
- `js/main.js`: input handling and start-up.
- All of `js/` is plain scripts sharing one global scope, loaded in the order listed in `index.html` (and `tools/playtest.html`). A new script file must be added to both lists.
- `css/style.css`: styling.
- `tools/playtest.html`, `tools/playtest.js`: the playtest page, scripted player and content checks.
- `wrangler.jsonc`: Cloudflare Workers config.
- `public/_headers`: tells browsers to revalidate files on the live site, so updates are never mixed with stale files.
