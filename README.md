# Chalk & Brimstone

A browser game about summoning and binding spirits in 1893 Chicago, where a political machine of magicians runs City Hall. It's inspired by Jonathan Stroud's *Bartimaeus* trilogy, but all the spirits, characters and text are original.

## Running

Open `index.html` in a browser. There's no build step. You can also serve the folder with `python -m http.server 8765`. Progress autosaves to `localStorage`.

## How it plays

- **Journal:** spend an hour studying to uncover lore fragments. Each one gives part of a spirit's requirements: syllables of its true name, its runes, and the incense it likes or hates. Each spirit's notebook sheet fills itself in from lore and from what happens in the chamber, and works out what it can by elimination.
- **Chamber:** pick a spirit, speak its true name syllable by syllable, and set out a circle, up to 3 runes and an incense.
  - Each syllable rings true, belongs elsewhere in the name, or means nothing. The notebook records all of it.
  - Wrong name: nothing answers, and the incense is wasted. If you happen to speak another spirit's name, that spirit answers instead.
  - Circle too weak for the spirit's class, or a required rune missing: the spirit breaks free.
  - Otherwise the binding is scored as wrong runes (−1 each), plus incense (liked +2, hated −2), plus how far the circle outclasses the spirit (+1 per tier, max +2). A score of 2 or more binds it **firmly**, 0–1 binds it **uneasily**, and below 0 it **breaks free**.
  - Your pentacle decides how hurt you get when a spirit breaks free, or when an uneasy one tests you.
- **City:** a map of Chicago, starting Monday, April 3, 1893. Each district has places with things to do, and most can be wandered for random street encounters. Every action takes an hour. *The Chicago Clarion* prints the day's news, and current events (a packinghouse strike, a ward election, the World's Fair opening, a police crackdown) add new actions to particular places for a while and play out in stages depending on what you do. Your hidden standing with the Machine, the workers and the police shapes what's possible.
- **Workshop:** every incantation ends in a binding clause. *Of Service* makes a timed servant; later you learn *of the Vessel*, which seals a spirit into a tool (scrying glass, lantern, sword-cane, pocket watch, signet ring) whose power grows with the spirit inside, and *of the Familiar*, which binds a companion that follows you and helps. Both need a firm binding.
- **Ithzar:** a djinni bound to a rival magician starts taking an interest in you. It comments on your work (with footnotes), trades barbs with your familiar, and asks favors that build a hidden trust. In time it may become a second familiar.
- **Servants:** bound spirits run errands overnight (coin, stolen incense, gossip, spying) until their patience runs out. Uneasily bound spirits sometimes twist their orders against you.
- **City Hall:** a chain of commissions that raises your rank. Rank unlocks stronger circles, rarer incense and new districts. Binding the marid wins the game.

## Files

- `docs/DESIGN.md`: the design document. Vision, current systems and the roadmap.

- `js/data.js`: all content (spirits, lore, items, errands, commissions). Add new spirits here.
- `js/districts.js`: city districts, their places and street encounters. The header comment documents the effect format.
- `js/events.js`: the calendar, the newspaper and current events.
- `js/ithzar.js`: Ithzar's lines, banter and story arc.
- `js/game.js`: state, rules and rendering.
- `css/style.css`: styling.
