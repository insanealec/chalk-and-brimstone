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
- **City:** a map of 1893 Chicago. Visiting a district costs an hour and brings up a random encounter with choices. Some choices need money, a rank, knowledge of a spirit or a bound servant of a certain class. Outcomes trade money, incense, lore, runes and health. Districts unlock with rank: Maxwell Street and the Levee from the start, LaSalle Street and the Union Stock Yards at Ward Magician, the Midway Plaisance at Alderman, and the Water Crib out in the lake at Commissioner.
- **Servants:** bound spirits run errands overnight (coin, stolen incense, gossip, spying) until their patience runs out. Uneasily bound spirits sometimes twist their orders against you.
- **City Hall:** a chain of commissions that raises your rank. Rank unlocks stronger circles, rarer incense and new districts. Binding the marid wins the game.

## Files

- `docs/DESIGN.md`: the design document. Vision, current systems and the roadmap.

- `js/data.js`: all content (spirits, lore, items, errands, commissions). Add new spirits here.
- `js/districts.js`: city districts and their encounters. The header comment documents the effect format.
- `js/game.js`: state, rules and rendering.
- `css/style.css`: styling.
